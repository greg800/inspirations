import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { useStickyActions } from '../lib/stickyActions.jsx'
import './AiCosts.css'

const nf = new Intl.NumberFormat('fr-FR')

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

export default function AiCosts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setActions } = useStickyActions()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api.ai.costs()
      .then(setData)
      .catch(err => setError(err.message || 'Chargement impossible'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user?.isAdmin) { navigate('/'); return }
    load()
  }, [user])

  useEffect(() => {
    setActions([{ label: 'Retour', ghost: true, onClick: () => navigate(-1) }])
    return () => setActions(null)
  }, [])

  return (
    <div className="costs-page">
      <div className="container">
        <p className="costs-eyebrow">Administration</p>
        <h1>Coûts IA</h1>
        <p className="costs-subtitle">
          Montants réellement engagés sur les appels à l'IA, par fonctionnalité.
          {data && ` Conversion € approximative (1 € ≈ ${data.usdPerEur} $).`}
        </p>

        {error && <p className="costs-error">{error}</p>}

        {loading ? (
          <p className="costs-loading">Chargement…</p>
        ) : data ? (
          <>
            <div className="costs-total">
              <div className="costs-total-label">Total engagé à ce jour</div>
              <div className="costs-total-value">{data.total.costEur.toFixed(4)} €</div>
              <div className="costs-total-detail">
                {nf.format(data.total.calls)} appel{data.total.calls > 1 ? 's' : ''} ·{' '}
                {nf.format(data.total.tokens)} tokens · {data.total.costUsd.toFixed(4)} $
              </div>
            </div>

            {data.features.length === 0 ? (
              <p className="costs-empty">Aucun appel à l'IA pour le moment.</p>
            ) : (
              <div className="costs-table">
                <div className="costs-head">
                  <span>Fonctionnalité</span>
                  <span>Appels</span>
                  <span>Tokens</span>
                  <span>Coût €</span>
                  <span>Dernier appel</span>
                </div>
                {data.features.map(f => (
                  <div key={f.feature} className="costs-row">
                    <span className="costs-feature">{f.feature}</span>
                    <span>{nf.format(f.calls)}</span>
                    <span>{nf.format(f.tokens)}</span>
                    <span className="costs-amount">{f.costEur.toFixed(4)} €</span>
                    <span className="costs-date">{formatDate(f.lastCallAt)}</span>
                  </div>
                ))}
              </div>
            )}

            <button className="costs-refresh" onClick={load}>↻ Actualiser</button>
          </>
        ) : null}
      </div>
    </div>
  )
}
