import { createContext, useContext, useState } from 'react'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  function login(token, userData) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  function updateUser(data) {
    const updated = { ...user, ...data }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>
}
