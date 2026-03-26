import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useStickyActions } from '../lib/stickyActions.jsx'
import './Detail.css'

const MAX_H = 5 * 1.7 * 16 // 5 lignes ≈ 136px

function CollapsibleText({ text }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="collapsible">
      <div className="collapsible-body" style={{ maxHeight: expanded ? 'none' : `${MAX_H}px` }}>
        {text}
        {!expanded && <div className="collapsible-fade" />}
      </div>
      <button className="collapsible-toggle" onClick={() => setExpanded(v => !v)}>
        {expanded ? '− Réduire' : '+ Lire la suite'}
      </button>
    </div>
  )
}

function CollapsibleReviews({ reviews }) {
  const [expanded, setExpanded] = useState(false)
  const needsCollapse = reviews.length > 1

  if (reviews.length === 0) return (
    <p className="reviews-empty">Aucun avis pour l'instant.</p>
  )

  return (
    <div className="collapsible">
      <div className="collapsible-body" style={{ maxHeight: expanded || !needsCollapse ? 'none' : `${MAX_H}px` }}>
        <div className="reviews-list">
          {reviews.map(r => (
            <div key={r.id} className="review-item">
              <div className="review-header">
                <strong>{r.user?.name}</strong>
                <span className="rating">{r.rating}/20</span>
              </div>
              <p className="review-comment">{r.comment}</p>
            </div>
          ))}
        </div>
        {!expanded && needsCollapse && <div className="collapsible-fade" />}
      </div>
      {needsCollapse && (
        <button className="collapsible-toggle" onClick={() => setExpanded(v => !v)}>
          {expanded ? '− Réduire' : `+ Voir les ${reviews.length} avis`}
        </button>
      )}
    </div>
  )
}

