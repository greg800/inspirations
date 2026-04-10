import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useStickyActions } from '../lib/stickyActions.jsx'
import './MobileBottomBar.css'

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
)

const FlameIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
)

export default function MobileBottomBar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { actions } = useStickyActions()
  const isGallery = pathname === '/'
  const isActivity = pathname === '/activity'
  const isForm = pathname === '/create' || pathname.startsWith('/edit/')

  // Mode formulaire (création/édition)
  if (isForm) {
    return (
      <div className="mobile-bottom-bar form-mode">
        <button type="submit" form="content-form" className="mobile-bottom-btn form-save">
          Enregistrer
        </button>
        <button type="button" className="mobile-bottom-btn form-cancel" onClick={() => navigate(-1)}>
          Annuler
        </button>
      </div>
    )
  }

  // Mode page détail — actions spécifiques
  if (actions) {
    return (
      <div className="mobile-bottom-bar">
        {actions.map((act, i) => (
          <div key={i} className="mobile-bottom-cta">
            {act.to ? (
              <Link to={act.to} className={`mobile-bottom-btn${act.ghost ? ' ghost' : ''}`}>
                {act.label}
              </Link>
            ) : (
              <button
                onClick={act.onClick}
                className={`mobile-bottom-btn${act.ghost ? ' ghost' : ''}`}
              >
                {act.label}
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Mode admin / activité — retour accueil
  const isAdminPage = pathname === '/admin'
  const isProfile = pathname === '/profile'
  if (isAdminPage || isActivity || isProfile) {
    return (
      <div className="mobile-bottom-bar">
        <div className="mobile-bottom-cta">
          <Link to="/" className="mobile-bottom-btn">Retour à l'accueil</Link>
        </div>
      </div>
    )
  }

  // Mode galerie / défaut
  const cta = user
    ? (user.isApproved || user.isAdmin)
      ? <Link to="/create" className="mobile-bottom-btn btn-share"><HeartIcon /> Partager</Link>
      : null
    : <Link to="/register" className="mobile-bottom-btn">Créer un compte</Link>

  return (
    <div className="mobile-bottom-bar">
      {isGallery && (
        <button
          className={`mobile-icon-btn${isActivity ? ' active' : ''}`}
          onClick={() => navigate('/activity')}
          aria-label="Activité"
        >
          <FlameIcon />
        </button>
      )}
      {cta && (
        <div className={`mobile-bottom-cta${isGallery ? ' with-icons' : ''}`}>
          {cta}
        </div>
      )}
    </div>
  )
}
