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

  useEffect(() => {
    if (!user?.isAdmin) { navigate('/'); return }
    api.admin.users().then(setUsers).finally(() => setLoading(false))
    api.tags.list().then(setTags)
  }, [])

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
    await api.admin.deleteUser(id)
    setUsers(us => us.filter(u => u.id !== id))
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
              <h2>Comptes membres</h2>
              {users.length === 0 ? (
                <p className="admin-empty">Aucun membre.</p>
              ) : (
                <div className="admin-table">
                  <div className="admin-row admin-row-header">
                    <div className="admin-user-info" />
                    <div className="admin-stats-header">
                      <span title="Publications">📝</span>
                      <span title="Avis">💬</span>
                      <span title="Pouces vers le haut">👍</span>
                      <span title="Pouces vers le bas">👎</span>
                    </div>
                  </div>
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
                      <div className="admin-stats">
                        <span className="stat-item">{u.stats.publications}</span>
                        <span className="stat-item">{u.stats.reviews}</span>
                        <span className="stat-item">{u.stats.votesUp}</span>
                        <span className="stat-item">{u.stats.votesDown}</span>
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
