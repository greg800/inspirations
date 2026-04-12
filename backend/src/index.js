import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth.js'
import contentRoutes from './routes/content.js'
import adminRoutes from './routes/admin.js'
import reviewRoutes from './routes/reviews.js'
import tagsRouter from './routes/tags.js'
import linkPreviewRouter from './routes/link-preview.js'
import votesRouter from './routes/votes.js'
import usersRouter from './routes/users.js'
import activityRouter from './routes/activity.js'
import notificationsRouter from './routes/notifications.js'
import bubblesRouter from './routes/bubbles.js'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

// CORS : dev uniquement (en prod, même origine)
if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173' }))
}
app.use(express.json())
app.use('/uploads', express.static(process.env.UPLOADS_PATH || path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/content/:id/reviews', reviewRoutes)
app.use('/api/tags', tagsRouter)
app.use('/api/link-preview', linkPreviewRouter)
app.use('/api/content/:id/votes', votesRouter)
app.use('/api/users', usersRouter)
app.use('/api/activity', activityRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/bubbles', bubblesRouter)

// En production : servir le frontend buildé
if (isProd) {
  const distPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(distPath))
  // SPA fallback — toute route non-API renvoie index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Seed idempotent : créer la bulle CastelGreg et y rattacher TOUS les membres + contenus
// Safe à chaque redémarrage — ne duplique jamais grâce aux skipDuplicates / upsert
async function seedCastelGreg() {
  const prisma = new PrismaClient()
  try {
    // Trouver ou créer la bulle
    let bubble = await prisma.bubble.findFirst({ where: { name: 'CastelGreg' } })

    if (!bubble) {
      const firstUser = await prisma.user.findFirst({ orderBy: { id: 'asc' } })
      if (!firstUser) { console.log('Seed CastelGreg : aucun utilisateur trouvé, skip.'); return }
      bubble = await prisma.bubble.create({
        data: { name: 'CastelGreg', createdById: firstUser.id },
      })
      console.log('✅ Bulle CastelGreg créée')
    }

    // Ajouter TOUS les utilisateurs comme membres (skipDuplicates = idempotent)
    const users = await prisma.user.findMany()
    await prisma.bubbleMembership.createMany({
      data: users.map(u => ({ userId: u.id, bubbleId: bubble.id })),
      skipDuplicates: true,
    })

    // Rattacher tout le contenu orphelin à CastelGreg
    await prisma.content.updateMany({ where: { bubbleId: null }, data: { bubbleId: bubble.id } })

    console.log(`✅ Bulle CastelGreg : ${users.length} membres, contenus orphelins rattachés`)
  } catch (err) {
    console.error('Erreur seed CastelGreg:', err)
  } finally {
    await prisma.$disconnect()
  }
}


app.listen(PORT, async () => {
  console.log(`Backend : http://localhost:${PORT}`)
  await seedCastelGreg()
})
