export interface Cookie {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  flavor: string
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

export interface CartItem {
  cookie: Cookie
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
}

