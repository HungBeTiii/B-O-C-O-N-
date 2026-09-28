import { createContext, useContext, useMemo, useState } from 'react'
import type { CartItem, Product } from './types'

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  add: (product: Product) => void
  change: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readInitialCart(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem('mi_chotxoo_cart') || '[]')
    return Array.isArray(value) ? value.filter(x => x?.product?._id && Number(x?.quantity) > 0) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readInitialCart)

  const save = (next: CartItem[]) => {
    setItems(next)
    localStorage.setItem('mi_chotxoo_cart', JSON.stringify(next))
  }

  const add = (product: Product) => {
    if (product.status !== 'available') return
    const found = items.find(item => item.product._id === product._id)
    save(found
      ? items.map(item => item.product._id === product._id ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item)
      : [...items, { product, quantity: 1 }]
    )
  }

  const change = (id: string, quantity: number) => {
    const q = Math.max(1, Math.min(99, Number(quantity) || 1))
    save(items.map(item => item.product._id === id ? { ...item, quantity: q } : item))
  }

  const remove = (id: string) => save(items.filter(item => item.product._id !== id))
  const clear = () => save([])

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.quantity * Number(item.product.price || 0), 0),
    add,
    change,
    remove,
    clear
  }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('CartProvider chưa được khởi tạo')
  return value
}
