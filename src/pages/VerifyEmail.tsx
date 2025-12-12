import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Cookie, Loader2, CheckCircle, XCircle } from 'lucide-react'

export function VerifyEmail() {
  const navigate = useNavigate()
  const { completeEmailLinkSignIn, error, userProfile } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const verify = async () => {
      const success = await completeEmailLinkSignIn()
      setStatus(success ? 'success' : 'error')
      
      if (success) {
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/')
        }, 3000)
      }
    }
    
    verify()
  }, [completeEmailLinkSignIn, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight via-gray-900 to-midnight flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gold/20 rounded-full mb-6">
                <Loader2 className="text-gold animate-spin" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-cream mb-2">Verifying Your Email</h1>
              <p className="text-cream/60">Just a moment while we set up your account...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
                <CheckCircle className="text-green-400" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-cream mb-2">Welcome to the Midnight Club!</h1>
              <p className="text-cream/60 mb-4">
                Your account is all set up, {userProfile?.displayName?.split(' ')[0]}!
              </p>
              <div className="bg-gold/20 rounded-xl p-4 mb-6">
                <Cookie className="text-gold mx-auto mb-2" size={32} />
                <p className="text-cream text-sm">
                  Your orders are now saved to your account. Track deliveries, 
                  reorder favorites, and earn rewards!
                </p>
              </div>
              <p className="text-cream/40 text-sm">Redirecting to store...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6">
                <XCircle className="text-red-400" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-cream mb-2">Verification Failed</h1>
              <p className="text-cream/60 mb-4">
                {error || 'The verification link may have expired or already been used.'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 bg-gold text-midnight font-semibold rounded-xl hover:bg-gold/90 transition"
                >
                  Create Account
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-white/10 text-cream font-semibold rounded-xl hover:bg-white/20 transition"
                >
                  Return to Store
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

