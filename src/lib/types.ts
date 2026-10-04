export type Category = {
  _id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export type Product = {
  _id: string
  name: string
  description: string
  image?: string
  price: number
  costPrice: number
  categoryId?: string | Category
  status: 'available' | 'soldout'
  createdAt?: string
  updatedAt?: string
}

export type Addon = {
  _id: string
  name: string
  price: number
  costPrice: number
  status: 'available' | 'soldout'
  createdAt?: string
  updatedAt?: string
}

export type CartItem = {
  cartItemId: string
  product: Product
  addons: Addon[]
  quantity: number
}

export type OrderAddon = {
  addonId: string
  name: string
  quantity: number
  priceAtPurchase: number
  costPriceAtPurchase: number
  subtotal: number
  costSubtotal?: number
}

export type OrderItem = {
  productId: string
  name: string
  quantity: number
  priceAtPurchase: number
  costPriceAtPurchase: number
  addons?: OrderAddon[]
  subtotal: number
  costSubtotal?: number
}

export type Order = {
  _id: string
  orderCode: string
  customerName: string
  phone: string
  address: string
  latitude?: number
  longitude?: number
  note?: string
  products: OrderItem[]
  totalPrice: number
  totalCost?: number
  paymentMethod: 'cash' | 'bank' | string
  paymentStatus: string
  orderStatus: string
  createdAt?: string
  updatedAt?: string
}

export type Review = {
  _id: string
  orderId?: string
  orderCode?: string
  customerName: string
  phone?: string
  rating: number
  comment: string
  createdAt?: string
  updatedAt?: string
}

export type Stats = {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  revenue: number
  cost: number
  profit: number
  reviewCount?: number
  averageRating?: number
  byDay: { date: string; revenue: number; profit: number }[]
  bestSellers: { name: string; quantity: number }[]
}
