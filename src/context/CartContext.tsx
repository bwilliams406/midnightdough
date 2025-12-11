import { createContext, useContext, useState, ReactNode } from 'react'
import { Cookie, CartItem } from '../types'
import { getDiscountForQuantity } from '../utils/pricing'

interface CartContextType {
  items: CartItem[]
  addToCart: (cookie: Cookie, quantity: number) => void
  removeFromCart: (cookieId: number) => void
  updateQuantity: (cookieId: number, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getTotalCookies: () => number
  getCartDiscount: () => { discount: number; label: string }
  getSubtotalBeforeDiscount: () => number
  getTotalSavings: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = (cookie: Cookie, quantity: number) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.cookie.id === cookie.id)
      if (existingItem) {
        return prevItems.map((item) =>
          item.cookie.id === cookie.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevItems, { cookie, quantity }]
    })
  }

  const removeFromCart = (cookieId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.cookie.id !== cookieId))
  }

  const updateQuantity = (cookieId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cookieId)
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.cookie.id === cookieId ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = () => {
    setItems([])
  }

  // Get total number of cookies in cart (for mix & match discounts)
  const getTotalCookies = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }

  // Get the discount tier based on TOTAL cookies in cart
  const getCartDiscount = () => {
    const totalCookies = getTotalCookies()
    return getDiscountForQuantity(totalCookies)
  }

  // Get subtotal before any discounts
  const getSubtotalBeforeDiscount = () => {
    return items.reduce((sum, item) => sum + (item.cookie.price * item.quantity), 0)
  }

  // Get total after applying cart-wide discount
  const getTotal = () => {
    const subtotal = getSubtotalBeforeDiscount()
    const { discount } = getCartDiscount()
    return subtotal * (1 - discount)
  }

  // Get total savings from cart-wide discount
  const getTotalSavings = () => {
    const subtotal = getSubtotalBeforeDiscount()
    const total = getTotal()
    return subtotal - total
  }

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      getTotal,
      getTotalCookies,
      getCartDiscount,
      getSubtotalBeforeDiscount,
      getTotalSavings 
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

