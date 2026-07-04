import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import Navbar from './components/common/Navbar'
import { PageLoader } from './components/common/UI'

// Pages
import Home from './pages/Home'
import { Login, Register } from './pages/Auth'
import ArticleDetail from './pages/ArticleDetail'
import WriteArticle from './pages/WriteArticle'
import Dashboard from './pages/Dashboard'
import JournalistProfile from './pages/JournalistProfile'
import AdminPanel from './pages/AdminPanel'
import FactCheck from './pages/FactCheck'
import ApplyJournalist from './pages/ApplyJournalist'
import { Notifications, Leaderboard, Search, Profile } from './pages/Misc'

// ─── Route Guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/" replace />
  return children
}

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

const JournalistRoute = ({ children }) => {
  const { user, loading, isJournalist } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!isJournalist) return <Navigate to="/profile" replace />
  return children
}

const FactCheckerRoute = ({ children }) => {
  const { user, loading, isFactChecker, isAdmin } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!isFactChecker && !isAdmin) return <Navigate to="/" replace />
  return children
}

// ─── App ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/journalist/:id" element={<JournalistProfile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/search" element={<Search />} />

          {/* Guest only */}
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Authenticated */}
          <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/apply-journalist" element={<ProtectedRoute><ApplyJournalist /></ProtectedRoute>} />

          {/* Journalist */}
          <Route path="/write"     element={<JournalistRoute><WriteArticle /></JournalistRoute>} />
          <Route path="/dashboard" element={<JournalistRoute><Dashboard /></JournalistRoute>} />

          {/* Fact Checker (+ Admin) */}
          <Route path="/factcheck" element={<FactCheckerRoute><FactCheck /></FactCheckerRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center text-center px-4">
              <div>
                <p className="font-mono text-8xl font-bold text-navy-100 mb-4">404</p>
                <h1 className="font-serif text-2xl font-bold text-navy-900 mb-2">Page not found</h1>
                <p className="text-navy-500 text-sm mb-6">The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary">Return to Feed</a>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0a0f2e',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#1a9de8', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  )
}
