import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'
import { GalleryFilterProvider } from './lib/galleryFilter.jsx'
import { StickyActionsProvider } from './lib/stickyActions.jsx'
import Navbar from './components/Navbar.jsx'
import MobileBottomBar from './components/MobileBottomBar.jsx'
import IOSInstallBanner from './components/IOSInstallBanner.jsx'
import PWAUpdatePrompt from './components/PWAUpdatePrompt.jsx'
import Gallery from './pages/Gallery.jsx'
import Detail from './pages/Detail.jsx'
import ContentForm from './pages/ContentForm.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Admin from './pages/Admin.jsx'
import Activity from './pages/Activity.jsx'
import Profile from './pages/Profile.jsx'
import JoinBubble from './pages/JoinBubble.jsx'
import Storic from './pages/Storic.jsx'
import StepPage from './pages/StepPage.jsx'
import AiPrompt from './pages/AiPrompt.jsx'
import AiCosts from './pages/AiCosts.jsx'

export default function App() {
  return (
    <AuthProvider>
      <GalleryFilterProvider>
      <StickyActionsProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/content/:id" element={<Detail />} />
          <Route path="/create" element={<ContentForm />} />
          <Route path="/edit/:id" element={<ContentForm editing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/join-bubble" element={<JoinBubble />} />
          <Route path="/storic" element={<Storic />} />
          {/* /storic/prompt/:key : segment statique « prompt », prioritaire sur :storyId */}
          <Route path="/storic/prompt/:key" element={<AiPrompt />} />
          <Route path="/storic/:storyId" element={<StepPage firstStep />} />
          <Route path="/storic/:storyId/:stepKey" element={<StepPage />} />
          <Route path="/admin/ai-costs" element={<AiCosts />} />
        </Routes>
        <MobileBottomBar />
        <IOSInstallBanner />
        <PWAUpdatePrompt />
      </StickyActionsProvider>
      </GalleryFilterProvider>
    </AuthProvider>
  )
}
