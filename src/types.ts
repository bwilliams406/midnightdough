export interface Cookie {
  id: number
  name: string
  description: string
  price: number
  image: string
  flavor: string
}

export interface CartItem {
  cookie: Cookie
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
}

