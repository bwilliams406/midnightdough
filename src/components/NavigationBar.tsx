import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext'

export function NavigationBar() {
  const navigate = useNavigate()
  const { items } = useCart()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="bg-midnight text-cream sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-bold text-2xl text-gold hover:text-yellow-300 transition"
        >
          <span className="text-3xl">🍪</span>
          <span className="font-serif">Midnight Dough</span>
        </button>

        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate('/')}
            className="hover:text-gold transition font-semibold"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/products')}
            className="hover:text-gold transition font-semibold"
          >
            Products
          </button>

          {/* Cart Button */}
          <button
            onClick={() => navigate('/checkout')}
            className="relative flex items-center gap-2 bg-gold text-midnight px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition"
          >
            <ShoppingCart size={20} />
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}

