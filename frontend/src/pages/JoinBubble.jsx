import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import './Auth.css'

export default function JoinBubble() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const autologin = searchParams.get('autologin')
  const bubbleName = searchParams.get('bubble') || ''
  const inviter = searchParams.get('inviter') || ''

  const [done, setDone] = useState(false)

  useEffect(() => {
    if (autologin) {
      // Décoder le JWT et connecter l'utilisateur
      try {
        const parts = autologin.split('.')
        const payload = JSON.parse(atob(parts[1]))
        login(autologin, {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          isAdmin: payload.isAdmin,
          isApproved: payload.isApproved,
        })
      } catch {
        // Token invalide → aller à la galerie quand même (déjà membre)
      }
    }
    setDone(true)
    const t = setTimeout(() => navigate('/'), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🫧</div>
        {bubbleName ? (
          <>
            <h1>Bienvenue dans la bulle <em>{bubbleName}</em> !</h1>
            {inviter && <p>Ajouté(e) par <strong>{inviter}</strong>.</p>}
          </>
        ) : (
          <h1>Bienvenue sur Inspirations !</h1>
        )}
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Redirection vers la galerie dans quelques secondes…
        </p>
        <button className="btn full" onClick={() => navigate('/')}>
          Accéder maintenant
        </button>
      </div>
    </div>
  )
}
