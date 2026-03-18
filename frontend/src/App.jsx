import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import Navbar from './components/Navbar.jsx'
import Gallery from './pages/Gallery.jsx'
import Detail from './pages/Detail.jsx'
import ContentForm from './pages/ContentForm.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/content/:id" element={<Detail />} />
        <Route path="/create" element={<ContentForm />} />
        <Route path="/edit/:id" element={<ContentForm editing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </AuthProvider>
  )
}
