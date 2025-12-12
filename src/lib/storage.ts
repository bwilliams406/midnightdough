import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'
import { Ingredient, Recipe, Product, DiscountTier, Notification, Order, DoughBall } from '../types/admin'
import ingredientsData from '../data/ingredients.json'
import recipesData from '../data/recipes.json'
import productsData from '../data/products.json'

// Collection references
const ingredientsCollection = collection(db, 'ingredients')
const recipesCollection = collection(db, 'recipes')
const productsCollection = collection(db, 'products')
const discountTiersCollection = collection(db, 'discountTiers')
const notificationsCollection = collection(db, 'notifications')
const ordersCollection = collection(db, 'orders')
const doughBallsCollection = collection(db, 'doughBalls')

// Track initialization
let ingredientsInitialized = false
let recipesInitialized = false
let productsInitialized = false
let discountTiersInitialized = false

// ============ INGREDIENTS ============

export async function initializeIngredients(): Promise<void> {
  if (ingredientsInitialized) return
  
  const snapshot = await getDocs(ingredientsCollection)
  if (snapshot.empty) {
    console.log('Initializing ingredients in Firebase...')
    const batch = writeBatch(db)
    ingredientsData.ingredients.forEach((ing) => {
      const { id, ...data } = ing
      batch.set(doc(db, 'ingredients', String(id)), data)
    })
    await batch.commit()
    console.log('Ingredients initialized!')
  }
  ingredientsInitialized = true
}

export function subscribeToIngredients(callback: (ingredients: Ingredient[]) => void) {
  initializeIngredients().catch(console.error)

  return onSnapshot(ingredientsCollection, (snapshot) => {
    if (snapshot.empty) {
      callback(ingredientsData.ingredients)
      return
    }
    const ingredients = snapshot.docs.map(doc => ({ 
      id: Number(doc.id), 
      ...doc.data() 
    } as Ingredient))
    callback(ingredients)
  }, (error) => {
    console.error('Error subscribing to ingredients:', error)
    callback(ingredientsData.ingredients)
  })
}

export async function saveIngredient(ingredient: Ingredient): Promise<void> {
  const { id, ...data } = ingredient
  await setDoc(doc(db, 'ingredients', String(id)), data)
}

export async function deleteIngredient(id: number): Promise<void> {
  await deleteDoc(doc(db, 'ingredients', String(id)))
}

// ============ RECIPES ============

export async function initializeRecipes(): Promise<void> {
  if (recipesInitialized) return
  
  const snapshot = await getDocs(recipesCollection)
  if (snapshot.empty) {
    console.log('Initializing recipes in Firebase...')
    const batch = writeBatch(db)
    recipesData.recipes.forEach((recipe) => {
      const { id, ...data } = recipe
      batch.set(doc(db, 'recipes', String(id)), data)
    })
    await batch.commit()
    console.log('Recipes initialized!')
  }
  recipesInitialized = true
}

export function subscribeToRecipes(callback: (recipes: Recipe[]) => void) {
  initializeRecipes().catch(console.error)

  return onSnapshot(recipesCollection, (snapshot) => {
    if (snapshot.empty) {
      callback(recipesData.recipes)
      return
    }
    const recipes = snapshot.docs.map(doc => ({ 
      id: Number(doc.id), 
      ...doc.data() 
    } as Recipe))
    callback(recipes)
  }, (error) => {
    console.error('Error subscribing to recipes:', error)
    callback(recipesData.recipes)
  })
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const { id, ...data } = recipe
  await setDoc(doc(db, 'recipes', String(id)), data)
}

export async function deleteRecipe(id: number): Promise<void> {
  await deleteDoc(doc(db, 'recipes', String(id)))
}

// ============ PRODUCTS ============

export async function initializeProducts(): Promise<void> {
  if (productsInitialized) return
  
  const snapshot = await getDocs(productsCollection)
  if (snapshot.empty) {
    console.log('Initializing products in Firebase...')
    const batch = writeBatch(db)
    productsData.products.forEach((product) => {
      const { id, ...data } = product
      batch.set(doc(db, 'products', String(id)), data)
    })
    await batch.commit()
    console.log('Products initialized!')
  }
  productsInitialized = true
}

