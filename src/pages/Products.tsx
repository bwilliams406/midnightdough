import { useState } from 'react'
import { cookies } from '../data/cookies'
import { useCart } from '../context/CartContext'
import { ShoppingCart, ChevronDown, Tag, Check, Minus, Plus } from 'lucide-react'
import { NavigationBar } from '../components/NavigationBar'
import { BATCH_LABELS, calculatePrice, getDiscountForQuantity } from '../utils/pricing'

// Quick batch options to show as buttons
const QUICK_BATCHES = [6, 12, 24, 48]

export function Products() {
  const { addToCart, getTotalCookies, getCartDiscount } = useCart()
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [addedMessage, setAddedMessage] = useState<{ [key: number]: boolean }>({})
  const [expandedNutrition, setExpandedNutrition] = useState<{ [key: number]: boolean }>({})

  const getQuantity = (cookieId: number) => quantities[cookieId] || 1

  const setQuantity = (cookieId: number, qty: number) => {
    const newQty = Math.max(1, qty)
    setQuantities((prev) => ({ ...prev, [cookieId]: newQty }))
  }

  const handleAddToCart = (cookieId: number) => {
    const cookie = cookies.find((c) => c.id === cookieId)
    if (cookie) {
      const quantity = getQuantity(cookieId)
      addToCart(cookie, quantity)
      setAddedMessage((prev) => ({ ...prev, [cookieId]: true }))
      setQuantities((prev) => ({ ...prev, [cookieId]: 1 }))
      
      setTimeout(() => {
        setAddedMessage((prev) => ({ ...prev, [cookieId]: false }))
      }, 2000)
    }
  }

  const cartTotal = getTotalCookies()
  const cartDiscount = getCartDiscount()

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-midnight font-serif mb-3">
            The Cookie Collection
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            Handcrafted with premium ingredients, baked fresh for you
          </p>
          
          {/* Discount Banner */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-midnight to-gray-800 text-cream px-6 py-3 rounded-full shadow-lg">
            <Tag size={18} className="text-gold" />
            <span className="text-sm">
              <span className="text-gold font-semibold">Save up to 25%</span> — Mix & match any flavors!
            </span>
          </div>
          
          {/* Discount Tiers */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            {[
              { qty: 6, off: '5%' },
              { qty: 12, off: '10%' },
              { qty: 24, off: '15%' },
              { qty: 36, off: '20%' },
              { qty: 48, off: '25%' },
            ].map((tier) => (
              <span 
                key={tier.qty}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  cartTotal >= tier.qty 
                    ? 'bg-green-100 text-green-700 font-semibold' 
                    : 'bg-midnight/5 text-midnight'
                }`}
              >
                {tier.qty}+ = {tier.off}
              </span>
            ))}
          </div>

          {/* Cart discount indicator */}
          {cartTotal > 0 && (
            <div className="mt-4">
              {cartDiscount.discount > 0 ? (
                <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                  <Check size={16} />
                  {cartTotal} cookies in cart — {cartDiscount.label} applied!
                </span>
              ) : (
                <span className="text-gray-500 text-sm">
                  {cartTotal} cookie{cartTotal !== 1 ? 's' : ''} in cart — add {6 - cartTotal} more for 5% off!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cookies.map((cookie) => {
            const qty = getQuantity(cookie.id)
            const pricing = calculatePrice(cookie.price, qty)
            const discount = getDiscountForQuantity(qty)

            return (
              <div
                key={cookie.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-visible flex flex-col"
              >
                {/* Cookie Image */}
                <div className="relative h-48 overflow-hidden rounded-t-2xl bg-gray-100">
                  <img
                    src={cookie.imageUrl}
                    alt={cookie.name}
                    className="w-full h-full object-cover"
                  />
                  {cookie.flavor.includes('Specialty') && (
                    <span className="absolute top-3 left-3 bg-midnight text-gold text-xs font-bold px-3 py-1 rounded-full">
                      SPECIALTY
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Name & Flavor */}
                  <h2 className="text-lg font-bold text-midnight">{cookie.name}</h2>
                  <p className="text-sm text-gold font-medium mb-2">{cookie.flavor.replace(' · Specialty', '')}</p>
                  
                  {/* Description */}
                  <p className="text-gray-500 text-sm mb-4 flex-grow line-clamp-2">
                    {cookie.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-midnight">${cookie.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-400">each</span>
                  </div>

                  {/* Quick Batch Buttons */}
                  <div className="grid grid-cols-4 gap-1 mb-3">
                    {QUICK_BATCHES.map((batch) => {
                      const batchDiscount = getDiscountForQuantity(batch)
                      return (
                        <button
                          key={batch}
                          onClick={() => setQuantity(cookie.id, batch)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all ${
                            qty === batch
                              ? 'bg-midnight text-gold'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <div>{batch}</div>
                          {batchDiscount.discount > 0 && (
                            <div className={`text-[10px] ${qty === batch ? 'text-gold/80' : 'text-green-600'}`}>
                              {batchDiscount.label}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom Quantity */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setQuantity(cookie.id, qty - 1)}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(cookie.id, parseInt(e.target.value) || 1)}
                      className="flex-1 h-10 text-center font-bold text-lg border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                    />
                    <button
                      onClick={() => setQuantity(cookie.id, qty + 1)}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Total & Savings */}
                  <div className="flex items-center justify-between mb-4 py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-500 block">{BATCH_LABELS[qty] || `${qty} cookies`}</span>
                      {discount.discount > 0 && (
                        <span className="text-xs text-green-600 font-medium">{discount.label}</span>
                      )}
                    </div>
                    <div className="text-right">
                      {pricing.savings > 0 && (
                        <span className="text-xs text-gray-400 line-through block">
                          ${pricing.originalTotal.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xl font-bold text-midnight">${pricing.discountedTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(cookie.id)}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      addedMessage[cookie.id]
                        ? 'bg-green-500 text-white'
                        : 'bg-midnight text-gold hover:bg-midnight/90'
                    }`}
                  >
                    {addedMessage[cookie.id] ? (
                      <>
                        <Check size={18} />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Add to Cart
                      </>
                    )}
                  </button>

                  {/* Nutrition Toggle */}
                  <button
                    onClick={() => setExpandedNutrition((prev) => ({ ...prev, [cookie.id]: !prev[cookie.id] }))}
                    className="w-full py-2 mt-2 text-xs text-gray-400 hover:text-midnight transition flex items-center justify-center gap-1"
                  >
                    <span>Nutrition</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${
                        expandedNutrition[cookie.id] ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Nutritional Info */}
                  {expandedNutrition[cookie.id] && (
                    <div className="mt-2 pt-3 border-t border-gray-100 text-xs">
                      <div className="grid grid-cols-3 gap-2 text-gray-500">
                        <div>Cal: <span className="text-midnight font-medium">{cookie.nutritionalFacts.calories}</span></div>
                        <div>Fat: <span className="text-midnight font-medium">{cookie.nutritionalFacts.fat}g</span></div>
                        <div>Carbs: <span className="text-midnight font-medium">{cookie.nutritionalFacts.carbohydrates}g</span></div>
                        <div>Sugar: <span className="text-midnight font-medium">{cookie.nutritionalFacts.sugars}g</span></div>
                        <div>Protein: <span className="text-midnight font-medium">{cookie.nutritionalFacts.protein}g</span></div>
                        <div>Sodium: <span className="text-midnight font-medium">{cookie.nutritionalFacts.sodium}mg</span></div>
                      </div>
                      <p className="mt-2 text-[10px] text-red-400">{cookie.nutritionalFacts.allergens}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 px-8 py-6 rounded-2xl">
            <p className="text-midnight font-serif text-2xl mb-2">Need a custom order?</p>
            <p className="text-gray-600 text-sm mb-4">Planning an event? We offer custom batches!</p>
            <a 
              href="mailto:hello@midnightdough.com" 
              className="inline-flex items-center gap-2 text-midnight font-semibold hover:text-gold transition-colors"
            >
              Contact us →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

