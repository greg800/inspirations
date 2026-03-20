import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import { GalleryFilterProvider } from './lib/galleryFilter.jsx'
import Navbar from './components/Navbar.jsx'
import MobileBottomBar from './components/MobileBottomBar.jsx'
import IOSInstallBanner from './components/IOSInstallBanner.jsx'
import PWAUpdatePrompt from './components/PWAUpdatePrompt.jsx'
import Gallery from './pages/Gallery.jsx'
import Detail from './pages/Detail.jsx'
import ContentForm from './pages/ContentForm.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Admin from './pages/Admin.jsx'
import Activity from './pages/Activity.jsx'

export default function App() {
  return (
    <AuthProvider>
      <GalleryFilterProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/content/:id" element={<Detail />} />
          <Route path="/create" element={<ContentForm />} />
          <Route path="/edit/:id" element={<ContentForm editing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/activity" element={<Activity />} />
        </Routes>
        <MobileBottomBar />
        <IOSInstallBanner />
        <PWAUpdatePrompt />
      </GalleryFilterProvider>
    </AuthProvider>
  )
}
