import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight via-midnight to-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold opacity-5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold opacity-5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 text-center max-w-2xl">
        {/* Logo/Brand */}
        <div className="mb-8 inline-block">
          <div className="text-6xl md:text-8xl mb-4">🍪</div>
          <h1 className="text-5xl md:text-7xl font-bold text-gold font-serif tracking-tight">
            Midnight Dough
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-cream mb-4 font-light">
          Freshly Baked Cookies, Delivered to Your Door
        </p>

        {/* Description */}
        <p className="text-lg text-cream opacity-90 mb-12 leading-relaxed">
          Handcrafted with premium ingredients and baked fresh every day. 
          Indulge in our signature flavors and satisfy your midnight cravings.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-3 bg-gold text-midnight px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
        >
          Shop Now
          <ArrowRight size={24} />
        </button>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-cream">
          <div className="p-6">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Fresh Daily</h3>
            <p className="text-sm opacity-80">Baked fresh every morning</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="font-semibold text-lg mb-2">Gift Ready</h3>
            <p className="text-sm opacity-80">Perfect for any occasion</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-3">🚚</div>
            <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
            <p className="text-sm opacity-80">Quick and reliable shipping</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="text-gold opacity-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  )
}


