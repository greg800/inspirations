import { createContext, useContext, useState, useEffect } from 'react'
import { api } from './api.js'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Charger le compteur quand l'utilisateur est connecté
  useEffect(() => {
    if (!user) { setUnreadNotifications(0); return }
    api.notifications.get()
      .then(data => setUnreadNotifications(data.unread))
      .catch(() => {})
  }, [user?.id])

  function login(token, userData) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setUnreadNotifications(0)
  }

  function updateUser(data) {
    const updated = { ...user, ...data }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, unreadNotifications, setUnreadNotifications }}>
      {children}
    </AuthContext.Provider>
  )
}