export default function Detail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setActions } = useStickyActions()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewsData, setReviewsData] = useState({ reviews: [], avg: null, count: 0 })
  const [reviewForm, setReviewForm] = useState({ rating: '', comment: '' })
  const [reviewError, setReviewError] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [linkPreview, setLinkPreview] = useState(null)
  const [votesData, setVotesData] = useState({ up: 0, down: 0, upVoters: [], downVoters: [], myVote: null })
  const [voteLoading, setVoteLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  function handleShare() {
    const url = `https://inspirations.top/content/${id}`
    const msg = `Hello, je t'invite à te connecter sur ${url} afin que tu puisses consulter "${content.title}", j'aime beaucoup et je voudrais avoir ton avis là-dessus.\n\n${user?.name || ''}`
    navigator.clipboard.writeText(msg).then(() => setShowShareModal(true)).catch(() => setShowShareModal(true))
  }

  useEffect(() => {
    api.content.get(id)
      .then(c => {
        setContent(c)
        if (c.url) api.linkPreview(c.url).then(setLinkPreview).catch(() => {})
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
    api.reviews.list(id).then(setReviewsData)
    api.votes.get(id).then(setVotesData).catch(() => {})
  }, [id])

  async function handleVote(type) {
    if (!user || voteLoading) return
    const prev = votesData.myVote
    setVotesData(v => {
      const next = { ...v }
      if (prev === type) {
        next.myVote = null
        if (type === 'UP') { next.up--; next.upVoters = next.upVoters.filter(n => n !== user.name) }
        else { next.down--; next.downVoters = next.downVoters.filter(n => n !== user.name) }
      } else {
        if (prev === 'UP') { next.up--; next.upVoters = next.upVoters.filter(n => n !== user.name) }
        if (prev === 'DOWN') { next.down--; next.downVoters = next.downVoters.filter(n => n !== user.name) }
        next.myVote = type
        if (type === 'UP') { next.up++; next.upVoters = [user.name, ...next.upVoters] }
        else { next.down++; next.downVoters = [user.name, ...next.downVoters] }
      }
      return next
    })
    setVoteLoading(true)
    try {
      await api.votes.cast(id, type)
      api.votes.get(id).then(setVotesData)
    } catch {
      api.votes.get(id).then(setVotesData)
    } finally {
      setVoteLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette publication ?')) return
    await api.content.delete(id)
    navigate('/')
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    setReviewError('')
    const ratingNum = parseFloat(reviewForm.rating)
    if (!reviewForm.rating || isNaN(ratingNum) || ratingNum < 0 || ratingNum > 20)
      return setReviewError('Note invalide (0 à 20)')
    if (!reviewForm.comment.trim()) return setReviewError('Commentaire requis')
    setReviewLoading(true)
    try {
      await api.reviews.create(id, reviewForm)
      const updated = await api.reviews.list(id)
      setReviewsData(updated)
      setReviewForm({ rating: '', comment: '' })
    } catch (e) {
      setReviewError(e.message)
    } finally {
      setReviewLoading(false)
    }
  }

  async function submitReviewAndGoHome() {
    setReviewError('')
    const ratingNum = parseFloat(reviewForm.rating)
    if (!reviewForm.rating || isNaN(ratingNum) || ratingNum < 0 || ratingNum > 20) {
      setReviewError('Note invalide (0 à 20)')
      document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (!reviewForm.comment.trim()) {
      setReviewError('Commentaire requis')
      document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setReviewLoading(true)
    try {
      await api.reviews.create(id, reviewForm)
      navigate('/')
    } catch (e) {
      setReviewError(e.message)
      document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })
    } finally {
      setReviewLoading(false)
    }
  }

  async function handleDeleteReview() {
    await api.reviews.delete(id)
    setReviewsData(await api.reviews.list(id))
  }

  // Sticky bar actions selon contexte + état du formulaire
  useEffect(() => {
    if (!content) return
    const isAuthor = user && user.id === content.userId
    const canEdit = user && (isAuthor || user.isAdmin)
    // Un admin non-auteur peut laisser un avis
    const canReview = user && user.isApproved && !isAuthor
    const formFilled = !!(reviewForm.rating || reviewForm.comment.trim())

    if (!user) {
      setActions([{ label: 'Créer un compte', to: '/register' }])
    } else if (canEdit && !formFilled) {
      // Modifier / Supprimer tant que le formulaire d'avis est vierge
      setActions([
        { label: 'Modifier', to: `/edit/${content.id}` },
        { label: 'Supprimer', onClick: handleDelete, ghost: true },
      ])
    } else if (canReview) {
      // Dès qu'une note ou un commentaire est saisi → "Publier mon avis"
      setActions([{
        label: formFilled ? 'Enregistrer mon avis' : 'Publier mon avis',
        onClick: formFilled
          ? submitReviewAndGoHome
          : () => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' }),
      }])
    } else {
      setActions(null)
    }
    return () => setActions(null)
  }, [content?.id, user?.id, user?.isAdmin, reviewForm.rating, reviewForm.comment])

  if (loading) return <div className="detail-loading container">Chargement…</div>
  if (!content) return null

  const canEdit = user && (user.id === content.userId || user.isAdmin)
  const isAuthor = user && user.id === content.userId
  const canReview = user && user.isApproved && !isAuthor
  const myReview = user ? reviewsData.reviews.find(r => r.userId === user.id) : null

  return (
    <div className="detail-page">
      <div className="container">
        <div className="detail-topbar">
          <Link to="/" className="detail-back">← Retour</Link>
          {user && (
            <button className="share-btn" onClick={handleShare} aria-label="Partager">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          )}
        </div>

        <div className="detail-layout">

          {/* Sidebar (col 1) */}
          <div className="detail-sidebar">
            <div className="detail-cover">
              {content.url ? (
                <a href={content.url} target="_blank" rel="noopener noreferrer">
                  <img src={content.coverImage} alt={content.title} />
                </a>
              ) : (
                <img src={content.coverImage} alt={content.title} />
              )}
            </div>
            {/* Link preview — desktop only (hidden on mobile via CSS) */}
            {content.url && (
              <a href={content.url} target="_blank" rel="noopener noreferrer" className="link-preview link-preview-desktop">
                {linkPreview?.image && (
                  <div className="link-preview-img">
                    <img src={linkPreview.image} alt="" />
                  </div>
                )}
                <div className="link-preview-text">
                  <span className="link-preview-domain">{linkPreview?.domain || (() => { try { return new URL(content.url).hostname } catch { return content.url } })()}</span>
                  <span className="link-preview-title">{linkPreview?.title || content.url}</span>
                </div>
                <span className="link-preview-arrow">↗</span>
              </a>
            )}
            {/* Edit actions desktop only */}
            {canEdit && (
              <div className="detail-edit-actions">
                <Link to={`/edit/${content.id}`} className="btn" style={{ width: '100%', justifyContent: 'center' }}>Modifier</Link>
                <button className="btn-ghost" style={{ width: '100%' }} onClick={handleDelete}>Supprimer</button>
              </div>
            )}
          </div>

          {/* Zone 1 — Identité (col 2, row 1) */}
          <div className="detail-zone zone-identity">
            <div className="detail-badges">
              {content.support && <span className="badge">{content.support}</span>}
              {content.genre && <span className="badge">{content.genre}</span>}
              {content.publishDate && (
                <span className="badge">{new Date(content.publishDate).getFullYear()}</span>
              )}
            </div>
            <h1 className="detail-title">{content.title}</h1>
            <p className="detail-author">{content.author}</p>
            <div className="detail-shared">Partagé par <strong>{content.sponsor}</strong></div>
            <div className="detail-ratings">
              <div className="detail-rating-item">
                <span className="detail-rating-label">Note du sponsor</span>
                <span className="rating">{content.rating}/20</span>
              </div>
              {reviewsData.avg !== null && (
                <div className="detail-rating-item">
                  <span className="detail-rating-label">Moyenne lecteurs</span>
                  <span className="rating">{reviewsData.avg}/20
                    <span className="review-count"> ({reviewsData.count})</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Zones 2-5 (col 2, row 2+ / full width on mobile) */}
          <div className="detail-content">

            {/* Link preview — mobile only (hidden on desktop via CSS) */}
            {content.url && (
              <a href={content.url} target="_blank" rel="noopener noreferrer" className="link-preview link-preview-mobile">
                {linkPreview?.image && (
                  <div className="link-preview-img">
                    <img src={linkPreview.image} alt="" />
                  </div>
                )}
                <div className="link-preview-text">
                  <span className="link-preview-domain">{linkPreview?.domain || (() => { try { return new URL(content.url).hostname } catch { return content.url } })()}</span>
                  <span className="link-preview-title">{linkPreview?.title || content.url}</span>
                </div>
                <span className="link-preview-arrow">↗</span>
              </a>
            )}

            {/* Zone 2 — Pourquoi */}
            <div className="detail-zone">
              <div className="zone-label">Pourquoi en faire l'expérience ?</div>
              <CollapsibleText text={content.whyRead} />
            </div>

            {/* Zone 3 — Résumé */}
            <div className="detail-zone">
              <div className="zone-label">Résumé</div>
              <CollapsibleText text={content.summary} />
            </div>

            {/* Zone 4 — Votes */}
            <div className="detail-zone">
              <div className="zone-label">Votes</div>
              <div className="votes-section">
                <div className="votes-summary">
                  <button
                    className={`vote-detail-btn${votesData.myVote === 'UP' ? ' active' : ''}`}
                    onClick={() => handleVote('UP')}
                    disabled={!user || voteLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                    </svg>
                    <span className="votes-count">{votesData.up}</span>
                  </button>
                  <button
                    className={`vote-detail-btn${votesData.myVote === 'DOWN' ? ' active' : ''}`}
                    onClick={() => handleVote('DOWN')}
                    disabled={!user || voteLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                    </svg>
                    <span className="votes-count">{votesData.down}</span>
                  </button>
                </div>
                {(votesData.upVoters.length > 0 || votesData.downVoters.length > 0) && (
                  <div className="votes-detail">
                    {votesData.upVoters.length > 0 && (
                      <div className="votes-group">
                        <span className="votes-group-label">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                          </svg>
                          {votesData.upVoters.join(', ')}
                        </span>
                      </div>
                    )}
                    {votesData.downVoters.length > 0 && (
                      <div className="votes-group">
                        <span className="votes-group-label">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                          </svg>
                          {votesData.downVoters.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Zone 5 — Avis */}
            <div className="detail-zone" id="review-section">
              <div className="zone-label">
                Avis des lecteurs
                {reviewsData.count > 0 && (
                  <span className="zone-label-count">{reviewsData.count}</span>
                )}
              </div>
              <CollapsibleReviews reviews={reviewsData.reviews} />
              {canReview && (
                <div className="review-form-wrap">
                  <div className="zone-sublabel">
                    {myReview ? 'Votre avis' : 'Laisser un avis'}
                  </div>
                  {myReview && !reviewForm.rating ? (
                    <div className="my-review">
                      <div className="review-header">
                        <span className="rating">{myReview.rating}/20</span>
                        <button className="btn-ghost btn-sm"
                          onClick={() => setReviewForm({ rating: String(myReview.rating), comment: myReview.comment })}>
                          Modifier
                        </button>
                        <button className="btn-ghost btn-sm danger" onClick={handleDeleteReview}>
                          Supprimer
                        </button>
                      </div>
                      <p className="review-comment">{myReview.comment}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="review-form">
                      <div className="review-form-row">
                        <div className="field">
                          <label>Note /20</label>
                          <input type="number" min="0" max="20" step="0.5"
                            value={reviewForm.rating}
                            onChange={e => setReviewForm(f => ({ ...f, rating: e.target.value }))}
                            required />
                        </div>
                        <div className="field" style={{ flex: 1 }}>
                          <label>Commentaire</label>
                          <textarea rows={2} value={reviewForm.comment}
                            onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                            required />
                        </div>
                      </div>
                      {reviewError && <p className="msg-error">{reviewError}</p>}
                      {myReview && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="submit" className="btn" disabled={reviewLoading}>
                            {reviewLoading ? 'Envoi…' : 'Mettre à jour'}
                          </button>
                          <button type="button" className="btn-ghost"
                            onClick={() => setReviewForm({ rating: '', comment: '' })}>
                            Annuler
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <p>Le message avec le lien vers cette œuvre est bien copié dans le presse-papier, à toi de le coller dans une autre app !</p>
            <button className="btn full" onClick={() => setShowShareModal(false)}>Ok, c'est compris</button>
          </div>
        </div>
      )}
    </div>
  )
}
