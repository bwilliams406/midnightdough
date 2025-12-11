import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ArrowLeft, Trash2, ChevronRight, MapPin, Truck } from 'lucide-react'
import { NavigationBar } from '../components/NavigationBar'

// Base ZIP code for Midnight Dough (75094 - Murphy, TX)

// Approximate distance lookup for DFW area ZIP codes (in miles from 75094)
// This is a simplified version - in production you'd use a real distance API
const ZIP_DISTANCES: { [key: string]: number } = {
  '75094': 0,    // Murphy
  '75002': 2,    // Allen
  '75013': 3,    // Allen
  '75074': 4,    // Plano
  '75075': 5,    // Plano
  '75023': 6,    // Plano
  '75024': 7,    // Plano
  '75025': 8,    // Plano
  '75026': 6,    // Plano
  '75044': 3,    // Garland
  '75040': 5,    // Garland
  '75041': 6,    // Garland
  '75042': 7,    // Garland
  '75043': 8,    // Garland
  '75048': 4,    // Sachse
  '75098': 2,    // Wylie
  '75069': 5,    // McKinney
  '75070': 6,    // McKinney
  '75071': 7,    // McKinney
  '75072': 8,    // McKinney
  '75080': 8,    // Richardson
  '75081': 9,    // Richardson
  '75082': 10,   // Richardson
  '75034': 10,   // Frisco
  '75035': 11,   // Frisco
  '75033': 12,   // Frisco
  '75078': 9,    // Prosper
  '75009': 12,   // Celina
  '75007': 15,   // Carrollton
  '75006': 16,   // Carrollton
  '75010': 14,   // Carrollton
  '75019': 18,   // Coppell
  '75287': 12,   // Dallas (North)
  '75252': 11,   // Dallas (North)
  '75243': 10,   // Dallas
  '75238': 9,    // Dallas
  '75228': 10,   // Dallas
  '75218': 11,   // Dallas
  '75214': 12,   // Dallas
  '75206': 14,   // Dallas
  '75204': 15,   // Dallas
  '75201': 16,   // Dallas (Downtown)
  '76051': 20,   // Grapevine
  '76092': 22,   // Southlake
  '75056': 15,   // The Colony
  '75067': 17,   // Lewisville
  '75057': 18,   // Lewisville
}

function getDistanceFromZip(zip: string): number | null {
  if (ZIP_DISTANCES[zip] !== undefined) {
    return ZIP_DISTANCES[zip]
  }
  // For unknown ZIP codes, return null (we'll show "out of delivery area")
  return null
}

function calculateDeliveryFee(distance: number): number {
  // $4 per 5 miles
  const brackets = Math.ceil(distance / 5)
  return brackets * 4
}

