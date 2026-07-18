import './StepArrows.css'

/**
 * Fil d'Ariane en flèches imbriquées : la pointe de chaque flèche s'encastre
 * dans l'encoche de la suivante. Chaque flèche se remplit de vert depuis la
 * gauche, à proportion de son avancement.
 *
 * Sert deux fois : en haut pour les 7 grands blocs de la méthode, en bas pour
 * les étapes du bloc courant.
 *
 * items : [{ key, label, title, progress (0→1), active, disabled, onClick }]
 */
export default function StepArrows({ items, className = '', ariaLabel }) {
  return (
    <nav className={`arrow-trail ${className}`.trim()} aria-label={ariaLabel}>
      {items.map((item, i) => (
        <button
          key={item.key}
          type="button"
          className={[
            'arrow-seg',
            i === 0 ? 'first' : '',
            item.active ? 'active' : '',
            item.disabled ? 'disabled' : '',
          ].filter(Boolean).join(' ')}
          onClick={item.disabled ? undefined : item.onClick}
          disabled={item.disabled}
          title={item.title}
          aria-label={item.title}
          aria-current={item.active ? 'step' : undefined}
        >
          <span className="arrow-fill" style={{ width: `${Math.round(item.progress * 100)}%` }} />
          <span className="arrow-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
