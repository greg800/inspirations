import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import './ContentForm.css'

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function ContentForm({ editing }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '', author: '', summary: '', whyRead: '',
    rating: '', support: '', genre: '', publishDate: '', url: '', bubbleId: '',
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [supports, setSupports] = useState([])
  const [genres, setGenres] = useState([])
  const [bubbles, setBubbles] = useState([])

  useEffect(() => {
    api.tags.list('support').then(ts => setSupports(ts.map(t => t.value)))
    api.tags.list('genre').then(ts => setGenres(ts.map(t => t.value)))
    api.bubbles.mine().then(bs => {
      setBubbles(bs)
      // Pré-sélectionner si une seule bulle
      if (bs.length === 1 && !editing) {
        setForm(f => ({ ...f, bubbleId: String(bs[0].id) }))
      }
    }).catch(() => {})
    if (editing && id) {
      api.content.get(id).then(c => {
        setForm({
          title: c.title,
          author: c.author,
          summary: c.summary,
          whyRead: c.whyRead,
          rating: String(c.rating),
          support: c.support || '',
          genre: c.genre || '',
          publishDate: c.publishDate ? c.publishDate.slice(0, 10) : '',
          url: c.url || '',
          bubbleId: c.bubbleId ? String(c.bubbleId) : '',
        })
        setCoverPreview(c.coverImage)
      })
    }
  }, [editing, id])

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleCover(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const wWhyRead = wordCount(form.whyRead)
    if (wWhyRead < 20) return setError(`"Pourquoi en faire l'expérience" trop court : ${wWhyRead} mots (minimum 20)`)
    if (!editing && !coverFile) return setError('Image de couverture requise')
    if (!form.bubbleId) return setError('Veuillez choisir une bulle')

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
    if (coverFile) fd.append('coverImage', coverFile)

    setLoading(true)
    try {
      if (editing) {
        await api.content.update(id, fd)
      } else {
        await api.content.create(fd)
      }
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const wWhyRead = wordCount(form.whyRead)

  return (
    <div className="form-page">
      <div className="container form-container">
        <h1>{editing ? 'Modifier' : 'Partager une inspiration'}</h1>

        <form id="content-form" onSubmit={handleSubmit} className="content-form">
          {/* Obligatoires */}
          <div className="form-section">
            <h2>Informations principales</h2>
            <div className="field">
              <label>Bulle *</label>
              {bubbles.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                  Vous n'appartenez à aucune bulle. Créez-en une depuis votre profil.
                </p>
              ) : (
                <select value={form.bubbleId} onChange={e => set('bubbleId', e.target.value)} required>
                  {bubbles.length > 1 && <option value="">— Choisir une bulle</option>}
                  {bubbles.map(b => <option key={b.id} value={String(b.id)}>🫧 {b.name}</option>)}
                </select>
              )}
            </div>
            <div className="form-row">
              <div className="field">
                <label>Titre *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div className="field">
                <label>Auteur *</label>
                <input value={form.author} onChange={e => set('author', e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label>Note /20 *</label>
              <input type="number" min="0" max="20" step="0.5" value={form.rating}
                onChange={e => set('rating', e.target.value)} required />
            </div>
          </div>

          {/* Image */}
          <div className="form-section">
            <h2>Image de couverture {!editing && '*'}</h2>
            <div className="cover-upload">
              {coverPreview && (
                <div className="cover-preview">
                  <img src={coverPreview} alt="Aperçu" />
                </div>
              )}
              <div className="field">
                <label>{editing ? 'Nouvelle image (optionnel)' : 'Fichier image *'}</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCover} />
                <span className="hint">JPEG, PNG ou WebP — largeur minimum 250px</span>
              </div>
            </div>
          </div>

          {/* Textes */}
          <div className="form-section">
            <h2>Contenu</h2>
            <div className="field">
              <label>Pourquoi en faire l'expérience ? *</label>
              <textarea rows={4} value={form.whyRead}
                onChange={e => set('whyRead', e.target.value)} required />
              <span className={`counter ${wWhyRead >= 20 ? 'ok' : wWhyRead > 0 ? 'error' : ''}`}>
                {wWhyRead} / 20 mots minimum
              </span>
            </div>
            <div className="field">
              <label>Résumé *</label>
              <textarea rows={10} value={form.summary}
                onChange={e => set('summary', e.target.value)} required />
            </div>
          </div>

          {/* Optionnels */}
          <div className="form-section">
            <h2>Informations complémentaires <span className="optional-label">optionnel</span></h2>
            <div className="form-row">
              <div className="field">
                <label>Support</label>
                <select value={form.support} onChange={e => set('support', e.target.value)}>
                  <option value="">—</option>
                  {supports.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Genre</label>
                <select value={form.genre} onChange={e => set('genre', e.target.value)}>
                  <option value="">—</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Date de publication</label>
                <input type="date" value={form.publishDate}
                  onChange={e => set('publishDate', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Lien internet</label>
              <input type="url" value={form.url} onChange={e => set('url', e.target.value)}
                placeholder="https://…" />
              <span className="hint">Pour les articles et podcasts en ligne</span>
            </div>
          </div>

          {error && <p className="msg-error">{error}</p>}
        </form>
      </div>
    </div>
  )
}
