import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'change-this-secret'

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Non authentifié' })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide' })
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès refusé' })
    next()
  })
}

export function requireApproved(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isApproved) return res.status(403).json({ error: 'Compte en attente de validation' })
    next()
  })
}

export function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (token) {
    try { req.user = jwt.verify(token, SECRET) } catch {}
  }
  next()
}

export { SECRET }
