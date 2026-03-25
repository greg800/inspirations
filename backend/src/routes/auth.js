import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { Resend } from 'resend'
import { PrismaClient } from '@prisma/client'
import { SECRET } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FOOTER = `
  <div style="margin-top:40px; padding-top:20px; border-top:1px solid #e8e0d8; text-align:center;">
    <img src="https://inspirations.top/logo.png" alt="Inspirations" width="48" height="48" style="display:inline-block;"/>
    <div style="margin-top:8px; font-size:12px; color:#999;">inspirations.top</div>
  </div>
`

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

  resend.emails.send({
    from: 'Inspirations <noreply@inspirations.top>',
    to: user.email,
    subject: 'Félicitations, ton temps libre est en danger',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #2d1a0e; line-height: 1.6;">
        <p>Bonjour ${user.name},</p>
        <p>Ton compte est créé — bienvenue dans le groupe !</p>
        <p>Inspirations.top, c'est l'endroit où on partage ce qui vaut vraiment le coup&nbsp;: livres, films, podcasts… les trucs qu'on recommanderait à un ami autour d'un café.</p>
        <p><strong>Pour bien démarrer&nbsp;:</strong></p>
        <p>📱 <strong>Installe l'app sur ton téléphone</strong><br/>
        Ouvre inspirations.top dans ton navigateur → "Ajouter à l'écran d'accueil". Tu auras l'app en un tap, sans passer par un store.</p>
        <p>🔍 <strong>Explore la galerie</strong><br/>
        Filtre par support, genre ou contributeur. Trie par date ou par note. Zoom in/out sur les vignettes à ta convenance.</p>
        <p>✨ <strong>Partage ton premier contenu</strong><br/>
        Clique sur "+" et ajoute un livre, film ou podcast qui t'a marqué. Tu peux coller une URL pour préremplir les champs automatiquement — c'est rapide.</p>
        <p>👍 <strong>Réagis aux partages des autres</strong><br/>
        Vote, laisse un avis, donne une note. C'est ça qui fait vivre l'endroit.</p>
        <p>L'onglet Activité te tient au courant des derniers ajouts et avis du groupe.</p>
        <p>Bonne exploration !<br/>Greg</p>
        ${EMAIL_FOOTER}
      </div>
    `,
  }).catch(() => {}) // ne pas bloquer la réponse si l'email échoue

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

  await resend.emails.send({
    from: 'Inspirations <noreply@inspirations.top>',
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #2d1a0e; line-height: 1.6;">
        <p>Bonjour ${user.name},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p><a href="${resetLink}" style="color:#3d1f0e; font-weight:bold;">Cliquez ici pour définir un nouveau mot de passe</a></p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        ${EMAIL_FOOTER}
      </div>
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
