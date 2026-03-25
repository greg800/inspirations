import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import './Auth.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <h1>Lien invalide</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <p className="auth-link"><Link to="/forgot-password">Faire une nouvelle demande</Link></p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas')
    setLoading(true)
    try {
      await api.auth.resetPassword({ token, password: form.password })
      navigate('/login', { state: { message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' } })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>Nouveau mot de passe</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          {error && <p className="msg-error">{error}</p>}
          <button type="submit" className="btn full" disabled={loading}>
            {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
