import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useGalleryFilter } from '../lib/galleryFilter.jsx'
import './Activity.css'

const WorkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 3H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H3V5h18v14zM6.5 16l3-4 2.5 3 2-2.5 3 3.5H6.5z"/>
  </svg>
)

const PersonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
)

export default function Activity() {
  const navigate = useNavigate()
  const { setFilter } = useGalleryFilter()
  const [period, setPeriod] = useState('7d')
  const [view, setView] = useState('works')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.activity.get({ period, view })
      .then(setData)
      .finally(() => setLoading(false))
  }, [period, view])

  function goToContributor(name) {
    setFilter('contributor', name)
    navigate('/')
  }

  return (
    <div className="activity-page">
      <div className="container">
        <header className="activity-header">
          <h1>Activité</h1>
          <p className="activity-subtitle">Ce qui buzz en ce moment</p>
        </header>

        {/* Filtres période */}
        <div className="activity-period-bar">
          {['1d', '7d', 'all'].map(p => (
            <button
              key={p}
              className={`activity-period-btn${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '1d' ? '1 jour' : p === '7d' ? '7 jours' : 'Tous'}
            </button>
          ))}
        </div>

        {/* Toggle vue */}
        <div className="activity-view-bar">
          <button
            className={`activity-view-btn${view === 'works' ? ' active' : ''}`}
            onClick={() => setView('works')}
            aria-label="Par œuvre"
            title="Par œuvre"
          >
            <WorkIcon />
          </button>
          <button
            className={`activity-view-btn${view === 'contributors' ? ' active' : ''}`}
            onClick={() => setView('contributors')}
            aria-label="Par contributeur"
            title="Par contributeur"
          >
            <PersonIcon />
          </button>
        </div>

        {loading ? (
          <div className="activity-loading">Chargement…</div>
        ) : data.length === 0 ? (
          <div className="activity-empty">Aucune activité sur cette période.</div>
        ) : view === 'works' ? (
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th className="col-title">Œuvre</th>
                  <th className="col-num" title="Avis rédigés">💬</th>
                  <th className="col-num" title="Note moyenne">★</th>
                  <th className="col-num" title="Pouces haut">👍</th>
                  <th className="col-num" title="Pouces bas">👎</th>
                  <th className="col-num" title="Score de popularité">🔥</th>
                </tr>
              </thead>
              <tbody>
                {data.map(w => (
                  <tr key={w.id}>
                    <td className="col-title">
                      <a href={`/content/${w.id}`} onClick={e => { e.preventDefault(); navigate(`/content/${w.id}`) }}>
                        {w.title}
                      </a>
                    </td>
                    <td className="col-num">{w.reviewCount}</td>
                    <td className="col-num">{w.avgRating != null ? `${w.avgRating}/20` : '—'}</td>
                    <td className="col-num">{w.upCount}</td>
                    <td className="col-num">{w.downCount}</td>
                    <td className="col-num score">{w.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th className="col-title">Contributeur</th>
                  <th className="col-num" title="Œuvres publiées">📚</th>
                  <th className="col-num" title="Avis rédigés">💬</th>
                  <th className="col-num" title="Votes">👍</th>
                  <th className="col-num" title="Score">🔥</th>
                </tr>
              </thead>
              <tbody>
                {data.map(c => (
                  <tr key={c.name}>
                    <td className="col-title">
                      <button className="activity-contrib-link" onClick={() => goToContributor(c.name)}>
                        {c.name}
                      </button>
                    </td>
                    <td className="col-num">{c.worksCount}</td>
                    <td className="col-num">{c.reviewCount}</td>
                    <td className="col-num">{c.voteCount}</td>
                    <td className="col-num score">{c.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
