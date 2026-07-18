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
import storiesRouter from './routes/stories.js'
import premisesRouter from './routes/premises.js'
import depthsRouter from './routes/depths.js'
import problemsRouter from './routes/problems.js'
import principleRouter from './routes/principle.js'
import characterRouter from './routes/character.js'
import conflictRouter from './routes/conflict.js'
import sequenceRouter from './routes/sequence.js'
import transformationRouter from './routes/transformation.js'
import dilemmaRouter from './routes/dilemma.js'
import receptionRouter from './routes/reception.js'
import weaknessRouter from './routes/weakness.js'
import desireRouter from './routes/desire.js'
import adversaryRouter from './routes/adversary.js'
import planRouter from './routes/plan.js'
import confrontationRouter from './routes/confrontation.js'
import awarenessRouter from './routes/awareness.js'
import equilibriumRouter from './routes/equilibrium.js'
import storyContextRouter from './routes/storyContext.js'
import aiRouter from './routes/ai.js'

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
app.use('/api/stories', storiesRouter)
app.use('/api/stories/:storyId/premises', premisesRouter)
app.use('/api/stories/:storyId/depths', depthsRouter)
app.use('/api/stories/:storyId/problems', problemsRouter)
app.use('/api/stories/:storyId/principle', principleRouter)
app.use('/api/stories/:storyId/character', characterRouter)
app.use('/api/stories/:storyId/conflict', conflictRouter)
app.use('/api/stories/:storyId/sequence', sequenceRouter)
app.use('/api/stories/:storyId/transformation', transformationRouter)
app.use('/api/stories/:storyId/dilemma', dilemmaRouter)
app.use('/api/stories/:storyId/reception', receptionRouter)
app.use('/api/stories/:storyId/weakness', weaknessRouter)
app.use('/api/stories/:storyId/desire', desireRouter)
app.use('/api/stories/:storyId/adversary', adversaryRouter)
app.use('/api/stories/:storyId/plan', planRouter)
app.use('/api/stories/:storyId/confrontation', confrontationRouter)
app.use('/api/stories/:storyId/awareness', awarenessRouter)
app.use('/api/stories/:storyId/equilibrium', equilibriumRouter)
app.use('/api/stories/:storyId/context-summary', storyContextRouter)
app.use('/api/ai', aiRouter)

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
