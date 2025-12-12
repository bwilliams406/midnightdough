import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, userProfile, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <div className="text-center">
          <Loader2 className="animate-spin text-gold mx-auto mb-4" size={48} />
          <p className="text-cream/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to appropriate login page
    const loginPath = requireAdmin ? '/admin/login' : '/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    // User is logged in but not an admin
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-cream mb-2">Access Denied</h1>
          <p className="text-cream/60 mb-6">
            You don't have permission to access the admin area.
          </p>
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-gold text-midnight rounded-xl font-semibold hover:bg-gold/90 transition"
          >
            Go to Store
          </a>
        </div>
      </div>
    )
  }

  // If requireAdmin and user is admin, or just needs to be logged in
  if (requireAdmin && userProfile && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

