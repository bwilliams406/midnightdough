import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, ChevronDown, Package, Settings } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export function NavigationBar() {
  const navigate = useNavigate()
  const { items } = useCart()
  const { user, userProfile, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
    navigate('/')
  }

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
        <div className="flex items-center gap-6">
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

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:text-gold transition"
              >
                <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gold" />
                </div>
                <span className="font-medium hidden md:block">
                  {userProfile?.displayName?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown size={16} className={`transition ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 text-midnight z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium">{userProfile?.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{userProfile?.email}</p>
                    </div>
                    <button
                      onClick={() => { navigate('/account'); setShowUserMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700"
                    >
                      <Package size={16} />
                      My Orders
                    </button>
                    <button
                      onClick={() => { navigate('/account'); setShowUserMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 text-gray-700"
                    >
                      <Settings size={16} />
                      Account Settings
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 text-red-600"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 hover:text-gold transition font-semibold"
            >
              <User size={18} />
              <span>Sign In</span>
            </button>
          )}

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



