import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useStickyActions } from '../lib/stickyActions.jsx'
import './Premise.css'

const MAX_WORDS = 200

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z" />
    <path d="M14.5 6.5l3 3" />
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
)

export default function Premise() {
  const { storyId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setActions } = useStickyActions()

  const [story, setStory] = useState(null)
  const [premises, setPremises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [draft, setDraft] = useState('')
  const [improving, setImproving] = useState(false)
  const [adding, setAdding] = useState(false)

  // Prémisse en cours d'édition dans la boîte de dialogue
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [editScore, setEditScore] = useState(10)
  const [saving, setSaving] = useState(false)

  const words = countWords(draft)
  const overLimit = words > MAX_WORDS
  const busy = improving || adding

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.premises.list(storyId)
      .then(data => { setStory(data.story); setPremises(data.premises) })
      .catch(err => setError(err.message || 'Chargement impossible'))
      .finally(() => setLoading(false))
  }, [storyId, user])

  useEffect(() => {
    setActions([{ label: 'Retour', ghost: true, onClick: () => navigate(-1) }])
    return () => setActions(null)
  }, [])

  function insert(premise) {
    // Le tri (note décroissante) est fait par le serveur ; on le rejoue ici.
    setPremises(list => [...list, premise].sort((a, b) => b.score - a.score))
    setDraft('')
  }

  async function addAsIs() {
    if (!draft.trim() || overLimit || busy) return
    setError('')
    setAdding(true)
    try {
      insert(await api.premises.create(storyId, draft))
    } catch (err) {
      setError(err.message || 'Ajout impossible')
    } finally {
      setAdding(false)
    }
  }

  async function improve() {
    if (!draft.trim() || overLimit || busy) return
    setError('')
    setImproving(true)
    try {
      insert(await api.premises.improve(storyId, draft))
    } catch (err) {
      setError(err.message || "L'appel à l'IA a échoué")
    } finally {
      setImproving(false)
    }
  }

  function openEditor(premise) {
    setEditing(premise)
    setEditText(premise.text)
    setEditScore(premise.score)
  }

  async function saveEdit() {
    if (!editText.trim() || saving) return
    setSaving(true)
    try {
      const updated = await api.premises.update(storyId, editing.id, {
        text: editText,
        score: Number(editScore),
      })
      setPremises(list =>
        list.map(p => (p.id === updated.id ? updated : p)).sort((a, b) => b.score - a.score)
      )
      setEditing(null)
    } catch (err) {
      setError(err.message || 'Modification impossible')
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function remove(premise) {
    if (!confirm('Supprimer cette prémisse ? Cette action est définitive.')) return
    try {
      await api.premises.delete(storyId, premise.id)
      setPremises(list => list.filter(p => p.id !== premise.id))
    } catch (err) {
      setError(err.message || 'Suppression impossible')
    }
  }

  return (
    <div className="premise-page">
      <div className="container">
        <p className="premise-eyebrow">Storic</p>
        <h1>{story ? story.title : 'Prémisses'}</h1>
        <p className="premise-subtitle">
          Une prémisse, c'est l'histoire tout entière formulée en une seule phrase.
        </p>

        {error && <p className="premise-error">{error}</p>}

        <div className="premise-compose">
          <textarea
            className={`premise-input${overLimit ? ' over' : ''}`}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Proposez une prémisse…"
            rows={5}
            disabled={busy}
          />
          <div className={`premise-count${overLimit ? ' over' : ''}`}>
            {words} / {MAX_WORDS} mots
          </div>

          <div className="premise-cta-row">
            <div className="premise-cta-with-edit">
              <button
                className="premise-btn"
                onClick={improve}
                disabled={!draft.trim() || overLimit || busy}
              >
                {improving ? 'L’IA travaille…' : 'Simplifier et améliorer le style'}
              </button>
              <button
                className="premise-icon-btn"
                onClick={() => navigate('/storic/prompt')}
                aria-label="Modifier le prompt de l'IA"
                title="Modifier le prompt de l'IA"
              >
                <PencilIcon />
              </button>
            </div>

            <button
              className="premise-btn ghost"
              onClick={addAsIs}
              disabled={!draft.trim() || overLimit || busy}
            >
              {adding ? 'Ajout…' : 'Ajouter sans modifier'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="premise-loading">Chargement…</p>
        ) : premises.length === 0 ? (
          <p className="premise-empty">Aucune prémisse pour cette histoire.</p>
        ) : (
          <div className="premise-table">
            <div className="premise-head">
              <span>Prémisse</span>
              <span>Note</span>
              <span />
            </div>
            {premises.map(p => (
              <div key={p.id} className="premise-row">
                <span className="premise-text">{p.text}</span>
                <span className="premise-score">{p.score}/20</span>
                <div className="premise-actions">
                  <button
                    className="premise-icon-btn"
                    onClick={() => openEditor(p)}
                    aria-label="Modifier cette prémisse"
                    title="Modifier"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    className="premise-icon-btn danger"
                    onClick={() => remove(p)}
                    aria-label="Supprimer cette prémisse"
                    title="Supprimer"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="premise-modal-backdrop" onClick={() => setEditing(null)}>
          <div className="premise-modal" onClick={e => e.stopPropagation()}>
            <h2>Modifier la prémisse</h2>

            <label className="premise-label" htmlFor="premise-edit-text">Prémisse</label>
            <textarea
              id="premise-edit-text"
              className="premise-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={5}
            />
            <div className={`premise-count${countWords(editText) > MAX_WORDS ? ' over' : ''}`}>
              {countWords(editText)} / {MAX_WORDS} mots
            </div>

            <label className="premise-label" htmlFor="premise-edit-score">Note sur 20</label>
            <input
              id="premise-edit-score"
              className="premise-score-input"
              type="number"
              min="0"
              max="20"
              step="1"
              value={editScore}
              onChange={e => setEditScore(e.target.value)}
            />

            <div className="premise-modal-actions">
              <button
                className="premise-btn"
                onClick={saveEdit}
                disabled={!editText.trim() || countWords(editText) > MAX_WORDS || saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button className="premise-btn ghost" onClick={() => setEditing(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
