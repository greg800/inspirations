import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.auth.forgotPassword({ email })
      setSuccess(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <h1>Email envoyé</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
            Si un compte existe avec cette adresse, vous recevrez un email avec un lien de réinitialisation valable 1 heure.
          </p>
          <p className="auth-link"><Link to="/login">Retour à la connexion</Link></p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>Mot de passe oublié</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="msg-error">{error}</p>}
          <button type="submit" className="btn full" disabled={loading}>
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
        <p className="auth-link"><Link to="/login">Retour à la connexion</Link></p>
      </div>
    </div>
  )
}
