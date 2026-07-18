import { createContext, useContext, useState } from 'react'

const StickyActionsContext = createContext(null)

/**
 * Contenu de la barre du bas, posé par la page affichée.
 *
 * - actions : boutons (CTA, retour…)
 * - trail   : fil d'Ariane en flèches, cf. <StepArrows />. Quand il est posé,
 *             la barre affiche le bouton retour à gauche et les flèches à droite.
 */
export function StickyActionsProvider({ children }) {
  const [actions, setActions] = useState(null)
  const [trail, setTrail] = useState(null)
  return (
    <StickyActionsContext.Provider value={{ actions, setActions, trail, setTrail }}>
      {children}
    </StickyActionsContext.Provider>
  )
}

export function useStickyActions() {
  return useContext(StickyActionsContext)
}
