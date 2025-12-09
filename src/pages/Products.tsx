import { useState } from 'react'
import { cookies } from '../data/cookies'
import { useCart } from '../context/CartContext'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { NavigationBar } from '../components/NavigationBar'

export function Products() {
  const { addToCart } = useCart()
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [addedMessage, setAddedMessage] = useState<{ [key: number]: boolean }>({})

  const getQuantity = (cookieId: number) => quantities[cookieId] || 1

  const handleQuantityChange = (cookieId: number, delta: number) => {
    const newQuantity = Math.max(1, getQuantity(cookieId) + delta)
    setQuantities((prev) => ({ ...prev, [cookieId]: newQuantity }))
  }

  const handleAddToCart = (cookieId: number) => {
    const cookie = cookies.find((c) => c.id === cookieId)
    if (cookie) {
      addToCart(cookie, getQuantity(cookieId))
      setAddedMessage((prev) => ({ ...prev, [cookieId]: true }))
      setQuantities((prev) => ({ ...prev, [cookieId]: 1 }))
      
      setTimeout(() => {
        setAddedMessage((prev) => ({ ...prev, [cookieId]: false }))
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar />
      
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-midnight font-serif mb-4">
            Our Cookie Collection
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hand-picked selections baked with love and premium ingredients
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cookies.map((cookie) => (
            <div
              key={cookie.id}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:scale-105"
            >
              {/* Image/Icon */}
              <div className="bg-gradient-to-br from-gold to-yellow-400 h-48 flex items-center justify-center relative overflow-hidden">
                <div className="text-8xl drop-shadow-lg">{cookie.image}</div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-midnight mb-2">{cookie.name}</h2>
                <p className="text-sm text-gray-500 mb-3 font-semibold">{cookie.flavor}</p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{cookie.description}</p>

                {/* Price */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-2xl font-bold text-gold">${cookie.price.toFixed(2)}</p>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => handleQuantityChange(cookie.id, -1)}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="flex-1 text-center font-semibold">
                    {getQuantity(cookie.id)}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(cookie.id, 1)}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(cookie.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    addedMessage[cookie.id]
                      ? 'bg-green-500 text-white'
                      : 'bg-midnight text-gold hover:bg-gray-900'
                  }`}
                >
                  <ShoppingCart size={20} />
                  {addedMessage[cookie.id] ? 'Added!' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

