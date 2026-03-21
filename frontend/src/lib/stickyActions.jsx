import { createContext, useContext, useState } from 'react'

const StickyActionsContext = createContext(null)

export function StickyActionsProvider({ children }) {
  const [actions, setActions] = useState(null)
  return (
    <StickyActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </StickyActionsContext.Provider>
  )
}

export function useStickyActions() {
  return useContext(StickyActionsContext)
}