export function Checkout() {
  const navigate = useNavigate()
  const { items, removeFromCart, updateQuantity, getTotal, getTotalCookies, getCartDiscount, getSubtotalBeforeDiscount, getTotalSavings, clearCart } = useCart()
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'confirmation'>('cart')
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: 'TX',
    zip: '',
    deliveryInstructions: '',
  })
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  })
  const [tip, setTip] = useState<number>(0)
  const [customTip, setCustomTip] = useState<string>('')
  const [selectedTipPercent, setSelectedTipPercent] = useState<number | 'custom' | null>(null)
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null)
  const [deliveryError, setDeliveryError] = useState<string>('')

  // Calculate delivery fee when ZIP changes
  useEffect(() => {
    if (formData.zip.length === 5) {
      const distance = getDistanceFromZip(formData.zip)
      if (distance !== null) {
        setDeliveryDistance(distance)
        setDeliveryError('')
      } else {
        setDeliveryDistance(null)
        setDeliveryError('Sorry, we don\'t deliver to this ZIP code yet. Contact us for special arrangements!')
      }
    } else {
      setDeliveryDistance(null)
      setDeliveryError('')
    }
  }, [formData.zip])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTipSelect = (percent: number | 'custom') => {
    setSelectedTipPercent(percent)
    if (percent === 'custom') {
      setTip(parseFloat(customTip) || 0)
    } else {
      setTip(subtotal * (percent / 100))
      setCustomTip('')
    }
  }

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value)
    setSelectedTipPercent('custom')
    setTip(parseFloat(value) || 0)
  }

  const handlePlaceOrder = () => {
    if (formData.firstName && formData.address && formData.zip && cardData.cardNumber) {
      setStep('confirmation')
      setTimeout(() => {
        clearCart()
        navigate('/')
      }, 4000)
    }
  }

  const subtotal = getTotal()
  const deliveryFee = deliveryDistance !== null ? calculateDeliveryFee(deliveryDistance) : 0
  const tax = subtotal * 0.0825 // Texas sales tax
  const total = subtotal + deliveryFee + tip + tax

  if (items.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-cream">
        <NavigationBar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-midnight mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some delicious cookies to get started!</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-2 bg-midnight text-gold px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            <ArrowLeft size={20} />
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavigationBar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="mb-12 flex justify-between items-center">
          {['cart', 'delivery', 'payment', 'confirmation'].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                  ['cart', 'delivery', 'payment', 'confirmation'].indexOf(step) >= i
                    ? 'bg-gold text-midnight'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 transition ${
                    ['cart', 'delivery', 'payment', 'confirmation'].indexOf(step) > i
                      ? 'bg-gold'
                      : 'bg-gray-300'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'cart' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-midnight mb-6">Your Order</h2>

                {items.map((item) => (
                  <div
                    key={item.cookie.id}
                    className="flex items-center gap-4 pb-6 border-b border-gray-200 mb-6"
                  >
                    <img
                      src={item.cookie.imageUrl}
                      alt={item.cookie.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-midnight">
                        {item.cookie.name}
                      </h3>
                      <p className="text-sm text-gray-600">{item.cookie.flavor}</p>
                      <p className="text-gold font-semibold mt-2">
                        ${(item.cookie.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.cookie.id, parseInt(e.target.value))
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <button
                        onClick={() => removeFromCart(item.cookie.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setStep('delivery')}
                  className="mt-8 w-full bg-midnight text-gold py-3 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center justify-center gap-2"
                >
                  Continue to Delivery <ChevronRight size={20} />
                </button>
              </div>
            )}

            {step === 'delivery' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="text-gold" size={28} />
                  <h2 className="text-3xl font-bold text-midnight">Delivery Details</h2>
                </div>

                <div className="bg-midnight/5 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gold mt-1" size={20} />
                    <div>
                      <p className="font-semibold text-midnight">Local Delivery Only</p>
                      <p className="text-sm text-gray-600">
                        We deliver within the DFW metroplex area from Murphy, TX (75094)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleFormChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleFormChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold bg-gray-50"
                      readOnly
                    />
                    <input
                      type="text"
                      name="zip"
                      placeholder="ZIP Code"
                      value={formData.zip}
                      onChange={handleFormChange}
                      maxLength={5}
                      className={`px-4 py-3 border rounded-lg focus:outline-none focus:border-gold ${
                        deliveryError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  
                  {/* Delivery fee indicator */}
                  {formData.zip.length === 5 && (
                    <div className="col-span-2">
                      {deliveryDistance !== null ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                          <Truck className="text-green-600" size={18} />
                          <span className="text-green-700">
                            <span className="font-semibold">${calculateDeliveryFee(deliveryDistance).toFixed(2)}</span> delivery fee 
                            ({deliveryDistance} miles from our kitchen)
                          </span>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                          {deliveryError}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <textarea
                    name="deliveryInstructions"
                    placeholder="Delivery Instructions (gate code, apartment #, etc.)"
                    value={formData.deliveryInstructions}
                    onChange={handleFormChange}
                    rows={2}
                    className="col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                {/* Tip Section */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-midnight mb-4">Add a Tip for Your Driver</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[15, 18, 20, 25].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => handleTipSelect(percent)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          selectedTipPercent === percent
                            ? 'bg-gold text-midnight'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {percent}%
                        <span className="block text-xs opacity-75">
                          ${(subtotal * (percent / 100)).toFixed(2)}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => handleTipSelect('custom')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedTipPercent === 'custom'
                          ? 'bg-gold text-midnight'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  {selectedTipPercent === 'custom' && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter amount"
                        value={customTip}
                        onChange={(e) => handleCustomTipChange(e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('cart')}
                    className="flex-1 border border-midnight text-midnight py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('payment')}
                    disabled={!deliveryDistance || !formData.address || !formData.zip}
                    className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      deliveryDistance && formData.address && formData.zip
                        ? 'bg-midnight text-gold hover:bg-gray-900'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Continue to Payment <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-midnight mb-6">Payment Details</h2>

                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    name="nameOnCard"
                    placeholder="Name on Card"
                    value={cardData.nameOnCard}
                    onChange={handleCardChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="Card Number"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    maxLength={16}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={cardData.expiryDate}
                      onChange={handleCardChange}
                      maxLength={5}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                    />
                    <input
                      type="text"
                      name="cvv"
                      placeholder="CVV"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                      maxLength={4}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('delivery')}
                    className="flex-1 border border-midnight text-midnight py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    className="flex-1 bg-gold text-midnight py-3 rounded-lg font-semibold hover:bg-yellow-300 transition flex items-center justify-center gap-2"
                  >
                    Place Order <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {step === 'confirmation' && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✓</span>
                </div>
                <h2 className="text-3xl font-bold text-midnight mb-2">Order Confirmed!</h2>
                <p className="text-gray-600 mb-4">
                  Thank you for your order, {formData.firstName}!
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Your fresh cookies are on their way to:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                  <p className="font-medium text-midnight">{formData.address}</p>
                  <p className="text-gray-600">{formData.city}, {formData.state} {formData.zip}</p>
                </div>
                <div className="text-6xl">🍪🚗</div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-8 h-fit sticky top-4">
            <h3 className="text-2xl font-bold text-midnight mb-4">Order Summary</h3>
            
            {/* Cookie count & discount tier */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Cookies</span>
                <span className="font-bold text-midnight">{getTotalCookies()}</span>
              </div>
              {getCartDiscount().discount > 0 && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 text-sm font-medium">
                      🎉 Mix & Match {getCartDiscount().label}
                    </span>
                    <span className="text-green-700 text-sm font-bold">
                      -{(getCartDiscount().discount * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
              {getTotalCookies() > 0 && getTotalCookies() < 6 && (
                <div className="mt-2 bg-gold/10 border border-gold/30 rounded-lg px-3 py-2">
                  <span className="text-midnight text-xs">
                    Add {6 - getTotalCookies()} more cookie{6 - getTotalCookies() !== 1 ? 's' : ''} to save 5%!
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              {items.map((item) => (
                <div key={item.cookie.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.cookie.name} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    ${(item.cookie.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>${getSubtotalBeforeDiscount().toFixed(2)}</span>
              </div>
              {getTotalSavings() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Batch Discount ({getCartDiscount().label})</span>
                  <span>-${getTotalSavings().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span>
                  {deliveryDistance !== null 
                    ? `$${deliveryFee.toFixed(2)}` 
                    : <span className="text-gray-400">Enter ZIP</span>
                  }
                </span>
              </div>
              {tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Driver Tip</span>
                  <span>${tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (8.25%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-midnight">Total</span>
              <span className="text-2xl font-bold text-gold">${total.toFixed(2)}</span>
            </div>

            {getTotalSavings() > 0 && (
              <div className="mt-3 text-center">
                <span className="text-green-600 text-sm font-medium">
                  You're saving ${getTotalSavings().toFixed(2)}!
                </span>
              </div>
            )}

            {deliveryDistance !== null && deliveryDistance <= 5 && (
              <div className="mt-4 bg-green-50 text-green-700 text-xs p-2 rounded text-center">
                🎉 You're in our closest delivery zone!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

