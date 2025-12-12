import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Cookie, Mail, Lock, Eye, EyeOff, Loader2, Shield } from 'lucide-react'

export function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, error, clearError, isAdmin, loading: authLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin'

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate(from, { replace: true })
    }
  }, [user, isAdmin, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError('')
    setLoading(true)
    
    try {
      await login(email, password)
      // After login, check if user is admin
      // The redirect will happen via useEffect after state updates
    } catch {
      // Error is handled in context
    } finally {
      setLoading(false)
    }
  }

  // Show message if logged in but not admin
  useEffect(() => {
    if (user && !isAdmin && !authLoading) {
      setLocalError('This account does not have admin access')
    }
  }, [user, isAdmin, authLoading])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    )
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight via-gray-900 to-midnight flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-2xl mb-4">
              <Shield className="text-purple-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-cream">Admin Portal</h1>
            <p className="text-cream/60 mt-1 flex items-center justify-center gap-2">
              <Cookie className="text-gold" size={16} />
              Midnight Dough
            </p>
          </div>

          {/* Error message */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-cream/80 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition"
                  placeholder="admin@themidnightdough.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cream/80 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Access Admin Portal
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <a 
              href="/"
              className="text-cream/40 hover:text-cream text-sm transition"
            >
              ← Return to Store
            </a>
          </div>
        </div>

        <p className="text-center mt-6 text-cream/30 text-xs">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  )
}

