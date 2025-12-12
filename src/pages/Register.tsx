import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Cookie, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, User, Phone } from 'lucide-react'

export function Register() {
  const navigate = useNavigate()
  const { register, error, clearError, loading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    try {
      await register(formData.email, formData.password, formData.name, formData.phone)
      navigate('/', { replace: true })
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

  const displayError = localError || error

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
            <h1 className="text-2xl font-bold text-cream">Create Account</h1>
            <p className="text-cream/60 mt-1">Join the midnight cookie club</p>
          </div>

          {/* Error message */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cream/80 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cream/80 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cream/80 mb-2">
                Phone <span className="text-cream/40">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={18} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition"
                  placeholder="(555) 123-4567"
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
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

            <div>
              <label className="block text-sm font-medium text-cream/80 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold text-midnight font-semibold rounded-xl hover:bg-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-cream/60 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-gold hover:text-gold/80 font-medium transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

