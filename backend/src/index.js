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

app.listen(PORT, () => {
  console.log(`Backend : http://localhost:${PORT}`)
})
