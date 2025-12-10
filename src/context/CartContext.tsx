import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Cookie, CartItem } from '../types'

interface CartContextType {
  items: CartItem[]
  addToCart: (cookie: Cookie, quantity: number) => void
  removeFromCart: (cookieId: number) => void
  updateQuantity: (cookieId: number, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemPrice: (cookieId: number, quantity: number, basePrice: number) => number
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

  const calculatePrice = (cookieId: number, quantity: number, basePrice: number) => {
    // Discount rules:
    // - Cookies priced at $3.75 (ids: 1, 3, 4, 5): discount to $3.50 if 12+ in cart
    // - Midnight Obsidian (id: 2, $5.25): discount to $4.85 if 12+ in cart
    // - Stellar Citrus (id: 6, $4.25): discount to $3.75 if 12+ in cart

    if (cookieId === 2) {
      // Midnight Obsidian
      return quantity >= 12 ? 4.85 : basePrice
    } else if (cookieId === 6) {
      // Stellar Citrus
      return quantity >= 12 ? 3.75 : basePrice
    } else if ([1, 3, 4, 5].includes(cookieId)) {
      // Standard $3.75 cookies
      return quantity >= 12 ? 3.50 : basePrice
    }
    return basePrice
  }

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const discountedPrice = calculatePrice(item.cookie.id, item.quantity, item.cookie.price)
      return sum + discountedPrice * item.quantity
    }, 0)
  }

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getItemPrice: calculatePrice }}>
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

