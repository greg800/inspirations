import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import './Auth.css'

export default function JoinBubble() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // loading | success | error
  const [data, setData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Lien d\'invitation invalide.')
      return
    }

    api.bubbles.join(token)
      .then(result => {
        // Connecter l'utilisateur
        login(result.token, result.user)
        setData(result)
        setStatus('success')
        // Redirection automatique vers la galerie après 4 secondes
        setTimeout(() => navigate('/'), 4000)
      })
      .catch(err => {
        setStatus('error')
        setErrorMsg(err.message || 'Lien invalide ou déjà utilisé.')
      })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <h1>Rejoindre la bulle…</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Vérification de votre invitation…</p>
          </>
        )}

        {status === 'success' && data && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🫧</div>
            <h1>Bienvenue dans la bulle <em>{data.bubbleName}</em> !</h1>
            <p>Vous avez été invité(e) par <strong>{data.invitedBy}</strong>.</p>

            {data.isNewUser && (
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                margin: '16px 0',
                textAlign: 'left',
                fontSize: 14,
              }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Votre compte a été créé automatiquement.</p>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                  Votre mot de passe provisoire est <strong>ami</strong>. Nous vous recommandons de le personnaliser via{' '}
                  <a href="/forgot-password" style={{ color: 'var(--color-accent)' }}>Mot de passe oublié</a>.
                </p>
              </div>
            )}

            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              Vous allez être redirigé(e) vers la galerie dans quelques secondes…
            </p>
            <button className="btn full" onClick={() => navigate('/')}>
              Accéder à la galerie maintenant
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>Invitation invalide</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>{errorMsg}</p>
            <button className="btn full" onClick={() => navigate('/')}>
              Retour à l'accueil
            </button>
          </>
        )}
      </div>
    </div>
  )
}
