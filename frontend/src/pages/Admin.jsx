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

  async function approve(id) {
    const updated = await api.admin.approve(id)
    setUsers(us => us.map(u => u.id === id ? { ...u, ...updated } : u))
  }

  async function revoke(id) {
    const updated = await api.admin.revoke(id)
    setUsers(us => us.map(u => u.id === id ? { ...u, ...updated } : u))
  }

  async function deleteUser(id) {
    if (!confirm('Supprimer cet utilisateur et tout son contenu ?')) return
    await api.admin.deleteUser(id)
    setUsers(us => us.filter(u => u.id !== id))
  }

  const pending = users.filter(u => !u.isApproved && !u.isAdmin)
  const approved = users.filter(u => u.isApproved && !u.isAdmin)

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Administration</h1>

        {loading ? (
          <p className="admin-loading">Chargement…</p>
        ) : (
          <>
            <section className="admin-section">
              <h2>En attente de validation {pending.length > 0 && <span className="badge accent">{pending.length}</span>}</h2>
              {pending.length === 0 ? (
                <p className="admin-empty">Aucun compte en attente.</p>
              ) : (
                <div className="admin-table">
                  {pending.map(u => (
                    <div key={u.id} className="admin-row">
                      <div className="admin-user-info">
                        <strong>{u.name}</strong>
                        <span>{u.email}</span>
                        <span className="admin-date">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="admin-user-actions">
                        <button className="btn" onClick={() => approve(u.id)}>Valider</button>
                        <button className="btn-ghost" onClick={() => deleteUser(u.id)}>Refuser</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-section">
              <h2>Comptes actifs</h2>
              {approved.length === 0 ? (
                <p className="admin-empty">Aucun compte actif.</p>
              ) : (
                <div className="admin-table">
                  {approved.map(u => (
                    <div key={u.id} className="admin-row">
                      <div className="admin-user-info">
                        <strong>{u.name}</strong>
                        <span>{u.email}</span>
                      </div>
                      <div className="admin-user-actions">
                        <button className="btn-ghost" onClick={() => revoke(u.id)}>Révoquer</button>
                        <button className="btn-ghost danger" onClick={() => deleteUser(u.id)}>Supprimer</button>
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
