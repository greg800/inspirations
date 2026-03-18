import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import contentRoutes from './routes/content.js'
import adminRoutes from './routes/admin.js'
import reviewRoutes from './routes/reviews.js'
import tagsRouter from './routes/tags.js'
import linkPreviewRouter from './routes/link-preview.js'
import votesRouter from './routes/votes.js'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

// CORS : dev uniquement (en prod, même origine)
if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173' }))
}
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/content/:id/reviews', reviewRoutes)
app.use('/api/tags', tagsRouter)
app.use('/api/link-preview', linkPreviewRouter)
app.use('/api/content/:id/votes', votesRouter)

// En production : servir le frontend buildé
if (isProd) {
  const distPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(distPath))
  // SPA fallback — toute route non-API renvoie index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => console.log(`Backend : http://localhost:${PORT}`))
