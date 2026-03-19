import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useGalleryFilter } from '../lib/galleryFilter.jsx'
import './MobileBottomBar.css'

const FunnelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/>
  </svg>
)

export default function MobileBottomBar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { filtersVisible, setFiltersVisible, hasActiveFilters } = useGalleryFilter()
  const isGallery = pathname === '/'

  function toggleFilters() {
    const next = !filtersVisible
    setFiltersVisible(next)
    if (next) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cta = user
    ? (user.isApproved || user.isAdmin) ? <Link to="/create" className="mobile-bottom-btn">Partager</Link> : null
    : <Link to="/register" className="mobile-bottom-btn">Créer un compte</Link>

  return (
    <div className="mobile-bottom-bar">
      {isGallery && (
        <button
          className={`mobile-funnel-btn${filtersVisible ? ' active' : ''}`}
          onClick={toggleFilters}
          aria-label="Filtres"
        >
          <FunnelIcon />
          {hasActiveFilters && <span className="mobile-funnel-dot" />}
        </button>
      )}
      {cta && (
        <div className={`mobile-bottom-cta${isGallery ? ' with-funnel' : ''}`}>
          {cta}
        </div>
      )}
    </div>
  )
}
