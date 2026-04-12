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

  // Vérifier si cette personne est déjà membre
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existingUser) {
    const alreadyMember = await prisma.bubbleMembership.findUnique({
      where: { userId_bubbleId: { userId: existingUser.id, bubbleId } },
    })
    if (alreadyMember) return res.status(400).json({ error: 'Cette personne est déjà membre de cette bulle' })
  }

  // Créer le token d'invitation
  const rawToken = crypto.randomBytes(32).toString('hex')

  await prisma.bubbleInvitation.create({
    data: {
      token: rawToken,
      email: normalizedEmail,
      bubbleId,
      invitedById: req.user.id,
    },
  })

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const joinLink = `${frontendUrl}/join-bubble?token=${rawToken}`

  // Email d'invitation
  const isNewUser = !existingUser
  const emailHtml = isNewUser
    ? `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #2d1a0e; line-height: 1.6;">
        <p>Bonjour,</p>
        <p><strong>${req.user.name}</strong> vous invite à rejoindre la bulle <strong>${bubble.name}</strong> sur Inspirations.top.</p>
        <p>Inspirations.top, c'est l'endroit où un groupe d'amis partage ce qui vaut vraiment le coup&nbsp;: livres, films, podcasts…</p>
        <p>
          <a href="${joinLink}" style="display:inline-block; background:#2d1a0e; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Rejoindre la bulle ${bubble.name}
          </a>
        </p>
        <p style="font-size:13px; color:#999;">Un compte vous sera créé automatiquement. Votre mot de passe provisoire est <strong>ami</strong> — nous vous conseillons de le changer dès votre première connexion via "Mot de passe oublié".</p>
        ${EMAIL_FOOTER}
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #2d1a0e; line-height: 1.6;">
        <p>Bonjour ${existingUser.name},</p>
        <p><strong>${req.user.name}</strong> vous invite à rejoindre la bulle <strong>${bubble.name}</strong> sur Inspirations.top.</p>
        <p>Cliquez sur le lien ci-dessous pour accéder à cette bulle et découvrir les inspirations partagées par ses membres.</p>
        <p>
          <a href="${joinLink}" style="display:inline-block; background:#2d1a0e; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Rejoindre la bulle ${bubble.name}
          </a>
        </p>
        ${EMAIL_FOOTER}
      </div>
    `

  resend.emails.send({
    from: 'Inspirations <noreply@inspirations.top>',
    to: normalizedEmail,
    subject: `${req.user.name} vous invite dans la bulle ${bubble.name}`,
    html: emailHtml,
  }).catch(() => {})

  res.json({ message: 'Invitation envoyée' })
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

// GET /api/bubbles/join/:token — rejoindre via token d'invitation (public)
router.get('/join/:token', async (req, res) => {
  const { token } = req.params

  const invitation = await prisma.bubbleInvitation.findUnique({
    where: { token },
    include: { bubble: true, invitedBy: { select: { name: true } } },
  })

  if (!invitation) return res.status(404).json({ error: 'Invitation introuvable ou expirée' })
  if (invitation.used) return res.status(400).json({ error: 'Cette invitation a déjà été utilisée' })

  let user = await prisma.user.findUnique({ where: { email: invitation.email } })
  let isNewUser = false

  if (!user) {
    // Créer le compte avec mot de passe "ami"
    isNewUser = true
    const namePart = invitation.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const hash = await bcrypt.hash('ami', 10)
    user = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hash,
        name: namePart,
        isApproved: true,
      },
    })
  }

  // Ajouter à la bulle (si pas déjà membre)
  await prisma.bubbleMembership.upsert({
    where: { userId_bubbleId: { userId: user.id, bubbleId: invitation.bubbleId } },
    update: {},
    create: { userId: user.id, bubbleId: invitation.bubbleId },
  })

  // Marquer l'invitation comme utilisée
  await prisma.bubbleInvitation.update({
    where: { token },
    data: { used: true },
  })

  const jwtToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, isApproved: user.isApproved },
    SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    token: jwtToken,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, isApproved: user.isApproved, zoomLevel: user.zoomLevel },
    bubbleName: invitation.bubble.name,
    invitedBy: invitation.invitedBy.name,
    isNewUser,
  })
})

export default router
