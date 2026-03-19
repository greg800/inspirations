import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src="/logo.png" alt="Inspirations" className="navbar-logo-img" />
          Inspirations
        </Link>
        <div className="navbar-actions">
          {user ? (
            <>
              {(user.isApproved || user.isAdmin) && (
                <Link to="/create" className="btn navbar-cta-mobile-hidden">Partager</Link>
              )}
              {user.isAdmin && (
                <Link to="/admin" className="navbar-link">Admin</Link>
              )}
              <span className="navbar-name">{user.name}</span>
              <button className="btn-ghost" onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Se connecter</Link>
              <Link to="/register" className="btn navbar-cta-mobile-hidden">Créer un compte</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
