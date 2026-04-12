import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useGalleryFilter } from '../lib/galleryFilter.jsx'
import ContentCard from '../components/ContentCard.jsx'
import './Gallery.css'

const PAGE_SIZE = 20

function zoomToMinWidth(zoom) {
  return Math.round(60 + (zoom - 10) * (220 - 60) / 90)
}

const FunnelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
    <path d="M12 16l1.5 1.5L12 20l-1.5-2.5z" opacity=".6"/>
  </svg>
)

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
)

const ArrowDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 10l5 5 5-5z"/>
  </svg>
)

export default function Gallery() {
  const { user, updateUser } = useAuth()
  const { filtersVisible, setFiltersVisible, hasActiveFilters, setHasActiveFilters, filters, setFilter, resetFilters, sort, setSort, search, setSearch } = useGalleryFilter()

  function toggleFilters() {
    const next = !filtersVisible
    setFiltersVisible(next)
    if (next) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const [allContents, setAllContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [filterVersion, setFilterVersion] = useState(0)

  const [zoom, setZoom] = useState(() => {
    const saved = parseInt(localStorage.getItem('zoom'))
    return isNaN(saved) ? 50 : saved
  })
  const [supports, setSupports] = useState([])
  const [genres, setGenres] = useState([])
  const [contributors, setContributors] = useState([])
  const saveZoomTimer = useRef(null)
  const searchTimer = useRef(null)
  const loaderRef = useRef(null)

  // Sync zoom from server
  useEffect(() => {
    if (user?.zoomLevel != null) {
      setZoom(user.zoomLevel)
      localStorage.setItem('zoom', user.zoomLevel)
    }
  }, [user?.zoomLevel])

  useEffect(() => {
    api.tags.list('support').then(ts => setSupports(ts.map(t => t.value)))
    api.tags.list('genre').then(ts => setGenres(ts.map(t => t.value)))
    api.contributors.list().then(setContributors)
  }, [])

  // Reset quand filtres/tri/recherche changent
  useEffect(() => {
    setFilterVersion(v => v + 1)
    setPage(1)
    setAllContents([])
    setHasActiveFilters(!!(filters.support || filters.genre || filters.minRating || filters.contributor || search))
  }, [filters.support, filters.genre, filters.minRating, filters.contributor, sort, search])

  // Charger une page
  useEffect(() => {
    const params = { page, limit: PAGE_SIZE, sort }
    if (filters.support) params.support = filters.support
    if (filters.genre) params.genre = filters.genre
    if (filters.minRating) params.minRating = filters.minRating
    if (filters.contributor) params.contributor = filters.contributor
    if (search) params.search = search

    if (page === 1) setLoading(true)
    else setLoadingMore(true)

    api.content.listPage(params).then(result => {
      const items = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : []
      setAllContents(prev => page === 1 ? items : [...prev, ...items])
      setHasMore(result?.hasMore ?? false)
      setLoading(false)
      setLoadingMore(false)
    }).catch(() => {
      setLoading(false)
      setLoadingMore(false)
    })
  }, [filterVersion, page])

  // Infinite scroll — IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setPage(p => p + 1)
      }
    }, { rootMargin: '200px' })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading])

  const minWidth = zoomToMinWidth(zoom)
  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
    gap: zoom < 30 ? '8px' : zoom < 60 ? '16px' : '24px',
  }

  return (
    <div className="gallery-page">
      <div className="container">
        <header className="gallery-header">
          <p className="gallery-subtitle">Les livres, podcasts, films et articles qui changent une vie.</p>
        </header>

        {user && (
        <div className="search-row">
          <div className="search-bar">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              placeholder="Titre, auteur…"
              value={search}
              onChange={e => {
                const val = e.target.value
                clearTimeout(searchTimer.current)
                searchTimer.current = setTimeout(() => setSearch(val), 300)
              }}
              className="search-input"
              aria-label="Rechercher"
            />
            {search && (
              <button className="search-clear" onClick={() => { setSearch(''); document.querySelector('.search-input').value = '' }} aria-label="Effacer">×</button>
            )}
          </div>
          <button
            className={`search-filter-btn${filtersVisible ? ' active' : ''}`}
            onClick={toggleFilters}
            aria-label="Filtres"
          >
            <FunnelIcon />
            {hasActiveFilters && <span className="search-filter-dot" />}
          </button>
        </div>
        )}

        <div className={`filters${filtersVisible ? ' filters--visible' : ''}`}>

          {/* Sous-zone tri */}
          <div className="filters-section">
            <span className="filters-section-label">Tri</span>
            <div className="sort-buttons">
              <button
                className={`sort-btn${sort === 'recent' ? ' active' : ''}`}
                onClick={() => setSort('recent')}
                title="Trier par activité récente"
              >
                <ClockIcon /><ArrowDown />
              </button>
              <button
                className={`sort-btn${sort === 'score' ? ' active' : ''}`}
                onClick={() => setSort('score')}
                title="Trier par note globale"
              >
                <StarIcon /><ArrowDown />
              </button>
            </div>
          </div>

          {/* Sous-zone filtres */}
          <div className="filters-section">
            <span className="filters-section-label">Filtres</span>
            <div className="filters-row">
              <select value={filters.support} onChange={e => setFilter('support', e.target.value)}>
                <option value="">Tous les supports</option>
                {supports.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.genre} onChange={e => setFilter('genre', e.target.value)}>
                <option value="">Tous les genres</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={filters.minRating} onChange={e => setFilter('minRating', e.target.value)}>
                <option value="">Toutes les notes</option>
                <option value="15">15+ / 20</option>
                <option value="17">17+ / 20</option>
                <option value="19">19+ / 20</option>
              </select>
              <select value={filters.contributor} onChange={e => setFilter('contributor', e.target.value)}>
                <option value="">Tous les contributeurs</option>
                {contributors.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              {(filters.support || filters.genre || filters.minRating || filters.contributor) && (
                <button className="btn-ghost" onClick={resetFilters}>Réinitialiser</button>
              )}
            </div>
          </div>

          {/* Zoom */}
          <div className="zoom-bar">
            <span className="zoom-icon">⊟</span>
            <input
              type="range" min="10" max="100" value={zoom}
              onChange={e => {
                const val = Number(e.target.value)
                setZoom(val)
                localStorage.setItem('zoom', val)
                clearTimeout(saveZoomTimer.current)
                if (user) {
                  saveZoomTimer.current = setTimeout(() => {
                    api.users.updatePreferences({ zoomLevel: val }).then(() => updateUser({ zoomLevel: val })).catch(() => {})
                  }, 600)
                }
              }}
              className="zoom-slider"
              aria-label="Taille des aperçus"
            />
            <span className="zoom-icon">⊞</span>
          </div>
        </div>

        {loading ? (
          <div className="gallery-loading">Chargement…</div>
        ) : !user ? (
          <div className="gallery-no-bubble">
            <p>Connectez-vous pour découvrir les inspirations partagées dans votre bulle.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
              <Link to="/login" className="btn">Se connecter</Link>
              <Link to="/register" className="btn-ghost">Créer un compte</Link>
            </div>
          </div>
        ) : !loading && allContents.length === 0 && !filters.support && !filters.genre && !filters.minRating && !filters.contributor && !search ? (
          <div className="gallery-no-bubble">
            <p>Vous devez être invité à au moins une bulle de partage pour voir ici les expériences à partager.</p>
            <p className="gallery-no-bubble-hint">Demandez une invitation à un membre.</p>
          </div>
        ) : allContents.length === 0 ? (
          <div className="gallery-empty">Aucun résultat pour ces filtres.</div>
        ) : (
          <>
            <div className="gallery-grid" style={gridStyle}>
              {allContents.map(c => <ContentCard key={c.id} content={c} zoom={zoom} />)}
            </div>
            {/* Sentinel pour l'infinite scroll */}
            <div ref={loaderRef} className="gallery-loader">
              {loadingMore && <span>Chargement…</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
