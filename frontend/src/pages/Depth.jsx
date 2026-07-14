import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useStickyActions } from '../lib/stickyActions.jsx'
// Même agencement que la page Prémisse : on réutilise ses styles.
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

export default function Depth() {
  const { storyId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setActions } = useStickyActions()

  const [story, setStory] = useState(null)
  // La prémisse retenue = celle qui a la meilleure note. Le serveur trie déjà
  // par note décroissante, donc c'est la première de la liste.
  const [topPremise, setTopPremise] = useState(null)
  const [depths, setDepths] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [draft, setDraft] = useState('')
  const [improving, setImproving] = useState(false)
  const [adding, setAdding] = useState(false)

  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [editScore, setEditScore] = useState(10)
  const [saving, setSaving] = useState(false)

  const words = countWords(draft)
  const overLimit = words > MAX_WORDS
  const busy = improving || adding

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    Promise.all([api.premises.list(storyId), api.depths.list(storyId)])
      .then(([premiseData, depthData]) => {
        setStory(premiseData.story)
        setTopPremise(premiseData.items[0] || null)
        setDepths(depthData.items)
      })
      .catch(err => setError(err.message || 'Chargement impossible'))
      .finally(() => setLoading(false))
  }, [storyId, user])

  useEffect(() => {
    setActions([{ label: 'Retour', ghost: true, onClick: () => navigate(-1) }])
    return () => setActions(null)
  }, [])

  function insert(depth) {
    setDepths(list => [...list, depth].sort((a, b) => b.score - a.score))
    setDraft('')
  }

  async function addAsIs() {
    if (!draft.trim() || overLimit || busy) return
    setError('')
    setAdding(true)
    try {
      insert(await api.depths.create(storyId, draft))
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
      insert(await api.depths.improve(storyId, draft))
    } catch (err) {
      setError(err.message || "L'appel à l'IA a échoué")
    } finally {
      setImproving(false)
    }
  }

  function openEditor(depth) {
    setEditing(depth)
    setEditText(depth.text)
    setEditScore(depth.score)
  }

  async function saveEdit() {
    if (!editText.trim() || saving) return
    setSaving(true)
    try {
      const updated = await api.depths.update(storyId, editing.id, {
        text: editText,
        score: Number(editScore),
      })
      setDepths(list =>
        list.map(d => (d.id === updated.id ? updated : d)).sort((a, b) => b.score - a.score)
      )
      setEditing(null)
    } catch (err) {
      setError(err.message || 'Modification impossible')
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function remove(depth) {
    if (!confirm('Supprimer cette analyse ? Cette action est définitive.')) return
    try {
      await api.depths.delete(storyId, depth.id)
      setDepths(list => list.filter(d => d.id !== depth.id))
    } catch (err) {
      setError(err.message || 'Suppression impossible')
    }
  }

  return (
    <div className="premise-page">
      <div className="container">
        <p className="premise-eyebrow">Storic{story ? ` — ${story.title}` : ''}</p>
        <h1>Profondeur</h1>
        <p className="premise-subtitle">
          Si le champ des possibles est vaste, la prémisse est bonne. S'il est étroit,
          c'est une piste stérile.
        </p>

        {error && <p className="premise-error">{error}</p>}

        {!loading && (
          <div className="premise-retained">
            <div className="premise-retained-label">Prémisse retenue</div>
            {topPremise ? (
              <>
                <p className="premise-retained-text">{topPremise.text}</p>
                <div className="premise-retained-score">{topPremise.score}/20</div>
              </>
            ) : (
              <p className="premise-retained-empty">
                Aucune prémisse pour cette histoire. Ajoutez-en une avant d'évaluer sa profondeur.
              </p>
            )}
          </div>
        )}

        <div className="premise-compose">
          <textarea
            className={`premise-input${overLimit ? ' over' : ''}`}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Décrivez la fertilité et la profondeur de cette prémisse : que rend-elle possible ?"
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
                {improving ? 'L’IA travaille…' : 'Améliorer et ajouter'}
              </button>
              <button
                className="premise-icon-btn"
                onClick={() => navigate('/storic/prompt/depth_improve')}
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
              {adding ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="premise-loading">Chargement…</p>
        ) : depths.length === 0 ? (
          <p className="premise-empty">Aucune analyse de profondeur pour cette histoire.</p>
        ) : (
          <div className="premise-table">
            <div className="premise-head">
              <span>Profondeur</span>
              <span>Note</span>
              <span />
            </div>
            {depths.map(d => (
              <div key={d.id} className="premise-row">
                <span className="premise-text">{d.text}</span>
                <span className="premise-score">{d.score}/20</span>
                <div className="premise-actions">
                  <button
                    className="premise-icon-btn"
                    onClick={() => openEditor(d)}
                    aria-label="Modifier cette analyse"
                    title="Modifier"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    className="premise-icon-btn danger"
                    onClick={() => remove(d)}
                    aria-label="Supprimer cette analyse"
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
            <h2>Modifier l'analyse</h2>

            <label className="premise-label" htmlFor="depth-edit-text">Profondeur</label>
            <textarea
              id="depth-edit-text"
              className="premise-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={5}
            />
            <div className={`premise-count${countWords(editText) > MAX_WORDS ? ' over' : ''}`}>
              {countWords(editText)} / {MAX_WORDS} mots
            </div>

            <label className="premise-label" htmlFor="depth-edit-score">Note sur 20</label>
            <input
              id="depth-edit-score"
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
