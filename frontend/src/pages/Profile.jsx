import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

import { useGalleryFilter } from '../lib/galleryFilter.jsx'
import { api } from '../lib/api.js'
import './Auth.css'
import './Profile.css'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Profile() {
  const { user, updateUser, logout, setUnreadNotifications } = useAuth()
  const { setFilter, setFiltersVisible } = useGalleryFilter()
  const navigate = useNavigate()
  const [pseudo, setPseudo] = useState(user?.name || '')
  const isDirty = pseudo.trim() !== (user?.name || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifsLoading, setNotifsLoading] = useState(true)

  // Charger et marquer comme lues
  useEffect(() => {
    api.notifications.get()
      .then(data => {
        setNotifications(data.items)
        if (data.unread > 0) {
          api.notifications.markRead()
            .then(() => setUnreadNotifications(0))
            .catch(() => {})
        } else {
          setUnreadNotifications(0)
        }
      })
      .catch(() => {})
      .finally(() => setNotifsLoading(false))
  }, [])

  function handlePersonClick(name) {
    setFilter('contributor', name)
    setFiltersVisible(true)
    navigate('/')
  }

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
    <div className="auth-page profile-page">
      <div className="auth-box profile-box">
        <h1>Mon profil</h1>

        {/* Notifications */}
        <section className="notifs-section">
          <h2 className="notifs-title">
            Activité sur mes œuvres
            {notifications.filter(n => n.isNew).length > 0 && (
              <span className="notifs-new-count">{notifications.filter(n => n.isNew).length} nouveau{notifications.filter(n => n.isNew).length > 1 ? 'x' : ''}</span>
            )}
          </h2>

          {notifsLoading ? (
            <p className="notifs-empty">Chargement…</p>
          ) : notifications.length === 0 ? (
            <p className="notifs-empty">Aucune activité pour l'instant.</p>
          ) : (
            <div className="notifs-table-wrap">
              <table className="notifs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Personne</th>
                    <th>Note / Vote</th>
                    <th>Œuvre</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n, i) => (
                    <tr key={i} className={n.isNew ? 'notif-new' : ''}>
                      <td className="notif-date">{formatDate(n.date)}</td>
                      <td>
                        <button className="notif-link" onClick={() => handlePersonClick(n.person)}>
                          {n.person}
                        </button>
                      </td>
                      <td className="notif-rating">
                        {n.type === 'review'
                          ? <span className="rating">{n.rating}/20</span>
                          : <span className={`notif-vote ${n.voteType === 'UP' ? 'up' : 'down'}`}>
                              {n.voteType === 'UP' ? '👍' : '👎'}
                            </span>
                        }
                      </td>
                      <td>
                        <Link to={`/content/${n.contentId}`} className="notif-link">
                          {n.contentTitle}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <hr className="profile-divider" />

        {/* Modifier le pseudo */}
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
          {isDirty && (
            <>
              <button type="submit" className="btn full" disabled={loading}>
                {loading ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button type="button" className="btn-ghost full" style={{ marginTop: 10 }} onClick={() => setPseudo(user?.name || '')}>
                Annuler
              </button>
            </>
          )}
        </form>

        <hr className="profile-divider" />

        <button
          className="btn-ghost full"
          onClick={() => { logout(); navigate('/') }}
        >
          Déconnexion
        </button>
      </div>
    </div>
  )
}
