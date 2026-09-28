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

export type CartItem = {
  product: Product
  quantity: number
}

export type OrderItem = {
  productId: string
  name: string
  quantity: number
  priceAtPurchase: number
  costPriceAtPurchase: number
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

export type Stats = {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  revenue: number
  cost: number
  profit: number
  byDay: { date: string; revenue: number; profit: number }[]
  bestSellers: { name: string; quantity: number }[]
}
