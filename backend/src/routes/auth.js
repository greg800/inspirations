import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { SECRET } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password || !name) return res.status(400).json({ error: 'Champs manquants' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(400).json({ error: 'Email déjà utilisé' })

  const hash = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { email, password: hash, name } })
  res.json({ message: 'Compte créé. En attente de validation par l\'administrateur.' })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, isApproved: user.isApproved },
    SECRET,
    { expiresIn: '7d' }
  )
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, isApproved: user.isApproved } })
})

export default router
