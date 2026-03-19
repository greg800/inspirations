import { useState, useEffect } from 'react'
import './IOSInstallBanner.css'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIOS()) return
    if (isInStandaloneMode()) return
    if (localStorage.getItem('ios-banner-dismissed')) return
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    localStorage.setItem('ios-banner-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="ios-banner">
      <div className="ios-banner-content">
        <div className="ios-banner-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v13M8 6l4-4 4 4"/>
            <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5"/>
          </svg>
        </div>
        <div className="ios-banner-text">
          <strong>Installer l'app</strong>
          <span>Appuie sur <b>Partager</b> puis <b>"Sur l'écran d'accueil"</b></span>
        </div>
        <button className="ios-banner-close" onClick={dismiss} aria-label="Fermer">×</button>
      </div>
      <div className="ios-banner-arrow" />
    </div>
  )
}
