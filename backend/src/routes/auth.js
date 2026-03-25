import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'
import { SECRET } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

function getMailTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 587,
    secure: false,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY,
    },
  })
}

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password || !name) return res.status(400).json({ error: 'Champs manquants' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(400).json({ error: 'Email déjà utilisé' })

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, password: hash, name, isApproved: true } })
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, isApproved: user.isApproved },
    SECRET,
    { expiresIn: '7d' }
  )
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, isApproved: user.isApproved, zoomLevel: user.zoomLevel } })
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
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, isApproved: user.isApproved, zoomLevel: user.zoomLevel } })
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requis' })

  const user = await prisma.user.findUnique({ where: { email } })
  // Réponse identique que l'email existe ou non (sécurité)
  if (!user) return res.json({ message: 'Si cet email existe, un lien a été envoyé.' })

  // Invalider les anciens tokens non utilisés
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  })

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  })

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`

  const transporter = getMailTransporter()
  await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <p>Bonjour ${user.name},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p><a href="${resetLink}">Cliquez ici pour définir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  })

  res.json({ message: 'Si cet email existe, un lien a été envoyé.' })
})

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Champs manquants' })
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8 caractères min.)' })

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!record || record.used || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Lien invalide ou expiré' })
  }

  const hash = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: record.userId }, data: { password: hash } })
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } })

  res.json({ message: 'Mot de passe mis à jour.' })
})

export default router
