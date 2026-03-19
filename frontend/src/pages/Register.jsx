import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import './Auth.css'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.auth.register(form)
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
          <h1>Compte créé !</h1>
          <p className="msg-success">
            Votre compte est prêt. Vous pouvez vous connecter dès maintenant.
          </p>
          <Link to="/login" className="btn" style={{ marginTop: 24, display: 'inline-flex' }}>
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>Créer un compte</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nom</label>
            <input value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          {error && <p className="msg-error">{error}</p>}
          <button type="submit" className="btn full" disabled={loading}>
            {loading ? 'Envoi…' : 'Créer mon compte'}
          </button>
        </form>
        <p className="auth-link">Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </div>
    </div>
  )
}
