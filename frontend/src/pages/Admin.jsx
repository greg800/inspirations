import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import './Admin.css'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tags, setTags] = useState([])
  const [newSupport, setNewSupport] = useState('')
  const [newGenre, setNewGenre] = useState('')
  const [seedStatus, setSeedStatus] = useState('') // '' | 'running' | 'done' | 'error'
  const [seedMsg, setSeedMsg] = useState('')

  useEffect(() => {
    if (!user?.isAdmin) { navigate('/'); return }
    api.admin.users().then(setUsers).finally(() => setLoading(false))
    api.tags.list().then(setTags)
  }, [])

  async function runSeed() {
    setSeedStatus('running')
    setSeedMsg('')
    try {
      const res = await api.admin.seedCastelGreg()
      setSeedStatus('done')
      setSeedMsg(res.message || 'Synchronisation terminée')
    } catch (err) {
      setSeedStatus('error')
      setSeedMsg(err.message)
    }
  }

  const supports = tags.filter(t => t.type === 'support')
  const genres = tags.filter(t => t.type === 'genre')

  async function addTag(type, value) {
    if (!value.trim()) return
    const tag = await api.tags.create({ type, value })
    setTags(ts => [...ts, tag])
  }

  async function removeTag(id) {
    await api.tags.delete(id)
    setTags(ts => ts.filter(t => t.id !== id))
  }

  async function deleteUser(id) {
    if (!confirm('Supprimer cet utilisateur et tout son contenu ?')) return
    try {
      await api.admin.deleteUser(id)
      setUsers(us => us.filter(u => u.id !== id))
    } catch (err) {
      alert('Erreur lors de la suppression : ' + (err.message || 'inconnue'))
    }
  }

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Administration</h1>

        {loading ? (
          <p className="admin-loading">Chargement…</p>
        ) : (
          <>
            <section className="admin-section">
              <h2>Bulles</h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                Ajoute tous les utilisateurs existants à la bulle CastelGreg et rattache tout le contenu orphelin.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn" onClick={runSeed} disabled={seedStatus === 'running'}>
                  {seedStatus === 'running' ? 'Synchronisation…' : '🫧 Synchroniser CastelGreg'}
                </button>
                {seedStatus === 'done' && <span style={{ fontSize: 13, color: '#2e7d32' }}>✓ {seedMsg}</span>}
                {seedStatus === 'error' && <span style={{ fontSize: 13, color: '#c62828' }}>✗ {seedMsg}</span>}
              </div>
            </section>

            <section className="admin-section">
              <h2>Comptes membres</h2>
              {users.length === 0 ? (
                <p className="admin-empty">Aucun membre.</p>
              ) : (
                <div className="admin-table">
                  {users.map(u => (
                    <div key={u.id} className="admin-row">
                      <div className="admin-user-info">
                        <div className="admin-user-name">
                          <strong>{u.name}</strong>
                          {u.isAdmin && <span className="admin-badge">Admin</span>}
                          {!u.isAdmin && (
                            <button className="admin-delete-btn" onClick={() => deleteUser(u.id)}>Supprimer</button>
                          )}
                        </div>
                        <span>{u.email}</span>
                        <span className="admin-date">Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="admin-login-stats">
                        <span className="admin-last-login">
                          {u.lastLoginAt
                            ? `Dernière connexion : ${new Date(u.lastLoginAt).toLocaleDateString('fr-FR')}`
                            : 'Jamais connecté'}
                        </span>
                        <span className="admin-login-count">{u.loginCount} connexion{u.loginCount > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="admin-section">
              <h2>Supports</h2>
              <div className="tag-list">
                {supports.map(t => (
                  <span key={t.id} className="tag-item">
                    <span className="badge">{t.value}</span>
                    <button className="tag-remove" onClick={() => removeTag(t.id)}>×</button>
                  </span>
                ))}
              </div>
              <div className="tag-add">
                <input value={newSupport} onChange={e => setNewSupport(e.target.value)}
                  placeholder="Nouveau support…"
                  onKeyDown={e => { if (e.key === 'Enter') { addTag('support', newSupport); setNewSupport('') } }} />
                <button className="btn" onClick={() => { addTag('support', newSupport); setNewSupport('') }}>Ajouter</button>
              </div>
            </section>

            <section className="admin-section">
              <h2>Genres</h2>
              <div className="tag-list">
                {genres.map(t => (
                  <span key={t.id} className="tag-item">
                    <span className="badge">{t.value}</span>
                    <button className="tag-remove" onClick={() => removeTag(t.id)}>×</button>
                  </span>
                ))}
              </div>
              <div className="tag-add">
                <input value={newGenre} onChange={e => setNewGenre(e.target.value)}
                  placeholder="Nouveau genre…"
                  onKeyDown={e => { if (e.key === 'Enter') { addTag('genre', newGenre); setNewGenre('') } }} />
                <button className="btn" onClick={() => { addTag('genre', newGenre); setNewGenre('') }}>Ajouter</button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