export function subscribeToProducts(callback: (products: Product[]) => void) {
  initializeProducts().catch(console.error)

  return onSnapshot(productsCollection, (snapshot) => {
    if (snapshot.empty) {
      callback(productsData.products as Product[])
      return
    }
    const products = snapshot.docs.map(doc => ({ 
      id: Number(doc.id), 
      ...doc.data() 
    } as Product))
    callback(products)
  }, (error) => {
    console.error('Error subscribing to products:', error)
    callback(productsData.products as Product[])
  })
}

export async function saveProduct(product: Product): Promise<void> {
  const { id, ...data } = product
  await setDoc(doc(db, 'products', String(id)), data)
}

export async function deleteProduct(id: number): Promise<void> {
  await deleteDoc(doc(db, 'products', String(id)))
}

// ============ DISCOUNT TIERS ============

export async function initializeDiscountTiers(): Promise<void> {
  if (discountTiersInitialized) return
  
  const snapshot = await getDocs(discountTiersCollection)
  if (snapshot.empty) {
    console.log('Initializing discount tiers in Firebase...')
    const batch = writeBatch(db)
    productsData.discountTiers.forEach((tier) => {
      const { id, ...data } = tier
      batch.set(doc(db, 'discountTiers', String(id)), data)
    })
    await batch.commit()
    console.log('Discount tiers initialized!')
  }
  discountTiersInitialized = true
}

export function subscribeToDiscountTiers(callback: (tiers: DiscountTier[]) => void) {
  initializeDiscountTiers().catch(console.error)

  return onSnapshot(discountTiersCollection, (snapshot) => {
    if (snapshot.empty) {
      callback(productsData.discountTiers as DiscountTier[])
      return
    }
    const tiers = snapshot.docs.map(doc => ({ 
      id: Number(doc.id), 
      ...doc.data() 
    } as DiscountTier))
    // Sort by threshold descending
    tiers.sort((a, b) => b.threshold - a.threshold)
    callback(tiers)
  }, (error) => {
    console.error('Error subscribing to discount tiers:', error)
    callback(productsData.discountTiers as DiscountTier[])
  })
}

export async function saveDiscountTier(tier: DiscountTier): Promise<void> {
  const { id, ...data } = tier
  await setDoc(doc(db, 'discountTiers', String(id)), data)
}

export async function deleteDiscountTier(id: number): Promise<void> {
  await deleteDoc(doc(db, 'discountTiers', String(id)))
}

// ============ UTILITY ============

export async function getNextId(collectionName: 'ingredients' | 'recipes' | 'products' | 'discountTiers'): Promise<number> {
  const colMap = {
    ingredients: ingredientsCollection,
    recipes: recipesCollection,
    products: productsCollection,
    discountTiers: discountTiersCollection,
  }
  const defaultMap = {
    ingredients: ingredientsData.ingredients,
    recipes: recipesData.recipes,
    products: productsData.products,
    discountTiers: productsData.discountTiers,
  }
  
  const col = colMap[collectionName]
  const snapshot = await getDocs(col)
  
  if (snapshot.empty) {
    const defaultData = defaultMap[collectionName]
    return Math.max(...defaultData.map(d => d.id)) + 1
  }
  const ids = snapshot.docs.map(doc => Number(doc.id))
  return Math.max(...ids) + 1
}

// Force re-initialize (useful if you need to reset data)
export async function resetToDefaults(): Promise<void> {
  const [ingSnapshot, recSnapshot, prodSnapshot, tierSnapshot] = await Promise.all([
    getDocs(ingredientsCollection),
    getDocs(recipesCollection),
    getDocs(productsCollection),
    getDocs(discountTiersCollection),
  ])
  
  const batch = writeBatch(db)
  ingSnapshot.docs.forEach(d => batch.delete(d.ref))
  recSnapshot.docs.forEach(d => batch.delete(d.ref))
  prodSnapshot.docs.forEach(d => batch.delete(d.ref))
  tierSnapshot.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
  
  // Reset flags and reinitialize
  ingredientsInitialized = false
  recipesInitialized = false
  productsInitialized = false
  discountTiersInitialized = false
  
  await Promise.all([
    initializeIngredients(), 
    initializeRecipes(),
    initializeProducts(),
    initializeDiscountTiers(),
  ])
}

// ============ NOTIFICATIONS ============

