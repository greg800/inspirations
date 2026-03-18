import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import './ContentCard.css'

// Seuils de disparition progressive (zoom en %)
// < 70 : masque le sponsor
// < 50 : masque la note + votes + sponsor
// < 30 : masque l'auteur + note + sponsor
// < 15 : masque tout sauf l'image

const ThumbUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
  </svg>
)

const ThumbDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
  </svg>
)

export default function ContentCard({ content, zoom = 100 }) {
  const { user } = useAuth()
  const showSponsor = zoom >= 70
  const showRating  = zoom >= 50
  const showVotes   = zoom >= 50
  const showAuthor  = zoom >= 30
  const showBody    = zoom >= 15
  const showBadges  = zoom >= 40

  const [upCount,   setUpCount]   = useState(content.upCount   || 0)
  const [downCount, setDownCount] = useState(content.downCount || 0)
  const [myVote,    setMyVote]    = useState(content.myVote    || null)
  const [loading,   setLoading]   = useState(false)

  async function handleVote(e, type) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    if (loading) return
    setLoading(true)
    try {
      const prev = myVote
      // Optimistic update
      if (prev === type) {
        // annulation
        setMyVote(null)
        type === 'UP' ? setUpCount(n => n - 1) : setDownCount(n => n - 1)
      } else {
        if (prev === 'UP')   setUpCount(n => n - 1)
        if (prev === 'DOWN') setDownCount(n => n - 1)
        setMyVote(type)
        type === 'UP' ? setUpCount(n => n + 1) : setDownCount(n => n + 1)
      }
      await api.votes.cast(content.id, type)
    } catch {
      // rollback
      setMyVote(content.myVote || null)
      setUpCount(content.upCount || 0)
      setDownCount(content.downCount || 0)
    } finally {
      setLoading(false)
    }
  }

  const bodyStyle = showBody ? {
    padding: zoom < 40 ? '8px' : zoom < 60 ? '12px' : '16px',
    gap: zoom < 40 ? '3px' : '6px',
  } : null

  return (
    <div className="card-wrapper">
      <Link to={`/content/${content.id}`} className="card">
        <div className="card-cover">
          <img src={content.coverImage} alt={content.title} />
        </div>
        {showBody && (
          <div className="card-body" style={bodyStyle}>
            {showBadges && (
              <div className="card-meta">
                {content.support && <span className="badge">{content.support}</span>}
                {content.genre && <span className="badge">{content.genre}</span>}
              </div>
            )}
            <h3 className="card-title" style={{ fontSize: zoom < 40 ? '11px' : zoom < 60 ? '13px' : '15px' }}>
              {content.title}
            </h3>
            {showAuthor && <p className="card-author">{content.author}</p>}
            {(showRating || showSponsor) && (
              <div className="card-footer" style={{ paddingTop: zoom < 40 ? '6px' : '10px' }}>
                {showRating && <span className="rating">{content.rating}/20</span>}
                {showVotes && (
                  <div className="card-votes">
                    <button
                      className={`vote-btn${myVote === 'UP' ? ' active' : ''}`}
                      onClick={e => handleVote(e, 'UP')}
                      title={user ? 'J\'aime' : 'Connectez-vous pour voter'}
                      disabled={!user}
                    >
                      <ThumbUp />
                      <span>({upCount})</span>
                    </button>
                    <button
                      className={`vote-btn${myVote === 'DOWN' ? ' active' : ''}`}
                      onClick={e => handleVote(e, 'DOWN')}
                      title={user ? 'Je n\'aime pas' : 'Connectez-vous pour voter'}
                      disabled={!user}
                    >
                      <ThumbDown />
                      <span>({downCount})</span>
                    </button>
                  </div>
                )}
                {showSponsor && <span className="card-shared-by">par {content.user?.name}</span>}
              </div>
            )}
          </div>
        )}
      </Link>
    </div>
  )
}
