import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import './MobileBottomBar.css'

export default function MobileBottomBar() {
  const { user } = useAuth()

  return (
    <div className="mobile-bottom-bar">
      {user ? (
        (user.isApproved || user.isAdmin) && (
          <Link to="/create" className="mobile-bottom-btn">Partager</Link>
        )
      ) : (
        <Link to="/register" className="mobile-bottom-btn">Créer un compte</Link>
      )}
    </div>
  )
}
