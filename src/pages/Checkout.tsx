import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { 
  ArrowLeft, 
  ArrowRight,
  Minus,
  Plus,
  Trash2, 
  MapPin, 
  CreditCard,
  Mail, 
  Loader2, 
  CheckCircle, 
  Sparkles,
  Cookie,
  Clock,
  Shield
} from 'lucide-react'
import { createOrder, getNextOrderNumber } from '../lib/storage'
import { sendNewOrderEmails } from '../lib/emailService'
import { cookies } from '../data/cookies'

// ZIP code distance lookup for DFW area
const ZIP_DISTANCES: { [key: string]: number } = {
  '75094': 0, '75002': 2, '75013': 3, '75074': 4, '75075': 5, '75023': 6, '75024': 7,
  '75025': 8, '75026': 6, '75044': 3, '75040': 5, '75041': 6, '75042': 7, '75043': 8,
  '75048': 4, '75098': 2, '75069': 5, '75070': 6, '75071': 7, '75072': 8, '75080': 8,
  '75081': 9, '75082': 10, '75034': 10, '75035': 11, '75033': 12, '75078': 9, '75009': 12,
  '75007': 15, '75006': 16, '75010': 14, '75019': 18, '75287': 12, '75252': 11, '75243': 10,
  '75238': 9, '75228': 10, '75218': 11, '75214': 12, '75206': 14, '75204': 15, '75201': 16,
  '76051': 20, '76092': 22, '75056': 15, '75067': 17, '75057': 18,
}

function getDistanceFromZip(zip: string): number | null {
  return ZIP_DISTANCES[zip] ?? null
}

function calculateDeliveryFee(distance: number): number {
  return Math.ceil(distance / 5) * 4
}

