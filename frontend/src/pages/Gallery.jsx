import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import ContentCard from '../components/ContentCard.jsx'
import './Gallery.css'

// zoom 10→100 : minWidth 60px→220px
function zoomToMinWidth(zoom) {
  return Math.round(60 + (zoom - 10) * (220 - 60) / 90)
}

export default function Gallery() {
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ support: '', genre: '', minRating: '' })
  const [zoom, setZoom] = useState(100)
  const [supports, setSupports] = useState([])
  const [genres, setGenres] = useState([])

  useEffect(() => {
    api.tags.list('support').then(ts => setSupports(ts.map(t => t.value)))
    api.tags.list('genre').then(ts => setGenres(ts.map(t => t.value)))
  }, [])

  useEffect(() => {
    const params = {}
    if (filters.support) params.support = filters.support
    if (filters.genre) params.genre = filters.genre
    if (filters.minRating) params.minRating = filters.minRating

    setLoading(true)
    api.content.list(params)
      .then(setContents)
      .finally(() => setLoading(false))
  }, [filters])

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  const minWidth = zoomToMinWidth(zoom)
  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
    gap: zoom < 30 ? '8px' : zoom < 60 ? '16px' : '24px',
  }

  return (
    <div className="gallery-page">
      <div className="container">
        <header className="gallery-header">
          <h1>Inspirations</h1>
          <p className="gallery-subtitle">Les livres, podcasts et articles qui changent une vie.</p>
        </header>

        <div className="filters">
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
          {(filters.support || filters.genre || filters.minRating) && (
            <button className="btn-ghost" onClick={() => setFilters({ support: '', genre: '', minRating: '' })}>
              Réinitialiser
            </button>
          )}
        </div>

        <div className="zoom-bar">
          <span className="zoom-icon">⊟</span>
          <input
            type="range"
            min="10"
            max="100"
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="zoom-slider"
            aria-label="Taille des aperçus"
          />
          <span className="zoom-icon">⊞</span>
        </div>

        {loading ? (
          <div className="gallery-loading">Chargement…</div>
        ) : contents.length === 0 ? (
          <div className="gallery-empty">Aucun résultat pour ces filtres.</div>
        ) : (
          <div className="gallery-grid" style={gridStyle}>
            {contents.map(c => <ContentCard key={c.id} content={c} zoom={zoom} />)}
          </div>
        )}
      </div>
    </div>
  )
}
