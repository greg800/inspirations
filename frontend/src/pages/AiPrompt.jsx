import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useStickyActions } from '../lib/stickyActions.jsx'
import './AiPrompt.css'

export default function AiPrompt() {
  const { key } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setActions } = useStickyActions()

  const [content, setContent] = useState('')
  const [defaultContent, setDefaultContent] = useState('')
  const [label, setLabel] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    api.ai.getPrompt(key)
      .then(data => {
        setContent(data.content)
        setDefaultContent(data.defaultContent)
        setLabel(data.label || '')
        setIsCustom(data.isCustom)
      })
      .catch(err => setError(err.message || 'Chargement impossible'))
      .finally(() => setLoading(false))
  }, [user, key])

  useEffect(() => {
    setActions([{ label: 'Retour', ghost: true, onClick: () => navigate(-1) }])
    return () => setActions(null)
  }, [])

  async function save() {
    if (!content.trim() || saving) return
    setError('')
    setSaving(true)
    try {
      const data = await api.ai.savePrompt(key, content)
      setContent(data.content)
      setIsCustom(true)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  async function reset() {
    if (!confirm('Revenir au prompt par défaut ? Votre version sera perdue.')) return
    setError('')
    try {
      const data = await api.ai.resetPrompt(key)
      setContent(data.content)
      setIsCustom(false)
    } catch (err) {
      setError(err.message || 'Réinitialisation impossible')
    }
  }

  const modified = content !== defaultContent

  return (
    <div className="prompt-page">
      <div className="container">
        <p className="prompt-eyebrow">Storic</p>
        <h1>Prompt de l'IA</h1>
        <p className="prompt-subtitle">
          {label
            ? <>Ce texte est envoyé à Claude comme consigne quand vous cliquez sur « {label} ».</>
            : <>Ce texte est envoyé à Claude comme consigne.</>}
          {' '}
          Le contexte de l'histoire — titre, éléments retenus aux étapes précédentes, textes
          déjà écrits à cette étape — lui est transmis <strong>automatiquement</strong>, suivi de
          votre texte. Vous n'avez pas à les recopier ici : dites seulement à Claude quoi en faire.
        </p>

        {error && <p className="prompt-error">{error}</p>}

        {loading ? (
          <p className="prompt-loading">Chargement…</p>
        ) : (
          <>
            <div className="prompt-status">
              {isCustom ? 'Vous utilisez votre propre version.' : 'Vous utilisez le prompt par défaut.'}
            </div>

            <textarea
              className="prompt-input"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={18}
              spellCheck="false"
            />

            <div className="prompt-actions">
              <button
                className="prompt-btn"
                onClick={save}
                disabled={!content.trim() || saving}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                className="prompt-btn ghost"
                onClick={reset}
                disabled={!isCustom && !modified}
              >
                Revenir au prompt par défaut
              </button>
              {saved && <span className="prompt-saved">Enregistré</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
