import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useStickyActions } from '../lib/stickyActions.jsx'
import StepArrows from '../components/StepArrows.jsx'
import {
  stepByKey, stepIndex, stepHasSummary, stepsOfBlock, stepPath, blockProgress,
  STORIC_STEPS, STORIC_BLOCKS,
} from '../lib/storicSteps.js'
import './Premise.css'

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

// `firstStep` : rendu à la racine /storic/:storyId (la prémisse), sans param d'étape.
export default function StepPage({ firstStep }) {
  const params = useParams()
  const stepKey = firstStep ? 'premise' : params.stepKey
  const storyId = params.storyId
  const step = stepByKey(stepKey)
  const index = stepIndex(stepKey)

  const { user } = useAuth()
  const navigate = useNavigate()
  const { setTrail } = useStickyActions()

  const [storyTitle, setStoryTitle] = useState('')
  const [items, setItems] = useState([])
  // Éléments retenus des étapes précédentes (bandeau « où vous en êtes »).
  const [priorContext, setPriorContext] = useState([])
  // Clés des étapes qui portent au moins un élément — nourrit les deux fils
  // d'Ariane (blocs en haut, étapes du bloc courant en bas).
  const [filled, setFilled] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [draft, setDraft] = useState('')
  const [improving, setImproving] = useState(false)
  const [adding, setAdding] = useState(false)

  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [editScore, setEditScore] = useState(10)
  const [saving, setSaving] = useState(false)

  // Étapes du bandeau « où vous en êtes » dont on affiche le détail complet.
  const [expanded, setExpanded] = useState(() => new Set())
  function toggleExpanded(key) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const words = countWords(draft)
  const busy = improving || adding

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!step) { navigate('/storic'); return }

    setLoading(true)
    setError('')
    setDraft('')
    // Sans cela, le temps du chargement, la liste de l'étape quittée resterait
    // affichée et marquerait à tort la nouvelle étape comme renseignée.
    setItems([])

    // Le résumé sert au bandeau « où vous en êtes » ET à l'avancement des deux
    // fils d'Ariane : on le charge à chaque étape, y compris la première.
    Promise.all([api.step.list(step.path, storyId), api.contextSummary(storyId)])
      .then(([listData, summary]) => {
        setStoryTitle(listData.story.title)
        setItems(listData.items)

        const byKey = Object.fromEntries(summary.steps.map(s => [s.key, s.best]))
        setFilled(new Set(summary.steps.filter(s => s.best).map(s => s.key)))
        // Le bandeau ne montre que les étapes PRÉCÉDENTES.
        setPriorContext(
          STORIC_STEPS.slice(0, index).map(s => ({
            key: s.key,
            label: s.label,
            best: byKey[s.key] || null,
          }))
        )
      })
      .catch(err => setError(err.message || 'Chargement impossible'))
      .finally(() => setLoading(false))
  }, [stepKey, storyId, user])

  // Avancement affiché : ce qu'a renvoyé le serveur, corrigé en direct par ce
  // que l'utilisateur vient d'ajouter ou de supprimer à l'étape courante.
  const filledNow = useMemo(() => {
    const set = new Set(filled)
    if (items.length > 0) set.add(stepKey)
    else set.delete(stepKey)
    return set
  }, [filled, items.length, stepKey])

  // Fil d'Ariane du haut : les 7 grands blocs de la méthode.
  const blockTrail = useMemo(() => STORIC_BLOCKS.map(block => ({
    key: block.key,
    label: block.letter,
    title: block.pending ? `${block.label} — à venir` : block.label,
    progress: blockProgress(block.key, filledNow),
    active: block.key === step?.block,
    disabled: !!block.pending,
    // Un bloc mène à sa première étape. Les blocs à venir n'en ont aucune.
    onClick: () => {
      const first = stepsOfBlock(block.key)[0]
      if (first) navigate(stepPath(storyId, first.key))
    },
  })), [filledNow, step?.block, storyId])

  // Fil d'Ariane du bas : les étapes du bloc courant, numérotées.
  const stepTrail = useMemo(() => stepsOfBlock(step?.block).map((s, i) => ({
    key: s.key,
    label: String(i + 1),
    title: s.label,
    progress: filledNow.has(s.key) ? 1 : 0,
    active: s.key === stepKey,
    onClick: () => navigate(stepPath(storyId, s.key)),
  })), [filledNow, step?.block, stepKey, storyId])

  useEffect(() => {
    setTrail({ items: stepTrail, ariaLabel: 'Étapes de ce bloc' })
    return () => setTrail(null)
  }, [stepTrail])

  function insert(item) {
    setItems(list => [...list, item].sort((a, b) => b.score - a.score))
    setDraft('')
  }

  async function addAsIs() {
    if (!draft.trim() || busy) return
    setError('')
    setAdding(true)
    try {
      insert(await api.step.create(step.path, storyId, draft))
    } catch (err) {
      setError(err.message || 'Ajout impossible')
    } finally {
      setAdding(false)
    }
  }

  async function improve() {
    if (!draft.trim() || busy) return
    setError('')
    setImproving(true)
    try {
      insert(await api.step.improve(step.path, storyId, draft))
    } catch (err) {
      setError(err.message || "L'appel à l'IA a échoué")
    } finally {
      setImproving(false)
    }
  }

  function openEditor(item) {
    setEditing(item)
    setEditText(item.text)
    setEditScore(item.score)
  }

  async function saveEdit() {
    if (!editText.trim() || saving) return
    setSaving(true)
    try {
      const updated = await api.step.update(step.path, storyId, editing.id, {
        text: editText,
        score: Number(editScore),
      })
      setItems(list =>
        list.map(i => (i.id === updated.id ? updated : i)).sort((a, b) => b.score - a.score)
      )
      setEditing(null)
    } catch (err) {
      setError(err.message || 'Modification impossible')
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function remove(item) {
    if (!confirm('Supprimer cet élément ? Cette action est définitive.')) return
    try {
      await api.step.delete(step.path, storyId, item.id)
      setItems(list => list.filter(i => i.id !== item.id))
    } catch (err) {
      setError(err.message || 'Suppression impossible')
    }
  }

  if (!step) return null

  return (
    <div className="premise-page">
      <div className="container">
        {/* Les 7 grands blocs de la méthode. Chaque flèche se remplit de vert
            à proportion des étapes déjà renseignées pour cette histoire. */}
        <StepArrows items={blockTrail} className="trail-blocks" ariaLabel="Blocs de la méthode" />

        <p className="premise-eyebrow">Storic{storyTitle ? ` — ${storyTitle}` : ''}</p>
        <h1>{step.title}</h1>
        <p className="premise-subtitle">{step.subtitle}</p>

        {error && <p className="premise-error">{error}</p>}

        {/* Où vous en êtes : les éléments retenus aux étapes précédentes.
            Synthèse (avec bascule vers le détail) partout sauf prémisse et
            principe directeur, qui s'affichent en entier. */}
        {!loading && index > 0 && (
          <div className="step-context">
            <div className="step-context-label">Où vous en êtes</div>
            {priorContext.map(p => {
              const useSummary = stepHasSummary(p.key) && p.best?.summary
              const isOpen = expanded.has(p.key)
              return (
                <div key={p.key} className="step-context-item">
                  <span className="step-context-step">{p.label}</span>
                  {p.best ? (
                    <span className="step-context-text">
                      {useSummary && !isOpen ? p.best.summary : p.best.text}
                      {' '}
                      <span className="step-context-score">{p.best.score}/20</span>
                      {useSummary && (
                        <button
                          type="button"
                          className="step-context-toggle"
                          onClick={() => toggleExpanded(p.key)}
                        >
                          {isOpen ? "n'afficher que la synthèse" : 'voir le détail'}
                        </button>
                      )}
                    </span>
                  ) : (
                    <span className="step-context-todo">à compléter</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Aides pour bien remplir */}
        <ul className="step-guidance">
          {step.guidance.map((g, i) => <li key={i}>{g}</li>)}
        </ul>

        <div className="premise-compose">
          <textarea
            className="premise-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={step.placeholder}
            rows={5}
            disabled={busy}
          />
          <div className="premise-count">
            {words} mot{words > 1 ? 's' : ''}
          </div>

          <div className="premise-cta-row">
            <div className="premise-cta-with-edit">
              <button
                className="premise-btn"
                onClick={improve}
                disabled={!draft.trim() || busy}
              >
                {improving ? 'L’IA travaille…' : step.ctaImprove}
              </button>
              <button
                className="premise-icon-btn"
                onClick={() => navigate(`/storic/prompt/${step.promptKey}`)}
                aria-label="Modifier le prompt de l'IA"
                title="Modifier le prompt de l'IA"
              >
                <PencilIcon />
              </button>
            </div>

            <button
              className="premise-btn ghost"
              onClick={addAsIs}
              disabled={!draft.trim() || busy}
            >
              {adding ? 'Ajout…' : step.ctaAdd}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="premise-loading">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="premise-empty">Rien pour cette étape pour l'instant.</p>
        ) : (
          <div className="premise-table">
            <div className="premise-head">{step.tableHeader}</div>
            {items.map(item => (
              <div key={item.id} className="premise-row">
                {/* Note et actions sur une première ligne, pour laisser le
                    texte occuper toute la largeur en dessous. */}
                <div className="premise-row-meta">
                  <span className="premise-score">{item.score}/20</span>
                  <div className="premise-actions">
                    <button
                      className="premise-icon-btn"
                      onClick={() => openEditor(item)}
                      aria-label="Modifier"
                      title="Modifier"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      className="premise-icon-btn danger"
                      onClick={() => remove(item)}
                      aria-label="Supprimer"
                      title="Supprimer"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                <p className="premise-text">{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="premise-modal-backdrop" onClick={() => setEditing(null)}>
          <div className="premise-modal" onClick={e => e.stopPropagation()}>
            <h2>Modifier</h2>

            <label className="premise-label" htmlFor="step-edit-text">{step.tableHeader}</label>
            <textarea
              id="step-edit-text"
              className="premise-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={5}
            />
            <div className="premise-count">
              {countWords(editText)} mot{countWords(editText) > 1 ? 's' : ''}
            </div>

            <label className="premise-label" htmlFor="step-edit-score">Note sur 20</label>
            <input
              id="step-edit-score"
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
                disabled={!editText.trim() || saving}
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
