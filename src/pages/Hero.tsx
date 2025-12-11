import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

// Canvas animation for the cosmic background
function CosmicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Stars
    const stars: { x: number; y: number; size: number; opacity: number; twinkleSpeed: number }[] = []
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      })
    }

    // Orbiting planets (cookies!)
    const planets = [
      { distance: 180, size: 8, speed: 0.0008, angle: 0, color: '#d4af37' },      // Gold cookie
      { distance: 280, size: 12, speed: 0.0005, angle: Math.PI / 3, color: '#8B4513' },  // Chocolate
      { distance: 380, size: 6, speed: 0.0012, angle: Math.PI, color: '#DEB887' },  // Snickerdoodle
      { distance: 460, size: 10, speed: 0.0003, angle: Math.PI * 1.5, color: '#FFE4B5' }, // Lemon
    ]

    // Shooting stars
    const shootingStars: { x: number; y: number; length: number; speed: number; opacity: number; active: boolean }[] = []

    const createShootingStar = () => {
      if (Math.random() > 0.995) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.5,
          length: Math.random() * 80 + 40,
          speed: Math.random() * 8 + 6,
          opacity: 1,
          active: true,
        })
      }
    }

    let animationId: number
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 1

      // Draw stars with twinkling
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`
        ctx.fill()
      })

      // Draw orbital paths (subtle)
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2 + 50

      planets.forEach((planet) => {
        ctx.beginPath()
        ctx.arc(centerX, centerY, planet.distance, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Draw planets
      planets.forEach((planet) => {
        planet.angle += planet.speed
        const x = centerX + Math.cos(planet.angle) * planet.distance
        const y = centerY + Math.sin(planet.angle) * planet.distance * 0.4 // Elliptical orbit

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, planet.size * 3)
        gradient.addColorStop(0, planet.color + '40')
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(x, y, planet.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Planet
        ctx.beginPath()
        ctx.arc(x, y, planet.size, 0, Math.PI * 2)
        ctx.fillStyle = planet.color
        ctx.fill()
      })

      // Shooting stars
      createShootingStar()
      shootingStars.forEach((star) => {
        if (!star.active) return

        star.x += star.speed
        star.y += star.speed * 0.5
        star.opacity -= 0.015

        if (star.opacity <= 0) {
          star.active = false
          return
        }

        const gradient = ctx.createLinearGradient(
          star.x, star.y,
          star.x - star.length, star.y - star.length * 0.5
        )
        gradient.addColorStop(0, `rgba(212, 175, 55, ${star.opacity})`)
        gradient.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.moveTo(star.x, star.y)
        ctx.lineTo(star.x - star.length, star.y - star.length * 0.5)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // Clean up inactive shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        if (!shootingStars[i].active) shootingStars.splice(i, 1)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'linear-gradient(180deg, #0d0a14 0%, #1a1625 50%, #0d0a14 100%)' }}
    />
  )
}

export function Hero() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Canvas Background */}
      <CosmicCanvas />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <img 
              src="/img/bestlogo.jpg" 
              alt="Midnight Dough" 
              className="h-12 w-12 rounded-full object-cover border-2 border-gold/30"
            />
            <span className="text-gold font-serif text-xl tracking-wide hidden sm:block">Midnight Dough</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/products')}
              className="text-cream/80 hover:text-gold transition-colors text-sm tracking-wider uppercase"
            >
              Menu
            </button>
            <button 
              onClick={() => navigate('/checkout')}
              className="text-cream/80 hover:text-gold transition-colors text-sm tracking-wider uppercase"
            >
              Cart
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-3xl mx-auto">
            {/* Logo */}
            <div className="mb-10 animate-fade-in">
              <img 
                src="/img/bestlogo.jpg" 
                alt="Midnight Dough" 
                className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover mx-auto shadow-2xl border-4 border-gold/20"
                style={{ 
                  boxShadow: '0 0 60px rgba(212, 175, 55, 0.3), 0 0 120px rgba(212, 175, 55, 0.1)' 
                }}
              />
            </div>

            {/* Title */}
            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold mb-6 tracking-tight"
              style={{ 
                textShadow: '0 0 80px rgba(212, 175, 55, 0.5)',
                animationDelay: '0.2s'
              }}
            >
              Midnight Dough
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-cream/90 font-light mb-4 tracking-wide">
              Cosmic Cookies, Crafted with Care
            </p>

            {/* Description */}
            <p className="text-cream/60 mb-12 max-w-xl mx-auto leading-relaxed">
              Handcrafted premium cookies baked fresh and delivered straight to your door. 
              Each bite is a journey through flavor.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/products')}
                className="group flex items-center gap-3 bg-gold text-midnight px-10 py-4 rounded-full font-semibold text-lg hover:bg-yellow-300 transition-all duration-500 shadow-lg hover:shadow-gold/30 hover:shadow-2xl transform hover:scale-105"
              >
                <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                Order Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/products')}
                className="flex items-center gap-2 text-cream/80 hover:text-gold px-8 py-4 transition-colors duration-300 border border-cream/20 hover:border-gold/50 rounded-full"
              >
                View Menu
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 pb-16">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-gold/30 transition-colors duration-500">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <span className="text-2xl">🌙</span>
              </div>
              <h3 className="text-gold font-semibold text-lg mb-2">Baked Fresh</h3>
              <p className="text-cream/60 text-sm">Every batch made with love, right before delivery</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-gold/30 transition-colors duration-500">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-gold font-semibold text-lg mb-2">Premium Quality</h3>
              <p className="text-cream/60 text-sm">Only the finest ingredients make it into our kitchen</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-gold/30 transition-colors duration-500">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-gold font-semibold text-lg mb-2">Fast Delivery</h3>
              <p className="text-cream/60 text-sm">DFW metroplex delivery, fresh to your door</p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/30">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-cream/30 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
