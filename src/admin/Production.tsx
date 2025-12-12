import { useState, useEffect } from 'react'
import { 
  ClipboardList, 
  Package, 
  ChefHat, 
  Loader2, 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  Cookie,
  Plus,
  User,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  X,
  Truck,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  PieChart,
  Trash2,
  History,
  Ban
} from 'lucide-react'
import { 
  Order, 
  Ingredient, 
  Recipe, 
  DoughBall,
  OrderStatus 
} from '../types/admin'
import { 
  subscribeToOrders, 
  subscribeToIngredients,
  subscribeToRecipes,
  subscribeToDoughBalls,
  updateOrderStatus,
  createDoughBatch,
  deleteDoughBall,
  deleteOrder,
  calculateOrderIngredients
} from '../lib/storage'
import { formatAmount } from '../lib/conversions'
import { sendOrderStatusUpdateEmails } from '../lib/emailService'

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  processed: { label: 'Processed', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Package },
  in_progress: { label: 'In Progress', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: ChefHat },
  done: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
}

export function Production() {
  const [orders, setOrders] = useState<Order[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [doughBalls, setDoughBalls] = useState<DoughBall[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'selected'>('all')
  const [activeTab, setActiveTab] = useState<'queue' | 'prep' | 'dough' | 'history'>('queue')
  const [showDoughModal, setShowDoughModal] = useState(false)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [doughForm, setDoughForm] = useState({
    recipeId: 0,
    quantity: 24,
    cookieSize: 75,
    expiryDays: 3,
    notes: ''
  })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    let loadedCount = 0
    const checkLoaded = () => {
      loadedCount++
      if (loadedCount >= 4) setLoading(false)
    }

    const unsubOrders = subscribeToOrders((data) => {
      setOrders(data)
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
    const unsubDough = subscribeToDoughBalls((data) => {
      setDoughBalls(data)
      checkLoaded()
    })

    return () => {
      unsubOrders()
      unsubIngredients()
      unsubRecipes()
      unsubDough()
    }
  }, [])

  // Filter orders for production
  const activeOrders = orders.filter(o => 
    o.status !== 'done' && o.status !== 'cancelled'
  )

  const ordersToCalculate = viewMode === 'selected' && selectedOrder 
    ? [selectedOrder] 
    : activeOrders

  const { needed, doughBallsUsed, doughBallsNeeded } = calculateOrderIngredients(
    ordersToCalculate,
    recipes,
    ingredients,
    doughBalls
  )

  // Get aggregated dough ball totals by recipe
  const getDoughBallTotals = () => {
    const totals: Record<number, { recipeName: string; totalAvailable: number; batches: DoughBall[] }> = {}
    
    for (const d of doughBalls) {
      if (!totals[d.recipeId]) {
        totals[d.recipeId] = { recipeName: d.recipeName, totalAvailable: 0, batches: [] }
      }
      totals[d.recipeId].totalAvailable += d.quantity
      totals[d.recipeId].batches.push(d)
    }
    
    return totals
  }
  
  const doughTotals = getDoughBallTotals()

  // Group ingredients by cookie type for the prep list - now uses doughBallsNeeded
  const getIngredientsByRecipe = () => {
    const byRecipe: Record<number, {
      recipe: Recipe
      quantity: number
      ingredients: { ingredient: Ingredient; amount: number }[]
    }> = {}

    // Use the doughBallsNeeded which already accounts for used dough balls
    for (const needed of doughBallsNeeded) {
      const recipe = recipes.find(r => r.id === needed.recipeId)
      if (!recipe) continue

      if (!byRecipe[recipe.id]) {
        byRecipe[recipe.id] = {
          recipe,
          quantity: 0,
          ingredients: []
        }
      }
      byRecipe[recipe.id].quantity += needed.quantity
    }

    // Calculate ingredients for each recipe group
    for (const entry of Object.values(byRecipe)) {
      const multiplier = entry.quantity / entry.recipe.baseYield
      entry.ingredients = entry.recipe.ingredients.map(ri => {
        const ing = ingredients.find(i => i.id === ri.ingredientId)
        return {
          ingredient: ing!,
          amount: ri.amount * multiplier
        }
      }).filter(i => i.ingredient)
    }

    return Object.values(byRecipe)
  }

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setProcessing(true)
    try {
      const shouldDeduct = newStatus === 'in_progress' || newStatus === 'done'
      await updateOrderStatus(orderId, newStatus, shouldDeduct, ingredients, recipes, doughBalls)
      
      // Find the order to send email notification
      const order = orders.find(o => o.id === orderId)
      if (order) {
        // Send status update emails to customer and admin
        sendOrderStatusUpdateEmails({
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          customerEmail: order.customer.email,
          items: order.items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            priceEach: item.priceEach
          })),
          subtotal: order.subtotal,
          discount: order.discount,
          deliveryFee: order.delivery.fee,
          tax: order.tax,
          tip: order.tip,
          total: order.total,
          deliveryAddress: {
            address: order.delivery.address,
            city: order.delivery.city,
            state: order.delivery.state,
            zip: order.delivery.zip,
          },
          status: newStatus,
          createdAt: order.createdAt
        }).catch(err => console.error('Error sending status update emails:', err))
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating order status')
    } finally {
      setProcessing(false)
    }
  }

  const handleMakeDough = async () => {
    if (!doughForm.recipeId) return
    setProcessing(true)
    try {
      const recipe = recipes.find(r => r.id === doughForm.recipeId)
      if (!recipe) throw new Error('Recipe not found')
      
      await createDoughBatch(
        recipe,
        ingredients,
        doughForm.quantity,
        doughForm.cookieSize,
        doughForm.expiryDays,
        doughForm.notes
      )
      setShowDoughModal(false)
      setDoughForm({ recipeId: 0, quantity: 24, cookieSize: 75, expiryDays: 3, notes: '' })
    } catch (error) {
      console.error('Error making dough:', error)
      alert('Error creating dough batch')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Calculate cost breakdown for an order
  const getOrderCostBreakdown = (order: Order) => {
    const itemCosts: {
      productName: string
      quantity: number
      revenue: number
      ingredients: { name: string; amount: number; unit: string; cost: number }[]
      totalIngredientCost: number
      costPerCookie: number
      profitPerCookie: number
      profitMargin: number
    }[] = []

    let totalIngredientCost = 0
    let totalRevenue = order.subtotal - order.discount

    for (const item of order.items) {
      const recipe = recipes.find(r => r.id === item.recipeId)
      if (!recipe) {
        itemCosts.push({
          productName: item.productName,
          quantity: item.quantity,
          revenue: item.priceEach * item.quantity,
          ingredients: [],
          totalIngredientCost: 0,
          costPerCookie: 0,
          profitPerCookie: item.priceEach,
          profitMargin: 100
        })
        continue
      }

      const multiplier = item.quantity / recipe.baseYield
      const ingredientDetails: { name: string; amount: number; unit: string; cost: number }[] = []
      let itemIngredientCost = 0

      for (const ri of recipe.ingredients) {
        const ing = ingredients.find(i => i.id === ri.ingredientId)
        if (!ing) continue

        const amount = ri.amount * multiplier
        const costPerUnit = ing.costPerUnit ?? (ing.packagePrice / ing.packageSize)
        const cost = amount * costPerUnit

        ingredientDetails.push({
          name: ing.name,
          amount,
          unit: ing.unit,
          cost
        })
        itemIngredientCost += cost
      }

      const revenue = item.priceEach * item.quantity
      const costPerCookie = itemIngredientCost / item.quantity
      const profitPerCookie = item.priceEach - costPerCookie
      const profitMargin = revenue > 0 ? ((revenue - itemIngredientCost) / revenue) * 100 : 0

      itemCosts.push({
        productName: item.productName,
        quantity: item.quantity,
        revenue,
        ingredients: ingredientDetails,
        totalIngredientCost: itemIngredientCost,
        costPerCookie,
        profitPerCookie,
        profitMargin
      })

      totalIngredientCost += itemIngredientCost
    }

    const grossProfit = totalRevenue - totalIngredientCost
    const overallMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    return {
      itemCosts,
      totalIngredientCost,
      totalRevenue,
      grossProfit,
      overallMargin
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    )
  }

  const recipeGroups = getIngredientsByRecipe()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-midnight flex items-center gap-3">
            <ChefHat className="text-gold" />
            Kitchen Production
          </h1>
          <p className="text-gray-600 mt-1">
            {activeOrders.length} orders in queue • {doughBalls.reduce((s, d) => s + d.quantity, 0)} dough balls ready
          </p>
        </div>
        <button
          onClick={() => setShowDoughModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
        >
          <ChefHat size={20} />
          Make Dough Batch
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Processed', count: orders.filter(o => o.status === 'processed').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In Progress', count: orders.filter(o => o.status === 'in_progress').length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Ready Dough', count: doughBalls.reduce((s, d) => s + d.quantity, 0), color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Missing Items', count: needed.filter(n => n.missing > 0).length, color: needed.filter(n => n.missing > 0).length > 0 ? 'text-red-600' : 'text-green-600', bg: needed.filter(n => n.missing > 0).length > 0 ? 'bg-red-50' : 'bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'queue', label: 'Order Queue', icon: ClipboardList, count: activeOrders.length },
          { id: 'prep', label: 'Prep List', icon: Cookie },
          { id: 'dough', label: 'Dough Inventory', icon: Package },
          { id: 'history', label: 'Order History', icon: History, count: orders.filter(o => o.status === 'done' || o.status === 'cancelled').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-midnight shadow-sm'
                : 'text-gray-600 hover:text-midnight'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-midnight text-gold' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order Queue Tab */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-midnight text-lg">Orders</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-auto">
              {activeOrders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <CheckCircle className="mx-auto mb-3 text-green-300" size={48} />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm">No orders in queue</p>
                </div>
              ) : (
                activeOrders.map(order => {
                  const isSelected = selectedOrder?.id === order.id
                  return (
                    <div 
                      key={order.id}
                      onClick={() => { setSelectedOrder(order); setShowOrderDetail(true) }}
                      className={`p-4 cursor-pointer transition hover:bg-gray-50 ${isSelected ? 'bg-gold/10 border-l-4 border-gold' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-mono font-bold text-midnight text-lg">{order.orderNumber}</span>
                          <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[order.status].bgColor} ${STATUS_CONFIG[order.status].color}`}>
                            {STATUS_CONFIG[order.status].label}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-midnight">${order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <User size={14} />
                        <span>{order.customer.name}</span>
                        <span className="text-gray-300">•</span>
                        <Clock size={14} />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-midnight/5 text-midnight rounded-lg text-xs font-medium">
                            {item.quantity}× {item.productName}
                          </span>
                        ))}
                      </div>
                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        {order.status === 'pending' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'processed') }}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                          >
                            <Package size={14} /> Accept Order
                          </button>
                        )}
                        {order.status === 'processed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'in_progress') }}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
                          >
                            <Play size={14} /> Start Making
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'done') }}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                          >
                            <CheckCircle size={14} /> Mark Complete
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setViewMode('selected'); setActiveTab('prep') }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                        >
                          View Prep List
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Today's Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-midnight text-lg mb-4">Today's Cookie Count</h3>
              <div className="space-y-3">
                {Object.entries(
                  activeOrders.flatMap(o => o.items).reduce((acc, item) => {
                    acc[item.productName] = (acc[item.productName] || 0) + item.quantity
                    return acc
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{name}</span>
                    <span className="font-mono font-bold text-midnight bg-gray-100 px-3 py-1 rounded-lg">{count}</span>
                  </div>
                ))}
                {activeOrders.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No orders yet</p>
                )}
              </div>
              {activeOrders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-midnight">Total Cookies</span>
                  <span className="text-2xl font-bold text-gold">
                    {activeOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Pre-made Dough Available */}
            {doughBalls.length > 0 && (
              <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                  <Cookie size={20} />
                  Ready-to-Bake Dough
                </h3>
                <div className="space-y-2">
                  {doughBalls.map(dough => (
                    <div key={dough.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                      <div>
                        <p className="font-medium text-midnight">{dough.recipeName}</p>
                        <p className="text-xs text-gray-500">{dough.cookieSize}g each</p>
                      </div>
                      <span className="font-mono font-bold text-purple-600 text-lg">{dough.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prep List Tab */}
      {activeTab === 'prep' && (
        <div className="space-y-6">
          {/* View Toggle */}
          <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <span className="font-medium text-gray-600">Prep list for:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'all' ? 'bg-midnight text-gold' : 'bg-gray-100 text-gray-600'
                }`}
              >
                All Orders ({activeOrders.length})
              </button>
              {selectedOrder && (
                <button
                  onClick={() => setViewMode('selected')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    viewMode === 'selected' ? 'bg-midnight text-gold' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {selectedOrder.orderNumber} only
                </button>
              )}
            </div>
          </div>

          {/* Using Pre-made Dough */}
          {doughBallsUsed.length > 0 && (
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                <CheckCircle size={20} />
                Using Pre-made Dough (Ready to Bake!)
              </h3>
              {/* Aggregate by recipe */}
              {(() => {
                const aggregated: Record<number, { recipeName: string; totalUsed: number; batches: { batchNumber: string; used: number; available: number }[] }> = {}
                for (const usage of doughBallsUsed) {
                  const recipeId = usage.doughBall.recipeId
                  if (!aggregated[recipeId]) {
                    aggregated[recipeId] = { recipeName: usage.doughBall.recipeName, totalUsed: 0, batches: [] }
                  }
                  aggregated[recipeId].totalUsed += usage.quantityUsed
                  aggregated[recipeId].batches.push({
                    batchNumber: usage.doughBall.batchNumber || usage.doughBall.id.slice(-6),
                    used: usage.quantityUsed,
                    available: usage.doughBall.quantity
                  })
                }
                return Object.entries(aggregated).map(([recipeId, data]) => (
                  <div key={recipeId} className="bg-white rounded-xl p-4 mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-lg text-midnight">{data.recipeName}</p>
                        <p className="text-sm text-gray-500">
                          Using {data.batches.length} batch{data.batches.length > 1 ? 'es' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-3xl text-green-600">{data.totalUsed}</p>
                        <p className="text-xs text-gray-500">dough balls</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.batches.map((batch, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                          📦 {batch.batchNumber}: {batch.used}/{batch.available}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}

          {/* Recipe-by-Recipe Prep Cards */}
          {recipeGroups.length === 0 && doughBallsUsed.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <Cookie className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="font-medium text-gray-600">No prep needed</p>
              <p className="text-sm text-gray-400">All orders use pre-made dough or queue is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recipeGroups.map(group => (
                <div key={group.recipe.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Recipe Header */}
                  <div className="bg-gradient-to-r from-midnight to-gray-800 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xl">{group.recipe.displayName}</h3>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gold">{group.quantity}</p>
                        <p className="text-xs text-gray-300">cookies</p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-300">
                      <span>🌡️ {group.recipe.ovenTemp}</span>
                      <span>⏱️ {group.recipe.bakeTime}</span>
                    </div>
                  </div>
                  
                  {/* Ingredients List */}
                  <div className="p-4">
                    <h4 className="font-semibold text-midnight mb-3 text-sm uppercase tracking-wide">Ingredients</h4>
                    <div className="space-y-2">
                      {group.ingredients.map(({ ingredient, amount }) => {
                        const have = ingredient.currentStock ?? 0
                        const enough = have >= amount
                        return (
                          <div key={ingredient.id} className={`flex items-center justify-between p-2 rounded-lg ${!enough ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                              {!enough && <AlertTriangle className="text-red-500" size={14} />}
                              <span className={`font-medium ${!enough ? 'text-red-700' : 'text-gray-700'}`}>
                                {ingredient.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-midnight">
                                {formatAmount(amount)} {ingredient.unit}
                              </span>
                              {!enough && (
                                <p className="text-xs text-red-500">
                                  Need {formatAmount(amount - have)} more
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grand Total Ingredients */}
          {needed.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-midnight">📋 Total Ingredients Needed</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {needed.sort((a, b) => a.ingredient.category.localeCompare(b.ingredient.category)).map(item => (
                    <div 
                      key={item.ingredient.id} 
                      className={`p-3 rounded-xl ${item.missing > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
                    >
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{item.ingredient.category}</p>
                      <p className="font-medium text-midnight">{item.ingredient.name}</p>
                      <p className="font-mono font-bold text-lg mt-1">
                        {formatAmount(item.amount)} <span className="text-gray-400 text-sm">{item.ingredient.unit}</span>
                      </p>
                      {item.missing > 0 ? (
                        <p className="text-xs text-red-600 mt-1">⚠️ Need {formatAmount(item.missing)} more</p>
                      ) : (
                        <p className="text-xs text-green-600 mt-1">✓ In stock</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dough Inventory Tab */}
      {activeTab === 'dough' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {Object.keys(doughTotals).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(doughTotals).map(([recipeId, data]) => (
                <div key={recipeId} className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">{data.recipeName}</p>
                  <p className="text-3xl font-bold mt-1">{data.totalAvailable}</p>
                  <p className="text-xs opacity-70">{data.batches.length} batch{data.batches.length !== 1 ? 'es' : ''}</p>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-midnight text-lg">Pre-made Dough Batches</h2>
              <button
                onClick={() => setShowDoughModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
              >
                <Plus size={16} /> Make Batch
              </button>
            </div>
            {doughBalls.length === 0 ? (
              <div className="p-12 text-center">
                <Cookie className="mx-auto mb-3 text-gray-300" size={56} />
                <p className="font-medium text-gray-600">No pre-made dough</p>
                <p className="text-sm text-gray-400 mt-1">Make a batch to speed up production!</p>
                <button
                  onClick={() => setShowDoughModal(true)}
                  className="mt-4 px-6 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition"
                >
                  Make Your First Batch
                </button>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doughBalls
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map(dough => {
                  const isExpired = new Date(dough.expiresAt) < new Date()
                  const isExpiringSoon = !isExpired && new Date(dough.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                  
                  return (
                    <div 
                      key={dough.id} 
                      className={`rounded-xl p-4 border-2 ${
                        isExpired ? 'border-red-300 bg-red-50' : 
                        isExpiringSoon ? 'border-yellow-300 bg-yellow-50' : 
                        'border-green-300 bg-green-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="px-2 py-0.5 bg-midnight text-gold rounded text-xs font-mono font-bold">
                            {dough.batchNumber || dough.id.slice(-8)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isExpired ? 'bg-red-200 text-red-700' : 
                          isExpiringSoon ? 'bg-yellow-200 text-yellow-700' : 
                          'bg-green-200 text-green-700'
                        }`}>
                          {isExpired ? 'Expired' : isExpiringSoon ? 'Use Today' : 'Fresh'}
                        </span>
                      </div>
                      <h4 className="font-bold text-midnight text-lg">{dough.recipeName}</h4>
                      <p className="text-sm text-gray-600">{dough.cookieSize}g per cookie</p>
                      <div className="text-center py-3">
                        <p className="text-4xl font-bold text-midnight">{dough.quantity}</p>
                        <p className="text-sm text-gray-500">dough balls</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                        <span>Made: {new Date(dough.createdAt).toLocaleDateString()}</span>
                        <span>Exp: {new Date(dough.expiresAt).toLocaleDateString()}</span>
                      </div>
                      {dough.notes && (
                        <p className="text-xs text-gray-500 mt-2 italic">"{dough.notes}"</p>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Discard batch ${dough.batchNumber || dough.id.slice(-8)}? This will remove ${dough.quantity} dough balls.`)) {
                            deleteDoughBall(dough.id)
                          }
                        }}
                        className="w-full mt-3 px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm hover:bg-red-50 transition border border-red-200"
                      >
                        Discard Batch
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-midnight text-lg flex items-center gap-2">
              <History size={20} />
              Order History
            </h2>
            <span className="text-sm text-gray-500">
              {orders.filter(o => o.status === 'done' || o.status === 'cancelled').length} orders
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-auto">
            {orders.filter(o => o.status === 'done' || o.status === 'cancelled').length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <History className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="font-medium">No order history yet</p>
                <p className="text-sm">Completed and cancelled orders will appear here</p>
              </div>
            ) : (
              orders
                .filter(o => o.status === 'done' || o.status === 'cancelled')
                .map(order => (
                  <div 
                    key={order.id}
                    onClick={() => { setSelectedOrder(order); setShowOrderDetail(true) }}
                    className="p-4 cursor-pointer transition hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-midnight text-lg">{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[order.status].bgColor} ${STATUS_CONFIG[order.status].color}`}>
                          {STATUS_CONFIG[order.status].label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-midnight">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User size={14} />
                      <span>{order.customer.name}</span>
                      <span className="text-gray-300">•</span>
                      <span>{order.customer.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                            {item.quantity}× {item.productName}
                          </span>
                        ))}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>Placed: {formatDate(order.createdAt)}</p>
                        <p>{order.status === 'done' ? 'Completed' : 'Cancelled'}: {formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-2xl text-midnight">{selectedOrder.orderNumber}</span>
                <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedOrder.status].bgColor} ${STATUS_CONFIG[selectedOrder.status].color}`}>
                  {STATUS_CONFIG[selectedOrder.status].label}
                </span>
              </div>
              <button onClick={() => setShowOrderDetail(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-midnight mb-3 flex items-center gap-2">
                    <User size={18} className="text-gold" />
                    Customer
                  </h4>
                  <p className="font-medium text-midnight text-lg">{selectedOrder.customer.name}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><Mail size={14} /> {selectedOrder.customer.email}</p>
                    <p className="flex items-center gap-2"><Phone size={14} /> {selectedOrder.customer.phone}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-midnight mb-3 flex items-center gap-2">
                    <Truck size={18} className="text-gold" />
                    Delivery
                  </h4>
                  <p className="font-medium text-midnight">{selectedOrder.delivery.address}</p>
                  <p className="text-gray-600">{selectedOrder.delivery.city}, {selectedOrder.delivery.state} {selectedOrder.delivery.zip}</p>
                  {selectedOrder.delivery.instructions && (
                    <p className="mt-2 text-sm text-gray-500 italic">"{selectedOrder.delivery.instructions}"</p>
                  )}
                </div>
              </div>

              {/* Order Items with Cost Breakdown Toggle */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-midnight flex items-center gap-2">
                    <Cookie size={18} className="text-gold" />
                    Order Items
                  </h4>
                  <button
                    onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <PieChart size={14} />
                    {showCostBreakdown ? 'Hide' : 'Show'} Cost Analysis
                    {showCostBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-midnight text-gold rounded-full flex items-center justify-center font-bold text-sm">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-midnight">{item.productName}</span>
                      </div>
                      <span className="font-medium text-gray-600">${(item.priceEach * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown Section */}
              {showCostBreakdown && (() => {
                const costData = getOrderCostBreakdown(selectedOrder)
                return (
                  <div className="space-y-4">
                    {/* Per-Item Cost Breakdown */}
                    {costData.itemCosts.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-bold text-midnight">{item.productName}</h5>
                              <p className="text-sm text-gray-500">{item.quantity} cookies</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${item.profitMargin >= 50 ? 'text-green-600' : item.profitMargin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {item.profitMargin.toFixed(1)}% margin
                              </p>
                              <p className="text-xs text-gray-500">
                                ${item.profitPerCookie.toFixed(2)} profit/cookie
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {item.ingredients.length > 0 && (
                          <div className="p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Ingredients</p>
                            <div className="space-y-1">
                              {item.ingredients.map((ing, ingIdx) => (
                                <div key={ingIdx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    {ing.name}
                                    <span className="text-gray-400 ml-1">({formatAmount(ing.amount)} {ing.unit})</span>
                                  </span>
                                  <span className="font-mono text-gray-700">${ing.cost.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                              <span className="font-medium text-gray-700">Ingredient Cost</span>
                              <span className="font-mono font-bold text-midnight">${item.totalIngredientCost.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-gray-600">Cost per cookie</span>
                              <span className="font-mono text-gray-600">${item.costPerCookie.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Profit Summary */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                      <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Profit Analysis
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-sm text-gray-500">Revenue</p>
                          <p className="text-xl font-bold text-midnight">${costData.totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-sm text-gray-500">Ingredient Cost</p>
                          <p className="text-xl font-bold text-red-600">${costData.totalIngredientCost.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-sm text-gray-500">Gross Profit</p>
                          <p className="text-xl font-bold text-green-600">${costData.grossProfit.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <p className="text-sm text-gray-500">Profit Margin</p>
                          <p className={`text-xl font-bold ${costData.overallMargin >= 50 ? 'text-green-600' : costData.overallMargin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {costData.overallMargin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      {/* Visual profit bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Cost breakdown</span>
                          <span>Revenue: ${costData.totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="h-6 bg-gray-200 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-red-400 h-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${(costData.totalIngredientCost / costData.totalRevenue) * 100}%` }}
                          >
                            {((costData.totalIngredientCost / costData.totalRevenue) * 100).toFixed(0)}%
                          </div>
                          <div 
                            className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${costData.overallMargin}%` }}
                          >
                            {costData.overallMargin.toFixed(0)}%
                          </div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-red-600">Ingredients</span>
                          <span className="text-green-600">Profit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Order Summary */}
              <div className="bg-midnight rounded-xl p-4 text-white">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-gold" />
                  Order Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Subtotal</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-300">Delivery</span>
                    <span>${selectedOrder.delivery.fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tax</span>
                    <span>${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  {selectedOrder.tip > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tip</span>
                      <span>${selectedOrder.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-600 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-gold">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Placed: {formatDate(selectedOrder.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Updated: {formatDate(selectedOrder.updatedAt)}
                </span>
              </div>

              {/* Status Change */}
              {selectedOrder.status !== 'done' && selectedOrder.status !== 'cancelled' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-midnight mb-3">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status !== 'pending' && (
                      <button
                        onClick={() => handleStatusChange(selectedOrder.id, 'pending')}
                        disabled={processing}
                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition flex items-center gap-2"
                      >
                        <Clock size={16} /> Pending
                      </button>
                    )}
                    {selectedOrder.status !== 'processed' && (
                      <button
                        onClick={() => handleStatusChange(selectedOrder.id, 'processed')}
                        disabled={processing}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition flex items-center gap-2"
                      >
                        <Package size={16} /> Processed
                      </button>
                    )}
                    {selectedOrder.status !== 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(selectedOrder.id, 'in_progress')}
                        disabled={processing}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition flex items-center gap-2"
                      >
                        <ChefHat size={16} /> In Progress
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'done')}
                      disabled={processing}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Complete
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this order?')) {
                          handleStatusChange(selectedOrder.id, 'cancelled')
                          setShowOrderDetail(false)
                        }
                      }}
                      disabled={processing}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition flex items-center gap-2"
                    >
                      <Ban size={16} /> Cancel Order
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => { handleStatusChange(selectedOrder.id, 'processed'); setShowOrderDetail(false) }}
                    disabled={processing}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Package size={18} /> Accept Order
                  </button>
                )}
                {selectedOrder.status === 'processed' && (
                  <button
                    onClick={() => { handleStatusChange(selectedOrder.id, 'in_progress'); setShowOrderDetail(false) }}
                    disabled={processing}
                    className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play size={18} /> Start Making
                  </button>
                )}
                {selectedOrder.status === 'in_progress' && (
                  <button
                    onClick={() => { handleStatusChange(selectedOrder.id, 'done'); setShowOrderDetail(false) }}
                    disabled={processing}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={18} /> Complete Order
                  </button>
                )}
                {selectedOrder.status !== 'done' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => { setViewMode('selected'); setActiveTab('prep'); setShowOrderDetail(false) }}
                    className="flex-1 py-3 bg-gray-100 text-midnight rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    View Prep List
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to permanently delete this order? This cannot be undone.')) {
                      await deleteOrder(selectedOrder.id)
                      setShowOrderDetail(false)
                      setSelectedOrder(null)
                    }
                  }}
                  className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Make Dough Modal */}
      {showDoughModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-midnight flex items-center gap-2">
                <ChefHat className="text-purple-500" />
                Make Dough Batch
              </h2>
              <button onClick={() => setShowDoughModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cookie Type</label>
                <select
                  value={doughForm.recipeId}
                  onChange={(e) => setDoughForm({ ...doughForm, recipeId: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                >
                  <option value={0}>Select a recipe...</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.displayName}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How Many?</label>
                  <input
                    type="number"
                    value={doughForm.quantity}
                    onChange={(e) => setDoughForm({ ...doughForm, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size (g each)</label>
                  <input
                    type="number"
                    value={doughForm.cookieSize}
                    onChange={(e) => setDoughForm({ ...doughForm, cookieSize: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Good for (days)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 5, 7].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDoughForm({ ...doughForm, expiryDays: d })}
                      className={`flex-1 py-2 rounded-lg font-medium transition ${
                        doughForm.expiryDays === d 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <input
                  type="text"
                  value={doughForm.notes}
                  onChange={(e) => setDoughForm({ ...doughForm, notes: e.target.value })}
                  placeholder="e.g. Extra chocolate chips"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
              
              {doughForm.recipeId > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-sm text-purple-700 mb-1">This will subtract ingredients for:</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {doughForm.quantity} × {recipes.find(r => r.id === doughForm.recipeId)?.displayName}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDoughModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMakeDough}
                disabled={processing || !doughForm.recipeId || doughForm.quantity <= 0}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="animate-spin" size={18} /> : <ChefHat size={18} />}
                Make Dough
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
