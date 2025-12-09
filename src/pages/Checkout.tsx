import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ArrowLeft, Trash2, ChevronRight } from 'lucide-react'
import { NavigationBar } from '../components/NavigationBar'

export function Checkout() {
  const navigate = useNavigate()
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart()
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmation'>('cart')
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  })
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  })

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlaceOrder = () => {
    if (formData.firstName && formData.address && cardData.cardNumber) {
      setStep('confirmation')
      setTimeout(() => {
        clearCart()
        navigate('/')
      }, 3000)
    }
  }

  const subtotal = getTotal()
  const shipping = subtotal > 0 ? 5.99 : 0
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

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
          {['cart', 'shipping', 'payment', 'confirmation'].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                  ['cart', 'shipping', 'payment', 'confirmation'].indexOf(step) >= i
                    ? 'bg-gold text-midnight'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 transition ${
                    ['cart', 'shipping', 'payment', 'confirmation'].indexOf(step) > i
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
                    <div className="text-5xl">{item.cookie.image}</div>
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
                  onClick={() => setStep('shipping')}
                  className="mt-8 w-full bg-midnight text-gold py-3 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center justify-center gap-2"
                >
                  Continue to Shipping <ChevronRight size={20} />
                </button>
              </div>
            )}

            {step === 'shipping' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-midnight mb-6">Shipping Address</h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    name="zip"
                    placeholder="ZIP Code"
                    value={formData.zip}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
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
                    className="flex-1 bg-midnight text-gold py-3 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center justify-center gap-2"
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
                    name="cardNumber"
                    placeholder="Card Number"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                    maxLength="16"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={cardData.expiryDate}
                      onChange={handleCardChange}
                      maxLength="5"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                    />
                    <input
                      type="text"
                      name="cvv"
                      placeholder="CVV"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                      maxLength="3"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('shipping')}
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
                <div className="text-6xl mb-4">✓</div>
                <h2 className="text-3xl font-bold text-midnight mb-2">Order Confirmed!</h2>
                <p className="text-gray-600 mb-8">
                  Thank you for your order. Your cookies will arrive soon!
                </p>
                <div className="text-5xl">🍪</div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-8 h-fit sticky top-4">
            <h3 className="text-2xl font-bold text-midnight mb-6">Order Summary</h3>

            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              {items.map((item) => (
                <div key={item.cookie.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.cookie.name} x {item.quantity}
                  </span>
                  <span className="font-semibold">
                    ${(item.cookie.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-midnight">Total</span>
              <span className="text-2xl font-bold text-gold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