export function subscribeToNotifications(callback: (notifications: Notification[]) => void) {
  return onSnapshot(notificationsCollection, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Notification))
    // Sort by timestamp descending (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    callback(notifications)
  }, (error) => {
    console.error('Error subscribing to notifications:', error)
    callback([])
  })
}

export async function createNotification(notification: Omit<Notification, 'id'>, sendEmail: boolean = true): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  await setDoc(doc(db, 'notifications', id), notification)
  
  // Send email for critical and warning notifications
  if (sendEmail && (notification.severity === 'critical' || notification.severity === 'warning')) {
    // Dynamic import to avoid circular dependency
    import('./emailService').then(({ sendNotificationEmail }) => {
      sendNotificationEmail({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        severity: notification.severity
      }).catch(err => console.error('Error sending notification email:', err))
    })
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await setDoc(doc(db, 'notifications', id), { isRead: true }, { merge: true })
}

export async function markAllNotificationsRead(): Promise<void> {
  const snapshot = await getDocs(notificationsCollection)
  const batch = writeBatch(db)
  snapshot.docs.forEach(d => {
    batch.update(d.ref, { isRead: true })
  })
  await batch.commit()
}

export async function deleteNotification(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notifications', id))
}

export async function clearAllNotifications(): Promise<void> {
  const snapshot = await getDocs(notificationsCollection)
  const batch = writeBatch(db)
  snapshot.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

// ============ INVENTORY CHECKS ============

export async function checkInventoryAndNotify(
  ingredients: Ingredient[],
  recipes: Recipe[],
  products: Product[]
): Promise<Notification[]> {
  const newNotifications: Omit<Notification, 'id'>[] = []
  
  // Check each ingredient for low/out of stock
  for (const ing of ingredients) {
    const currentStock = ing.currentStock ?? 0
    const minThreshold = ing.minThreshold ?? 0
    
    if (currentStock <= 0) {
      newNotifications.push({
        type: 'out_of_stock',
        title: 'Out of Stock',
        message: `${ing.name} is completely out of stock!`,
        timestamp: new Date().toISOString(),
        isRead: false,
        ingredientId: ing.id,
        severity: 'critical'
      })
    } else if (currentStock <= minThreshold) {
      newNotifications.push({
        type: 'low_stock',
        title: 'Low Stock Warning',
        message: `${ing.name} is running low (${currentStock} ${ing.unit} remaining, threshold: ${minThreshold})`,
        timestamp: new Date().toISOString(),
        isRead: false,
        ingredientId: ing.id,
        severity: 'warning'
      })
    }
  }
  
  // Check which products are affected by low stock ingredients
  for (const product of products) {
    if (!product.recipeId || !product.isActive) continue
    
    const recipe = recipes.find(r => r.id === product.recipeId)
    if (!recipe) continue
    
    const affectedIngredients: string[] = []
    
    for (const recipeIng of recipe.ingredients) {
      const ingredient = ingredients.find(i => i.id === recipeIng.ingredientId)
      if (!ingredient) continue
      
      const currentStock = ingredient.currentStock ?? 0
      // Check if we can make at least one batch
      if (currentStock < recipeIng.amount) {
        affectedIngredients.push(ingredient.name)
      }
    }
    
    if (affectedIngredients.length > 0) {
      newNotifications.push({
        type: 'product_unavailable',
        title: 'Product Availability Alert',
        message: `${product.name} cannot be made due to insufficient: ${affectedIngredients.join(', ')}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        productId: product.id,
        severity: 'critical'
      })
    }
  }
  
  // Create notifications in Firebase
  for (const notif of newNotifications) {
    await createNotification(notif)
  }
  
  return newNotifications.map((n, i) => ({ ...n, id: String(i) }))
}

// Update ingredient stock
export async function updateIngredientStock(
  ingredientId: number, 
  newStock: number,
  isRestock: boolean = false
): Promise<void> {
  const updates: Partial<Ingredient> = {
    currentStock: newStock
  }
  
  if (isRestock) {
    updates.lastRestocked = new Date().toISOString()
  }
  
  await setDoc(doc(db, 'ingredients', String(ingredientId)), updates, { merge: true })
}

// Bulk update stock after production
export async function deductProductionStock(
  recipe: Recipe,
  ingredients: Ingredient[],
  batchMultiplier: number
): Promise<void> {
  const batch = writeBatch(db)
  
  for (const recipeIng of recipe.ingredients) {
    const ingredient = ingredients.find(i => i.id === recipeIng.ingredientId)
    if (!ingredient) continue
    
    const currentStock = ingredient.currentStock ?? 0
    const currentValue = ingredient.stockValue ?? 0
    const costPerUnit = ingredient.costPerUnit ?? 0
    const amountUsed = recipeIng.amount * batchMultiplier
    const newStock = Math.max(0, currentStock - amountUsed)
    const valueUsed = amountUsed * costPerUnit
    const newValue = Math.max(0, currentValue - valueUsed)
    
    batch.update(doc(db, 'ingredients', String(ingredient.id)), { 
      currentStock: newStock,
      stockValue: newValue
    })
  }
  
  await batch.commit()
}

// ============ ORDERS ============

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(ordersCollection, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Order))
    // Sort by date descending (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    callback(orders)
  }, (error) => {
    console.error('Error subscribing to orders:', error)
    callback([])
  })
}

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  const id = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  await setDoc(doc(db, 'orders', id), { ...order, id })
  return id
}

export async function updateOrder(order: Order): Promise<void> {
  const { id, ...data } = order
  await setDoc(doc(db, 'orders', id), { ...data, id, updatedAt: new Date().toISOString() })
}

export async function updateOrderStatus(
  orderId: string, 
  status: Order['status'],
  deductInventory: boolean = false,
  ingredients?: Ingredient[],
  recipes?: Recipe[],
  doughBalls?: DoughBall[]
): Promise<void> {
  // Get the order first
  const ordersSnapshot = await getDocs(ordersCollection)
  const orderDoc = ordersSnapshot.docs.find(d => d.id === orderId)
  if (!orderDoc) throw new Error('Order not found')
  
  const order = { id: orderDoc.id, ...orderDoc.data() } as Order
  
  // If transitioning to in_progress or done and haven't deducted yet
  if (deductInventory && !order.ingredientsDeducted && 
      (status === 'in_progress' || status === 'done') &&
      ingredients && recipes) {
    
    const batch = writeBatch(db)
    
    for (const item of order.items) {
      if (!item.recipeId) continue
      
      const recipe = recipes.find(r => r.id === item.recipeId)
      if (!recipe) continue
      
      // Check if we have dough balls for this recipe
      const availableDough = doughBalls?.find(d => 
        d.recipeId === item.recipeId && 
        d.quantity >= item.quantity
      )
      
      if (availableDough) {
        // Use dough balls instead of raw ingredients
        const newQty = availableDough.quantity - item.quantity
        if (newQty <= 0) {
          batch.delete(doc(db, 'doughBalls', availableDough.id))
        } else {
          batch.update(doc(db, 'doughBalls', availableDough.id), { quantity: newQty })
        }
      } else {
        // Deduct raw ingredients
        const multiplier = item.quantity / recipe.baseYield
        
        for (const recipeIng of recipe.ingredients) {
          const ingredient = ingredients.find(i => i.id === recipeIng.ingredientId)
          if (!ingredient) continue
          
          const currentStock = ingredient.currentStock ?? 0
          const currentValue = ingredient.stockValue ?? 0
          const costPerUnit = ingredient.costPerUnit ?? 0
          const amountUsed = recipeIng.amount * multiplier
          const newStock = Math.max(0, currentStock - amountUsed)
          const valueUsed = amountUsed * costPerUnit
          const newValue = Math.max(0, currentValue - valueUsed)
          
          batch.update(doc(db, 'ingredients', String(ingredient.id)), { 
            currentStock: newStock,
            stockValue: newValue
          })
        }
      }
    }
    
    // Mark order as having inventory deducted
    batch.update(doc(db, 'orders', orderId), { 
      status, 
      ingredientsDeducted: true,
      updatedAt: new Date().toISOString()
    })
    
    await batch.commit()
  } else {
    // Just update status
    await setDoc(doc(db, 'orders', orderId), { 
      status, 
      updatedAt: new Date().toISOString() 
    }, { merge: true })
  }
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, 'orders', id))
}

// Generate next order number
export async function getNextOrderNumber(): Promise<string> {
  const snapshot = await getDocs(ordersCollection)
  const orderNumbers = snapshot.docs
    .map(d => d.data().orderNumber)
    .filter(n => n?.startsWith('MD-'))
    .map(n => parseInt(n.replace('MD-', '')))
    .filter(n => !isNaN(n))
  
  const nextNum = orderNumbers.length > 0 ? Math.max(...orderNumbers) + 1 : 1001
  return `MD-${nextNum}`
}

// ============ DOUGH BALLS ============

export function subscribeToDoughBalls(callback: (doughBalls: DoughBall[]) => void) {
  return onSnapshot(doughBallsCollection, (snapshot) => {
    const doughBalls = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as DoughBall))
    // Sort by expiry date
    doughBalls.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
    callback(doughBalls)
  }, (error) => {
    console.error('Error subscribing to dough balls:', error)
    callback([])
  })
}

// Generate batch number prefix from recipe name (e.g., "Moonlight Morsels" -> "MM")
function getRecipeBatchPrefix(recipeName: string): string {
  const words = recipeName.split(' ').filter(w => w.length > 0)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return recipeName.substring(0, 2).toUpperCase()
}

export async function createDoughBatch(
  recipe: Recipe,
  ingredients: Ingredient[],
  quantity: number,
  cookieSize: number,
  expiryDays: number = 3,
  notes?: string
): Promise<string> {
  // Calculate how many batches we need
  const batchMultiplier = quantity / recipe.baseYield
  
  // Deduct ingredients
  const batch = writeBatch(db)
  
  for (const recipeIng of recipe.ingredients) {
    const ingredient = ingredients.find(i => i.id === recipeIng.ingredientId)
    if (!ingredient) continue
    
    const currentStock = ingredient.currentStock ?? 0
    const currentValue = ingredient.stockValue ?? 0
    const costPerUnit = ingredient.costPerUnit ?? 0
    const amountUsed = recipeIng.amount * batchMultiplier
    const newStock = Math.max(0, currentStock - amountUsed)
    const valueUsed = amountUsed * costPerUnit
    const newValue = Math.max(0, currentValue - valueUsed)
    
    batch.update(doc(db, 'ingredients', String(ingredient.id)), { 
      currentStock: newStock,
      stockValue: newValue
    })
  }
  
  await batch.commit()
  
  // Generate batch number
  const prefix = getRecipeBatchPrefix(recipe.displayName)
  const snapshot = await getDocs(doughBallsCollection)
  const existingBatches = snapshot.docs
    .map(d => d.data() as DoughBall)
    .filter(d => d.recipeId === recipe.id && d.batchNumber)
  
  // Find the highest batch number for this recipe
  let maxNum = 0
  for (const d of existingBatches) {
    const match = d.batchNumber.match(/-(\d+)$/)
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1]))
    }
  }
  const batchNumber = `${prefix}-${String(maxNum + 1).padStart(3, '0')}`
  
  // Create dough ball entry
  const id = `DOUGH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)
  
  const doughBall: DoughBall = {
    id,
    batchNumber,
    recipeId: recipe.id,
    recipeName: recipe.displayName,
    cookieSize,
    quantity,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    notes
  }
  
  await setDoc(doc(db, 'doughBalls', id), doughBall)
  
  return id
}

export async function updateDoughBall(doughBall: DoughBall): Promise<void> {
  const { id, ...data } = doughBall
  await setDoc(doc(db, 'doughBalls', id), { ...data, id })
}

export async function deleteDoughBall(id: string): Promise<void> {
  await deleteDoc(doc(db, 'doughBalls', id))
}

// Use dough balls for an order
export async function useDoughBallsForOrder(
  doughBallId: string,
  quantityUsed: number
): Promise<void> {
  const snapshot = await getDocs(doughBallsCollection)
  const doughDoc = snapshot.docs.find(d => d.id === doughBallId)
  if (!doughDoc) throw new Error('Dough ball batch not found')
  
  const doughBall = { id: doughDoc.id, ...doughDoc.data() } as DoughBall
  const newQuantity = doughBall.quantity - quantityUsed
  
  if (newQuantity <= 0) {
    await deleteDoc(doc(db, 'doughBalls', doughBallId))
  } else {
    await setDoc(doc(db, 'doughBalls', doughBallId), { quantity: newQuantity }, { merge: true })
  }
}

// Calculate ingredients needed for orders
export function calculateOrderIngredients(
  orders: Order[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  doughBalls: DoughBall[]
): {
  needed: { ingredient: Ingredient; amount: number; have: number; after: number; missing: number }[]
  doughBallsUsed: { doughBall: DoughBall; quantityUsed: number }[]
  doughBallsNeeded: { recipeId: number; recipeName: string; quantity: number }[]
  totalDoughByRecipe: { recipeId: number; recipeName: string; totalAvailable: number; totalUsed: number }[]
} {
  const ingredientTotals: Record<number, number> = {}
  const doughBallsUsed: { doughBall: DoughBall; quantityUsed: number }[] = []
  const doughBallsNeeded: { recipeId: number; recipeName: string; quantity: number }[] = []
  
  // Sort dough balls by createdAt (FIFO - use oldest first)
  const sortedDough = [...doughBalls].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  
  // Clone dough balls for tracking usage with remaining quantities
  const availableDough = sortedDough.map(d => ({ ...d, remaining: d.quantity }))
  
  // Track total dough used per recipe
  const doughUsageByRecipe: Record<number, { recipeName: string; totalUsed: number }> = {}
  
  for (const order of orders) {
    if (order.status === 'done' || order.status === 'cancelled' || order.ingredientsDeducted) continue
    
    for (const item of order.items) {
      if (!item.recipeId) continue
      
      const recipe = recipes.find(r => r.id === item.recipeId)
      if (!recipe) continue
      
      let cookiesNeeded = item.quantity
      
      // Use dough balls from ALL matching batches (FIFO order)
      for (const dough of availableDough) {
        if (dough.recipeId !== item.recipeId || dough.remaining <= 0 || cookiesNeeded <= 0) continue
        
        const canUse = Math.min(dough.remaining, cookiesNeeded)
        
        // Check if we already have an entry for this batch
        const existingUsage = doughBallsUsed.find(u => u.doughBall.id === dough.id)
        if (existingUsage) {
          existingUsage.quantityUsed += canUse
        } else {
          doughBallsUsed.push({ 
            doughBall: { ...dough, quantity: dough.quantity }, // Original quantity for display
            quantityUsed: canUse 
          })
        }
        
        dough.remaining -= canUse
        cookiesNeeded -= canUse
        
        // Track usage by recipe
        if (!doughUsageByRecipe[recipe.id]) {
          doughUsageByRecipe[recipe.id] = { recipeName: recipe.displayName, totalUsed: 0 }
        }
        doughUsageByRecipe[recipe.id].totalUsed += canUse
      }
      
      // If we still need more, calculate remaining from raw ingredients
      if (cookiesNeeded > 0) {
        const multiplier = cookiesNeeded / recipe.baseYield
        for (const recipeIng of recipe.ingredients) {
          ingredientTotals[recipeIng.ingredientId] = 
            (ingredientTotals[recipeIng.ingredientId] ?? 0) + (recipeIng.amount * multiplier)
        }
        doughBallsNeeded.push({
          recipeId: recipe.id,
          recipeName: recipe.displayName,
          quantity: cookiesNeeded
        })
      }
    }
  }
  
  // Build ingredient needs list
  const needed = Object.entries(ingredientTotals).map(([id, amount]) => {
    const ingredient = ingredients.find(i => i.id === Number(id))!
    const have = ingredient?.currentStock ?? 0
    const after = have - amount
    const missing = Math.max(0, -after)
    return { ingredient, amount, have, after, missing }
  }).filter(n => n.ingredient)
  
  // Build total dough summary by recipe
  const totalDoughByRecipe = Object.entries(
    doughBalls.reduce((acc, d) => {
      if (!acc[d.recipeId]) {
        acc[d.recipeId] = { recipeName: d.recipeName, totalAvailable: 0 }
      }
      acc[d.recipeId].totalAvailable += d.quantity
      return acc
    }, {} as Record<number, { recipeName: string; totalAvailable: number }>)
  ).map(([recipeId, data]) => ({
    recipeId: Number(recipeId),
    recipeName: data.recipeName,
    totalAvailable: data.totalAvailable,
    totalUsed: doughUsageByRecipe[Number(recipeId)]?.totalUsed ?? 0
  }))
  
  return { needed, doughBallsUsed, doughBallsNeeded, totalDoughByRecipe }
}
