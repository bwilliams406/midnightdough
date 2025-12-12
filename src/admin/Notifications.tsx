import { useState, useEffect } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Package, 
  Cookie,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Loader2,
  Mail,
  Settings
} from 'lucide-react'
import { Notification, Ingredient, Recipe, Product } from '../types/admin'
import { 
  subscribeToNotifications, 
  subscribeToIngredients,
  subscribeToRecipes,
  subscribeToProducts,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  checkInventoryAndNotify
} from '../lib/storage'

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'warning'>('all')
  const [emailSettings, setEmailSettings] = useState({
    enabled: false,
    email: '',
    lowStock: true,
    outOfStock: true,
    productUnavailable: true
  })
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    let loadedCount = 0
    const checkLoaded = () => {
      loadedCount++
      if (loadedCount >= 4) setLoading(false)
    }

    const unsubNotifications = subscribeToNotifications((data) => {
      setNotifications(data)
      checkLoaded()
    })
    const unsubIngredients = subscribeToIngredients((data) => {
      setIngredients(data)
      checkLoaded()
    })
    const unsubRecipes = subscribeToRecipes((data) => {
      setRecipes(data)
      checkLoaded()
    })
    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data)
      checkLoaded()
    })

    return () => {
      unsubNotifications()
      unsubIngredients()
      unsubRecipes()
      unsubProducts()
    }
  }, [])

  const runInventoryCheck = async () => {
    setChecking(true)
    try {
      await checkInventoryAndNotify(ingredients, recipes, products)
    } catch (error) {
      console.error('Error checking inventory:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
  }

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      await clearAllNotifications()
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'critical') return n.severity === 'critical'
    if (filter === 'warning') return n.severity === 'warning'
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const criticalCount = notifications.filter(n => n.severity === 'critical' && !n.isRead).length

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'out_of_stock':
        return <AlertCircle className="text-red-500" size={20} />
      case 'low_stock':
        return <AlertTriangle className="text-amber-500" size={20} />
      case 'product_unavailable':
        return <Cookie className="text-red-500" size={20} />
      case 'restock_reminder':
        return <Package className="text-blue-500" size={20} />
      default:
        return <Info className="text-gray-500" size={20} />
    }
  }

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-amber-500 bg-amber-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-midnight flex items-center gap-3">
            <Bell className="text-gold" />
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            Inventory alerts and system notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Settings size={18} />
            Email Settings
          </button>
          <button
            onClick={runInventoryCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 bg-midnight text-gold rounded-lg hover:bg-midnight/90 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking...' : 'Run Inventory Check'}
          </button>
        </div>
      </div>

      {/* Email Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-midnight mb-4 flex items-center gap-2">
            <Mail size={20} />
            Email Notification Settings
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure email alerts for inventory notifications (coming soon)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSettings.enabled}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-5 h-5 text-gold rounded focus:ring-gold"
                />
                <span className="font-medium text-midnight">Enable Email Notifications</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={emailSettings.email}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, email: e.target.value }))}
                className="mt-3 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold"
                disabled={!emailSettings.enabled}
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-midnight">Notify me about:</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSettings.lowStock}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, lowStock: e.target.checked }))}
                  className="w-4 h-4 text-gold rounded focus:ring-gold"
                  disabled={!emailSettings.enabled}
                />
                <span className="text-gray-700">Low stock warnings</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSettings.outOfStock}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, outOfStock: e.target.checked }))}
                  className="w-4 h-4 text-gold rounded focus:ring-gold"
                  disabled={!emailSettings.enabled}
                />
                <span className="text-gray-700">Out of stock alerts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSettings.productUnavailable}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, productUnavailable: e.target.checked }))}
                  className="w-4 h-4 text-gold rounded focus:ring-gold"
                  disabled={!emailSettings.enabled}
                />
                <span className="text-gray-700">Product unavailability</span>
              </label>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button className="px-4 py-2 bg-gold text-midnight font-semibold rounded-lg hover:bg-gold/90 transition">
              Save Settings
            </button>
            <span className="ml-4 text-sm text-gray-500">* Email integration coming soon</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-midnight">{notifications.length}</p>
            </div>
            <Bell className="text-gray-400" size={28} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unread</p>
              <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-amber-600">
                {ingredients.filter(i => (i.currentStock ?? 0) <= (i.minThreshold ?? 0)).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Actions Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {(['all', 'unread', 'critical', 'warning'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-midnight text-gold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={16} />
            Clear all
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <Bell className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600">No notifications</h3>
            <p className="text-gray-400 mt-1">
              {filter === 'all' 
                ? 'Run an inventory check to generate alerts'
                : `No ${filter} notifications found`}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${getSeverityColor(notification.severity)} ${
                notification.isRead ? 'opacity-60' : ''
              }`}
            >
              <div className="p-4 flex items-start gap-4">
                <div className="mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${notification.isRead ? 'text-gray-600' : 'text-midnight'}`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      notification.severity === 'critical' 
                        ? 'bg-red-100 text-red-700'
                        : notification.severity === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {notification.severity}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-sm text-gray-400 mt-2">{formatTime(notification.timestamp)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Mark as read"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inventory Overview */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-midnight mb-4">Inventory Status</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Ingredient</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Current Stock</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Min Threshold</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ingredients
                .filter(i => (i.currentStock ?? 0) <= (i.minThreshold ?? 0) * 1.5)
                .sort((a, b) => {
                  const aRatio = (a.currentStock ?? 0) / (a.minThreshold ?? 1)
                  const bRatio = (b.currentStock ?? 0) / (b.minThreshold ?? 1)
                  return aRatio - bRatio
                })
                .slice(0, 10)
                .map(ing => {
                  const current = ing.currentStock ?? 0
                  const threshold = ing.minThreshold ?? 0
                  const percentage = threshold > 0 ? (current / threshold) * 100 : 100
                  
                  return (
                    <tr key={ing.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-midnight">{ing.name}</td>
                      <td className="px-4 py-3 text-gray-600">{ing.category}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {current.toLocaleString()} {ing.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">
                        {threshold.toLocaleString()} {ing.unit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                percentage <= 50 ? 'bg-red-500' :
                                percentage <= 100 ? 'bg-amber-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            percentage <= 50 ? 'text-red-600' :
                            percentage <= 100 ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                            {percentage <= 0 ? 'OUT' : 
                             percentage <= 100 ? 'LOW' : 'OK'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          {ingredients.filter(i => (i.currentStock ?? 0) <= (i.minThreshold ?? 0) * 1.5).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              All ingredients are well-stocked!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

