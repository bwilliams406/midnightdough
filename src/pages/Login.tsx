import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Cookie, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, error, clearError, loading: authLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch {
      // Error is handled in context
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight via-gray-900 to-midnight flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back to store */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-cream/60 hover:text-cream mb-6 transition"
        >
          <ArrowLeft size={18} />
          Back to store
        </Link>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-2xl mb-4">
              <Cookie className="text-gold" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-cream">Welcome Back</h1>
            <p className="text-cream/60 mt-1">Sign in to your account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-cream/80 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition"
                  placeholder="your@email.com"
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
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-gold focus:ring-gold/50" />
                <span className="text-cream/60">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-gold hover:text-gold/80 transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold text-midnight font-semibold rounded-xl hover:bg-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-cream/60 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold hover:text-gold/80 font-medium transition">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Admin link */}
        <p className="text-center mt-6 text-cream/40 text-sm">
          Staff member?{' '}
          <Link to="/admin/login" className="text-gold/70 hover:text-gold transition">
            Admin login
          </Link>
        </p>
      </div>
    </div>
  )
}