export function Checkout() {
  const { items, removeFromCart, updateQuantity, getTotal, getTotalCookies, getCartDiscount, getSubtotalBeforeDiscount, getTotalSavings, clearCart } = useCart()
  const { user, userProfile, sendEmailLink, createOrUpdateGuestUser } = useAuth()
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
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
  const [selectedTipPercent, setSelectedTipPercent] = useState<number | null>(15)
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null)
  const [deliveryError, setDeliveryError] = useState<string>('')
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accountCreationState, setAccountCreationState] = useState<'idle' | 'sending' | 'sent'>('idle')

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (userProfile) {
      const nameParts = userProfile.displayName?.split(' ') || ['']
      setFormData(prev => ({
        ...prev,
        email: userProfile.email || prev.email,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.slice(1).join(' ') || prev.lastName,
        phone: userProfile.phone || prev.phone,
        ...(userProfile.addresses?.[0] ? {
          address: userProfile.addresses[0].address,
          city: userProfile.addresses[0].city,
          state: userProfile.addresses[0].state,
          zip: userProfile.addresses[0].zip,
        } : {})
      }))
    }
  }, [userProfile])

  // Calculate delivery fee when ZIP changes
  useEffect(() => {
    if (formData.zip.length === 5) {
      const distance = getDistanceFromZip(formData.zip)
      if (distance !== null) {
        setDeliveryDistance(distance)
        setDeliveryError('')
      } else {
        setDeliveryDistance(null)
        setDeliveryError('Outside delivery area')
      }
    } else {
      setDeliveryDistance(null)
      setDeliveryError('')
    }
  }, [formData.zip])

  // Calculate tip when subtotal changes
  useEffect(() => {
    if (selectedTipPercent !== null) {
      setTip(subtotal * (selectedTipPercent / 100))
    }
  }, [getTotal()])

  const subtotal = getTotal()
  const deliveryFee = deliveryDistance !== null ? calculateDeliveryFee(deliveryDistance) : 0
  const tax = subtotal * 0.0825
  const total = subtotal + deliveryFee + tip + tax

  const handlePlaceOrder = async () => {
    setIsSubmitting(true)
    try {
      const newOrderNumber = await getNextOrderNumber()
      
      const orderItems = items.map(item => {
        const cookieData = cookies.find(c => c.id === item.cookie.id)
        return {
          productId: item.cookie.id,
          productName: item.cookie.name,
          quantity: item.quantity,
          priceEach: item.cookie.price,
          recipeId: cookieData?.recipeId
        }
      })
      
      await createOrder({
        orderNumber: newOrderNumber,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
        },
        delivery: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          instructions: formData.deliveryInstructions,
          fee: deliveryFee,
        },
        items: orderItems,
        subtotal: getSubtotalBeforeDiscount(),
        discount: getTotalSavings(),
        tax,
        tip,
        total,
        ...(user && { userId: user.uid }),
      })
      
      if (!user) {
        await createOrUpdateGuestUser({
          orderNumber: newOrderNumber,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone || undefined,
          address: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          }
        })
      }
      
      // Send order confirmation emails to customer and admin
      sendNewOrderEmails({
        orderNumber: newOrderNumber,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        customerEmail: formData.email,
        items: orderItems.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          priceEach: item.priceEach
        })),
        subtotal: getSubtotalBeforeDiscount(),
        discount: getTotalSavings(),
        deliveryFee,
        tax,
        tip,
        total,
        deliveryAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      }).catch(err => console.error('Error sending order emails:', err))
      
      setOrderNumber(newOrderNumber)
      clearCart()
      setStep(4)
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Error placing order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToStep2 = items.length > 0
  const canProceedToStep3 = formData.email && formData.firstName && formData.address && formData.city && formData.zip && !deliveryError
  const canPlaceOrder = cardData.cardNumber && cardData.expiryDate && cardData.cvv

  // Empty cart state
  if (items.length === 0 && step !== 4) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-midnight via-gray-900 to-midnight">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="w-24 h-24 mx-auto mb-8 bg-gold/10 rounded-full flex items-center justify-center">
            <Cookie className="text-gold/50" size={48} />
          </div>
          <h1 className="text-4xl font-serif text-cream mb-4">Your Cart is Empty</h1>
          <p className="text-cream/60 text-lg mb-12">Discover our handcrafted midnight cookies</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-3 bg-gold text-midnight px-8 py-4 rounded-full font-semibold text-lg hover:bg-gold/90 transition-all hover:scale-105"
          >
            <Sparkles size={20} />
            Browse Cookies
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight via-gray-900 to-midnight">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <ArrowLeft className="text-cream/40 group-hover:text-gold transition" size={20} />
            <span className="text-cream/60 group-hover:text-cream transition">Back to Store</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍪</span>
            <span className="font-serif text-xl text-gold">Midnight Dough</span>
          </Link>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Progress indicator */}
      {step < 4 && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Cart' },
              { num: 2, label: 'Delivery' },
              { num: 3, label: 'Payment' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-500 ${
                    step >= s.num 
                      ? 'bg-gold text-midnight' 
                      : 'bg-white/5 text-cream/40'
                  }`}>
                    {step > s.num ? <CheckCircle size={20} /> : s.num}
                  </div>
                  <span className={`mt-2 text-sm transition-all ${
                    step >= s.num ? 'text-cream' : 'text-cream/40'
                  }`}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-px mx-4 transition-all duration-500 ${
                    step > s.num ? 'bg-gold' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        
        {/* STEP 1: Cart Review */}
        {step === 1 && (
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-6">
              <h1 className="text-3xl font-serif text-cream mb-8">Review Your Order</h1>
              
              {items.map((item, index) => (
                <div 
                  key={item.cookie.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex gap-6 group hover:border-gold/30 transition-all"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={item.cookie.imageUrl}
                    alt={item.cookie.name}
                    className="w-28 h-28 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-medium text-cream">{item.cookie.name}</h3>
                        <p className="text-cream/50 text-sm mt-1">{item.cookie.flavor}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cookie.id)}
                        className="p-2 text-cream/30 hover:text-red-400 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 bg-white/5 rounded-full p-1">
                        <button
                          onClick={() => updateQuantity(item.cookie.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-cream/60 hover:bg-white/10 transition"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center text-cream font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cookie.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-cream/60 hover:bg-white/10 transition"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <p className="text-xl font-medium text-gold">
                        ${(item.cookie.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 sticky top-8">
                <h2 className="text-xl font-medium text-cream mb-6">Order Summary</h2>
                
                <div className="space-y-4 text-cream/80">
                  <div className="flex justify-between">
                    <span>{getTotalCookies()} cookies</span>
                    <span>${getSubtotalBeforeDiscount().toFixed(2)}</span>
                  </div>
                  
                  {getTotalSavings() > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span className="flex items-center gap-2">
                        <Sparkles size={16} />
                        {getCartDiscount().label}
                      </span>
                      <span>-${getTotalSavings().toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 my-6" />
                
                <div className="flex justify-between text-lg">
                  <span className="text-cream">Subtotal</span>
                  <span className="text-gold font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {getTotalCookies() < 6 && (
                  <div className="mt-6 p-4 bg-gold/10 rounded-xl border border-gold/20">
                    <p className="text-gold text-sm">
                      Add {6 - getTotalCookies()} more cookie{6 - getTotalCookies() !== 1 ? 's' : ''} to save 5%
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="w-full mt-8 py-4 bg-gold text-midnight font-semibold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue to Delivery
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Delivery */}
        {step === 2 && (
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(1)} className="p-2 text-cream/40 hover:text-cream transition">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-serif text-cream">Delivery Details</h1>
              </div>

              {/* Contact */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 space-y-6">
                <h2 className="text-lg font-medium text-cream flex items-center gap-2">
                  <Mail size={18} className="text-gold" />
                  Contact Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="col-span-2 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                  />
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="col-span-2 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 space-y-6">
                <h2 className="text-lg font-medium text-cream flex items-center gap-2">
                  <MapPin size={18} className="text-gold" />
                  Delivery Address
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                    />
                    <input
                      type="text"
                      placeholder="ZIP"
                      maxLength={5}
                      value={formData.zip}
                      onChange={(e) => setFormData({...formData, zip: e.target.value.replace(/\D/g, '')})}
                      className={`px-5 py-4 bg-white/5 border rounded-xl text-cream placeholder-cream/30 focus:outline-none transition ${
                        deliveryError ? 'border-red-500/50' : 'border-white/10 focus:border-gold/50'
                      }`}
                    />
                  </div>
                  {deliveryError && (
                    <p className="text-red-400 text-sm">{deliveryError}</p>
                  )}
                  <textarea
                    placeholder="Delivery instructions (optional)"
                    rows={2}
                    value={formData.deliveryInstructions}
                    onChange={(e) => setFormData({...formData, deliveryInstructions: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 sticky top-8">
                <h2 className="text-xl font-medium text-cream mb-6">Order Summary</h2>
                
                <div className="space-y-3 text-sm">
                  {items.map(item => (
                    <div key={item.cookie.id} className="flex justify-between text-cream/70">
                      <span>{item.quantity}× {item.cookie.name}</span>
                      <span>${(item.cookie.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 my-6" />
                
                <div className="space-y-3 text-cream/80">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryDistance !== null && (
                    <div className="flex justify-between">
                      <span>Delivery ({deliveryDistance} mi)</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  className="w-full mt-8 py-4 bg-gold text-midnight font-semibold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue to Payment
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Payment */}
        {step === 3 && (
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(2)} className="p-2 text-cream/40 hover:text-cream transition">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-serif text-cream">Payment</h1>
              </div>

              {/* Card Details */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 space-y-6">
                <h2 className="text-lg font-medium text-cream flex items-center gap-2">
                  <CreditCard size={18} className="text-gold" />
                  Card Details
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Card number"
                    value={cardData.cardNumber}
                    onChange={(e) => setCardData({...cardData, cardNumber: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardData.expiryDate}
                      onChange={(e) => setCardData({...cardData, expiryDate: e.target.value})}
                      className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                      className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Name on card"
                    value={cardData.nameOnCard}
                    onChange={(e) => setCardData({...cardData, nameOnCard: e.target.value})}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 transition"
                  />
                </div>
                <div className="flex items-center gap-2 text-cream/40 text-sm">
                  <Shield size={14} />
                  Your payment is secure and encrypted
                </div>
              </div>

              {/* Tip */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 space-y-6">
                <h2 className="text-lg font-medium text-cream">Add a Tip</h2>
                <div className="flex gap-3">
                  {[10, 15, 20, 25].map(pct => (
                    <button
                      key={pct}
                      onClick={() => {
                        setSelectedTipPercent(pct)
                        setTip(subtotal * (pct / 100))
                      }}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        selectedTipPercent === pct
                          ? 'bg-gold text-midnight'
                          : 'bg-white/5 text-cream/60 hover:bg-white/10'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedTipPercent(null)
                      setTip(0)
                    }}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      selectedTipPercent === null
                        ? 'bg-gold text-midnight'
                        : 'bg-white/5 text-cream/60 hover:bg-white/10'
                    }`}
                  >
                    No tip
                  </button>
                </div>
              </div>
            </div>

            {/* Final Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 sticky top-8">
                <h2 className="text-xl font-medium text-cream mb-6">Order Summary</h2>
                
                <div className="space-y-3 text-cream/80">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${getSubtotalBeforeDiscount().toFixed(2)}</span>
                  </div>
                  {getTotalSavings() > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${getTotalSavings().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between">
                      <span>Tip</span>
                      <span>${tip.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 my-6" />
                
                <div className="flex justify-between text-xl">
                  <span className="text-cream">Total</span>
                  <span className="text-gold font-semibold">${total.toFixed(2)}</span>
                </div>

                {/* Delivery Info */}
                <div className="mt-6 p-4 bg-white/5 rounded-xl text-sm text-cream/60">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} />
                    <span>{formData.address}, {formData.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>Delivery in ~45 min</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={!canPlaceOrder || isSubmitting}
                  className="w-full mt-8 py-4 bg-gold text-midnight font-semibold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order · ${total.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-8 animate-bounce">
                <CheckCircle className="text-green-400" size={48} />
              </div>
              <h1 className="text-4xl font-serif text-cream mb-4">Order Confirmed!</h1>
              <div className="inline-block px-6 py-3 bg-gold/20 rounded-full mb-6">
                <span className="font-mono text-gold text-xl">{orderNumber}</span>
              </div>
              <p className="text-cream/60 text-lg">
                Thank you, {formData.firstName}! Your cookies are being prepared with care.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-8 text-left">
              <h3 className="text-lg font-medium text-cream mb-4">Delivery Details</h3>
              <div className="text-cream/70 space-y-2">
                <p>{formData.address}</p>
                <p>{formData.city}, {formData.state} {formData.zip}</p>
                <p className="flex items-center gap-2 text-gold mt-4">
                  <Clock size={16} />
                  Estimated arrival: ~45 minutes
                </p>
              </div>
            </div>

            {/* Account Creation */}
            {!user && (
              <div className="bg-gradient-to-r from-gold/10 to-purple-500/10 rounded-2xl p-8 border border-gold/20 mb-8">
                {accountCreationState === 'idle' && (
                  <>
                    <Sparkles className="mx-auto mb-4 text-gold" size={32} />
                    <h3 className="text-xl font-medium text-cream mb-2">Save Your Order</h3>
                    <p className="text-cream/60 mb-6">
                      Create an account to track orders, save addresses, and reorder your favorites instantly.
                    </p>
                    <button
                      onClick={async () => {
                        setAccountCreationState('sending')
                        try {
                          await sendEmailLink(formData.email, {
                            orderNumber,
                            name: `${formData.firstName} ${formData.lastName}`.trim(),
                            email: formData.email,
                            phone: formData.phone || undefined,
                            address: {
                              address: formData.address,
                              city: formData.city,
                              state: formData.state,
                              zip: formData.zip,
                            }
                          })
                          setAccountCreationState('sent')
                        } catch {
                          setAccountCreationState('idle')
                        }
                      }}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-midnight font-semibold rounded-full hover:bg-gold/90 transition"
                    >
                      <Mail size={18} />
                      Send Sign-In Link
                    </button>
                    <p className="text-cream/40 text-sm mt-3">
                      We'll send a magic link to {formData.email}
                    </p>
                  </>
                )}

                {accountCreationState === 'sending' && (
                  <div className="py-4">
                    <Loader2 className="mx-auto mb-4 text-gold animate-spin" size={32} />
                    <p className="text-cream/60">Sending verification email...</p>
                  </div>
                )}

                {accountCreationState === 'sent' && (
                  <>
                    <CheckCircle className="mx-auto mb-4 text-green-400" size={32} />
                    <h3 className="text-xl font-medium text-cream mb-2">Check Your Email!</h3>
                    <p className="text-cream/60">
                      We sent a sign-in link to <strong className="text-cream">{formData.email}</strong>
                    </p>
                  </>
                )}
              </div>
            )}

            {user && (
              <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/20 mb-8 flex items-center justify-center gap-3">
                <CheckCircle className="text-green-400" size={20} />
                <span className="text-green-400 font-medium">Order saved to your account</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-cream font-medium rounded-full hover:bg-white/10 transition"
              >
                <Cookie size={18} />
                Order More Cookies
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold/10 text-gold font-medium rounded-full hover:bg-gold/20 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
