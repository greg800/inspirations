import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'
import { requireAuth } from '../middleware/auth.js'
import { SECRET } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FOOTER = `
  <div style="margin-top:40px; padding-top:20px; border-top:1px solid #e8e0d8; text-align:center;">
    <img src="https://inspirations.top/logo.png?v=3" alt="Inspirations" width="72" height="72" style="display:inline-block;"/>
    <div style="margin-top:8px; font-size:12px;"><a href="https://inspirations.top" style="color:#999; text-decoration:none;">inspirations.top</a></div>
  </div>
`

// GET /api/bubbles/mine — bulles de l'utilisateur connecté
router.get('/mine', requireAuth, async (req, res) => {
  const memberships = await prisma.bubbleMembership.findMany({
    where: { userId: req.user.id },
    include: {
      bubble: {
        include: {
          _count: { select: { members: true, contents: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const bubbles = memberships.map(m => ({
    id: m.bubble.id,
    name: m.bubble.name,
    memberCount: m.bubble._count.members,
    contentCount: m.bubble._count.contents,
    createdById: m.bubble.createdById,
  }))

  res.json(bubbles)
})

// POST /api/bubbles — créer une nouvelle bulle
router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nom requis' })

  const bubble = await prisma.bubble.create({
    data: {
      name: name.trim(),
      createdById: req.user.id,
      members: { create: { userId: req.user.id } },
    },
  })

  res.status(201).json({ id: bubble.id, name: bubble.name, memberCount: 1, contentCount: 0, createdById: bubble.createdById })
})

// POST /api/bubbles/:id/invite — inviter quelqu'un dans une bulle
// L'utilisateur est ajouté IMMÉDIATEMENT. L'email est une simple notification.
router.post('/:id/invite', requireAuth, async (req, res) => {
  const bubbleId = parseInt(req.params.id)
  const { email } = req.body
  if (!email || !email.trim()) return res.status(400).json({ error: 'Email requis' })

  // Vérifier que l'invitant est membre de cette bulle
  const membership = await prisma.bubbleMembership.findUnique({
    where: { userId_bubbleId: { userId: req.user.id, bubbleId } },
  })
  if (!membership) return res.status(403).json({ error: 'Vous n\'êtes pas membre de cette bulle' })

  const bubble = await prisma.bubble.findUnique({ where: { id: bubbleId } })
  if (!bubble) return res.status(404).json({ error: 'Bulle introuvable' })

  const normalizedEmail = email.trim().toLowerCase()

  // Trouver ou créer l'utilisateur
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  let isNewUser = false

  if (!user) {
    isNewUser = true
    const namePart = normalizedEmail.split('@')[0]
      .replace(/[._\-+]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || 'Ami'
    const hash = await bcrypt.hash('ami', 10)
    user = await prisma.user.create({
      data: { email: normalizedEmail, password: hash, name: namePart, isApproved: true },
    })
  }

  // Vérifier si déjà membre
  const alreadyMember = await prisma.bubbleMembership.findUnique({
    where: { userId_bubbleId: { userId: user.id, bubbleId } },
  })
  if (alreadyMember) return res.status(400).json({ error: 'Cette personne est déjà membre de cette bulle' })

  // Ajouter IMMÉDIATEMENT à la bulle
  await prisma.bubbleMembership.create({ data: { userId: user.id, bubbleId } })

  // Générer un token de connexion rapide (valable 7j, pour que l'invité arrive connecté)
  const loginToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, isApproved: user.isApproved },
    SECRET,
    { expiresIn: '7d' }
  )

  const frontendUrl = process.env.FRONTEND_URL || 'https://inspirations.top'
  // On stocke le JWT dans un param pour que la page d'accueil le récupère
  const accessLink = `${frontendUrl}/join-bubble?autologin=${encodeURIComponent(loginToken)}&bubble=${encodeURIComponent(bubble.name)}&inviter=${encodeURIComponent(req.user.name)}`

  const emailHtml = isNewUser
    ? `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #2d1a0e; line-height: 1.6;">
        <p>Bonjour,</p>
        <p><strong>${req.user.name}</strong> vous a ajouté à la bulle <strong>${bubble.name}</strong> sur Inspirations.top — l'endroit où un groupe d'amis partage ce qui vaut vraiment le coup&nbsp;: livres, films, podcasts…</p>
        <p>Vous êtes déjà membre. Cliquez ci-dessous pour accéder directement :</p>
        <p>
          <a href="${accessLink}" style="display:inline-block; background:#2d1a0e; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Accéder à la bulle ${bubble.name}
          </a>
        </p>
        <p style="font-size:13px; color:#888;">Un compte a été créé pour vous avec le mot de passe provisoire <strong>ami</strong>. Vous pouvez le changer via <a href="${frontendUrl}/forgot-password" style="color:#888;">Mot de passe oublié</a>.</p>
        ${EMAIL_FOOTER}
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #2d1a0e; line-height: 1.6;">
        <p>Bonjour ${user.name},</p>
        <p><strong>${req.user.name}</strong> vous a ajouté à la bulle <strong>${bubble.name}</strong> sur Inspirations.top.</p>
        <p>Vous êtes maintenant membre. Cliquez ci-dessous pour découvrir les inspirations partagées :</p>
        <p>
          <a href="${accessLink}" style="display:inline-block; background:#2d1a0e; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Accéder à la bulle ${bubble.name}
          </a>
        </p>
        ${EMAIL_FOOTER}
      </div>
    `

  resend.emails.send({
    from: 'Inspirations <noreply@inspirations.top>',
    to: normalizedEmail,
    subject: `${req.user.name} vous a ajouté à la bulle ${bubble.name}`,
    html: emailHtml,
  }).catch(err => console.error('Email invite error:', err))

  res.json({ message: isNewUser ? 'Ami ajouté et compte créé' : 'Ami ajouté à la bulle' })
})

// DELETE /api/bubbles/:id/leave — quitter une bulle
router.delete('/:id/leave', requireAuth, async (req, res) => {
  const bubbleId = parseInt(req.params.id)

  const membership = await prisma.bubbleMembership.findUnique({
    where: { userId_bubbleId: { userId: req.user.id, bubbleId } },
  })
  if (!membership) return res.status(404).json({ error: 'Vous n\'êtes pas membre de cette bulle' })

  await prisma.bubbleMembership.delete({
    where: { userId_bubbleId: { userId: req.user.id, bubbleId } },
  })

  res.json({ message: 'Vous avez quitté cette bulle' })
})

// GET /api/bubbles/join/:token — route legacy pour invitations anciennes (keep for compat)
router.get('/join/:token', async (req, res) => {
  res.status(410).json({ error: 'Ce lien n\'est plus valide. Contactez la personne qui vous a invité.' })
})

export default router
