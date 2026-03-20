import { useRegisterSW } from 'virtual:pwa-register/react'
import './PWAUpdatePrompt.css'

export default function PWAUpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="pwa-update-banner">
      <span>🆕 Nouvelle version disponible</span>
      <button onClick={() => updateServiceWorker(true)}>Recharger</button>
    </div>
  )
}
