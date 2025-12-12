import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  Clock, 
  ChevronRight,
  LogOut,
  Loader2,
  Cookie,
  Sparkles,
  CheckCircle,
  Truck,
  ChefHat,
  XCircle
} from 'lucide-react'
import { NavigationBar } from '../components/NavigationBar'
import { collection, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface Order {
  id: string
  orderNumber: string
  status: string
  createdAt: string
  total: number
  items: { productName: string; quantity: number }[]
  delivery: { address: string; city: string; state: string; zip: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Clock },
  processed: { label: 'Confirmed', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Package },
  in_progress: { label: 'Baking', color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: ChefHat },
  done: { label: 'Delivered', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
}

export function Account() {
  const navigate = useNavigate()
  const { user, userProfile, logout, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'settings'>('orders')

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: { pathname: '/account' } } })
    }
  }, [user, loading, navigate])

  // Link orphaned orders to user account and fetch orders
  useEffect(() => {
    if (!user || !userProfile) return

    const linkAndFetchOrders = async () => {
      const ordersRef = collection(db, 'orders')
      const userEmail = userProfile.email.toLowerCase()
      
      // First, find and link any orders that match this email but don't have userId
      const snapshot = await getDocs(ordersRef)
      const linkPromises: Promise<void>[] = []
      
      snapshot.docs.forEach(docSnap => {
        const order = docSnap.data()
        const orderEmail = order.customer?.email?.toLowerCase() || order.userEmail?.toLowerCase()
        
        // If order matches email but doesn't have userId (or has a guest userId), link it
        if (orderEmail === userEmail && (!order.userId || order.userId.startsWith('guest-'))) {
          console.log(`Linking order ${docSnap.id} to user ${user.uid}`)
          linkPromises.push(
            updateDoc(doc(db, 'orders', docSnap.id), {
              userId: user.uid,
              userEmail: userEmail
            })
          )
        }
      })
      
      // Wait for all links to complete
      if (linkPromises.length > 0) {
        await Promise.all(linkPromises)
        console.log(`Linked ${linkPromises.length} orders to account`)
      }
    }
    
    // Link orders first
    linkAndFetchOrders()

    // Then subscribe to real-time updates
    const ordersRef = collection(db, 'orders')
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const allOrders = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as (Order & { userId?: string; userEmail?: string; customer?: { email?: string } })[]
      
      // Filter orders that belong to this user (by userId or email)
      const userEmail = userProfile.email.toLowerCase()
      const userOrders = allOrders.filter(order => {
        if (order.userId === user.uid) return true
        if (order.userEmail?.toLowerCase() === userEmail) return true
        if (order.customer?.email?.toLowerCase() === userEmail) return true
        return false
      })
      
      // Sort by date descending
      userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setOrders(userOrders)
      setOrdersLoading(false)
    }, (error) => {
      console.error('Error fetching orders:', error)
      setOrdersLoading(false)
    })

    return () => unsubscribe()
  }, [user, userProfile])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-midnight via-gray-900 to-midnight flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight via-gray-900 to-midnight">
      <NavigationBar />
      
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center">
              <User className="text-gold" size={36} />
            </div>
            <div>
              <h1 className="text-3xl font-serif text-cream">{userProfile.displayName}</h1>
              <p className="text-cream/50 mt-1">{userProfile.email}</p>
              {userProfile.isGuest && !userProfile.isVerified && (
                <span className="inline-block mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  Unverified Account
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
              { id: 'settings', label: 'Settings', icon: User },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-gold text-gold'
                    : 'border-transparent text-cream/50 hover:text-cream'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-cream">Order History</h2>
              <span className="text-cream/50 text-sm">{orders.length} orders</span>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-gold" size={32} />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <Cookie className="mx-auto mb-4 text-cream/20" size={64} />
                <h3 className="text-xl font-medium text-cream mb-2">No orders yet</h3>
                <p className="text-cream/50 mb-8">Your delicious cookie orders will appear here</p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-midnight font-semibold rounded-full hover:bg-gold/90 transition"
                >
                  <Sparkles size={18} />
                  Browse Cookies
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                  const StatusIcon = status.icon
                  
                  return (
                    <div
                      key={order.id}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-gold/30 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-gold text-lg">{order.orderNumber}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color} flex items-center gap-1`}>
                              <StatusIcon size={12} />
                              {status.label}
                            </span>
                          </div>
                          <p className="text-cream/50 text-sm">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-medium text-cream">${order.total.toFixed(2)}</p>
                          <p className="text-cream/50 text-sm">{order.items.reduce((sum, i) => sum + i.quantity, 0)} cookies</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 bg-white/5 rounded-lg text-cream/70 text-sm">
                            {item.quantity}× {item.productName}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-cream/50 text-sm">
                          <Truck size={14} />
                          {order.delivery.address}, {order.delivery.city}
                        </div>
                        <button className="flex items-center gap-1 text-gold text-sm opacity-0 group-hover:opacity-100 transition">
                          View Details
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-cream">Saved Addresses</h2>
            </div>

            {!userProfile.addresses?.length ? (
              <div className="text-center py-16">
                <MapPin className="mx-auto mb-4 text-cream/20" size={64} />
                <h3 className="text-xl font-medium text-cream mb-2">No saved addresses</h3>
                <p className="text-cream/50">Addresses from your orders will be saved here</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {userProfile.addresses.map((address, idx) => (
                  <div
                    key={address.id || idx}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
                  >
                    {address.isDefault && (
                      <span className="inline-block px-2 py-0.5 bg-gold/20 text-gold text-xs rounded-full mb-3">
                        Default
                      </span>
                    )}
                    <p className="text-cream font-medium">{address.address}</p>
                    <p className="text-cream/60">{address.city}, {address.state} {address.zip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <h2 className="text-xl font-medium text-cream">Account Settings</h2>

            {/* Profile Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 space-y-6">
              <h3 className="text-lg font-medium text-cream">Profile Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-cream/50 text-sm mb-2">Full Name</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                    <User size={18} className="text-cream/40" />
                    <span className="text-cream">{userProfile.displayName}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-cream/50 text-sm mb-2">Email</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                    <Mail size={18} className="text-cream/40" />
                    <span className="text-cream">{userProfile.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-cream/50 text-sm mb-2">Phone</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                    <Phone size={18} className="text-cream/40" />
                    <span className="text-cream">{userProfile.phone || 'Not provided'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-cream/50 text-sm mb-2">Member Since</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                    <Clock size={18} className="text-cream/40" />
                    <span className="text-cream">
                      {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl p-6 border border-gold/20">
                <Package className="text-gold mb-3" size={24} />
                <p className="text-3xl font-bold text-cream">{orders.length}</p>
                <p className="text-cream/60 text-sm">Total Orders</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl p-6 border border-purple-500/20">
                <Cookie className="text-purple-400 mb-3" size={24} />
                <p className="text-3xl font-bold text-cream">
                  {orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
                </p>
                <p className="text-cream/60 text-sm">Cookies Ordered</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-2xl p-6 border border-green-500/20">
                <Sparkles className="text-green-400 mb-3" size={24} />
                <p className="text-3xl font-bold text-cream">
                  ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
                </p>
                <p className="text-cream/60 text-sm">Total Spent</p>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-8 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

