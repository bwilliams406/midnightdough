// Admin Types

export interface Ingredient {
  id: number
  name: string
  unit: string
  packageSize: number
  packagePrice: number
  category: string
  // Inventory tracking
  currentStock?: number      // Current amount in stock (in base units)
  minThreshold?: number      // Minimum threshold before alert
  reorderAmount?: number     // Suggested reorder quantity
  lastRestocked?: string     // ISO date of last restock
  // Cost tracking
  stockValue?: number        // Total value of current stock ($)
  costPerUnit?: number       // Weighted average cost per unit ($)
}

export type NotificationType = 'low_stock' | 'out_of_stock' | 'product_unavailable' | 'restock_reminder' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  isRead: boolean
  ingredientId?: number
  productId?: number
  severity: 'critical' | 'warning' | 'info'
}

export interface RecipeIngredient {
  ingredientId: number
  amount: number
  category: string
}

export interface Recipe {
  id: number
  name: string
  displayName: string
  baseYield: number
  baseCookieSize: number
  totalDough: number
  ovenTemp: string
  bakeTime: string
  instructions: string
  ingredients: RecipeIngredient[]
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  flavor: string
  imageUrl: string
  recipeId?: number // Link to recipe for cost calculation
  isActive: boolean
  nutritionalFacts: {
    calories: number
    fat: number
    saturatedFat: number
    carbohydrates: number
    sugars: number
    protein: number
    fiber: number
    sodium: number
    allergens: string
  }
}

export interface DiscountTier {
  id: number
  threshold: number
  discount: number
  label: string
  isActive: boolean
}

export interface ProductionOrder {
  id: number
  recipeId: number
  quantity: number
  cookieSize: number
  date: string
  notes: string
}

// Order status flow: pending -> processed -> in_progress -> done
export type OrderStatus = 'pending' | 'processed' | 'in_progress' | 'done' | 'cancelled'

export interface OrderItem {
  productId: number
  productName: string
  quantity: number
  priceEach: number
  recipeId?: number
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  // Customer info
  customer: {
    name: string
    email: string
    phone: string
  }
  // Delivery info
  delivery: {
    address: string
    city: string
    state: string
    zip: string
    instructions?: string
    fee: number
  }
  // Order details
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  tip: number
  total: number
  // Production tracking
  useDoughBalls?: boolean  // Whether to use pre-made dough if available
  ingredientsDeducted?: boolean  // Has inventory been deducted?
}

// Pre-made dough ball inventory
export interface DoughBall {
  id: string
  batchNumber: string  // e.g. "MM-001" for labeling
  recipeId: number
  recipeName: string
  cookieSize: number  // grams per cookie
  quantity: number    // number of dough balls ready
  createdAt: string
  expiresAt: string   // dough freshness expiry
  notes?: string
}

export interface CalculatedIngredient {
  ingredient: Ingredient
  baseAmount: number
  scaledAmount: number
  cost: number
  category: string
}

export type AdminTab = 'dashboard' | 'ingredients' | 'recipes' | 'products' | 'calculator' | 'production'
