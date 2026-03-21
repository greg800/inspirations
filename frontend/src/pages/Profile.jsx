import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { api } from '../lib/api.js'
import './Auth.css'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [pseudo, setPseudo] = useState(user?.name || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const updated = await api.users.updatePreferences({ name: pseudo })
      updateUser({ name: updated.name })
      navigate(-1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>Mon profil</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Pseudo</label>
            <input
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled />
            <span className="hint">L'email ne peut pas être modifié.</span>
          </div>
          {error && <p className="msg-error">{error}</p>}
          <button type="submit" className="btn full" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" className="btn-ghost full" style={{ marginTop: 10 }} onClick={() => navigate(-1)}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  )
}
