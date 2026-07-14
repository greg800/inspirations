import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useStickyActions } from '../lib/stickyActions.jsx'
import './Storic.css'

const TITLE_MAX = 15

// La note sur 20 n'a pas encore de règle de calcul définie.
// Tant qu'elle n'est pas spécifiée, on renvoie null et le tableau affiche « — ».
function computeScore(story) {
  return null
}

function truncate(title) {
  return title.length > TITLE_MAX ? title.slice(0, TITLE_MAX) + '…' : title
}

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
)

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
)

export default function Storic() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setActions } = useStickyActions()

  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Ligne en cours de création (null = pas de ligne ouverte)
  const [draftTitle, setDraftTitle] = useState(null)
  // Histoire en cours d'édition
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  const draftRef = useRef(null)
  const editRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.stories.mine()
      .then(setStories)
      .catch(err => setError(err.message || 'Impossible de charger vos histoires'))
      .finally(() => setLoading(false))
  }, [user])

  // Bouton retour dans la barre sticky : revient à la page précédente (l'accueil)
  useEffect(() => {
    setActions([{ label: 'Retour', ghost: true, onClick: () => navigate(-1) }])
    return () => setActions(null)
  }, [])

  useEffect(() => { if (draftTitle !== null) draftRef.current?.focus() }, [draftTitle !== null])
  useEffect(() => { if (editingId !== null) editRef.current?.focus() }, [editingId])

  async function createStory() {
    const title = (draftTitle || '').trim()
    if (!title) { setDraftTitle(null); return }
    try {
      const story = await api.stories.create(title)
      setStories(s => [story, ...s])
      setDraftTitle(null)
    } catch (err) {
      setError(err.message || 'Création impossible')
    }
  }

  function startEditing(story) {
    setEditingId(story.id)
    setEditingTitle(story.title)
  }

  async function saveEditing() {
    const title = editingTitle.trim()
    const id = editingId
    if (!title) { setEditingId(null); return }

    const original = stories.find(s => s.id === id)
    if (original && original.title === title) { setEditingId(null); return }

    try {
      const updated = await api.stories.update(id, title)
      setStories(s => s.map(st => (st.id === id ? updated : st)))
      setEditingId(null)
    } catch (err) {
      setError(err.message || 'Modification impossible')
      setEditingId(null)
    }
  }

  async function deleteStory(story) {
    if (!confirm(`Supprimer l'histoire « ${story.title} » ? Cette action est définitive.`)) return
    try {
      await api.stories.delete(story.id)
      setStories(s => s.filter(st => st.id !== story.id))
    } catch (err) {
      setError(err.message || 'Suppression impossible')
    }
  }

  return (
    <div className="storic-page">
      <div className="container">
        <h1>Storic</h1>
        <p className="storic-subtitle">Un outil de création d'histoires.</p>

        {error && <p className="storic-error">{error}</p>}

        <button className="storic-add-btn" onClick={() => setDraftTitle('')}>
          Ajouter une histoire
        </button>

        {loading ? (
          <p className="storic-loading">Chargement…</p>
        ) : (
          <div className="storic-table">
            <div className="storic-head">
              <span>Titre</span>
              <span>Création</span>
              <span>Note</span>
              <span />
            </div>

            {draftTitle !== null && (
              <div className="storic-row">
                <input
                  ref={draftRef}
                  className="storic-input"
                  value={draftTitle}
                  placeholder="Titre de l'histoire…"
                  onChange={e => setDraftTitle(e.target.value)}
                  onBlur={createStory}
                  onKeyDown={e => {
                    if (e.key === 'Enter') createStory()
                    if (e.key === 'Escape') setDraftTitle(null)
                  }}
                />
                <span className="storic-muted">—</span>
                <span className="storic-muted">—</span>
                <span />
              </div>
            )}

            {stories.length === 0 && draftTitle === null ? (
              <p className="storic-empty">Aucune histoire pour l'instant.</p>
            ) : (
              stories.map(story => (
                <div
                  key={story.id}
                  className="storic-row"
                  onDoubleClick={() => startEditing(story)}
                >
                  {editingId === story.id ? (
                    <input
                      ref={editRef}
                      className="storic-input"
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEditing()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                  ) : (
                    <span className="storic-title" title={story.title}>
                      {truncate(story.title)}
                    </span>
                  )}

                  <span className="storic-date">
                    {new Date(story.createdAt).toLocaleDateString('fr-FR')}
                  </span>

                  <span className="storic-score">
                    {computeScore(story) ?? <span className="storic-muted">—</span>}
                  </span>

                  <div className="storic-actions">
                    <button
                      className="storic-icon-btn"
                      onClick={() => navigate(`/storic/${story.id}`)}
                      aria-label={`Ouvrir les prémisses de ${story.title}`}
                      title="Prémisses"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      className="storic-icon-btn storic-delete-btn"
                      onClick={() => deleteStory(story)}
                      aria-label={`Supprimer ${story.title}`}
                      title="Supprimer"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
