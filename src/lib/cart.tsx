import { createContext, useContext, useMemo, useState } from 'react'
import type { Addon, CartItem, Product } from './types'

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  add: (product: Product, addons?: Addon[]) => void
  change: (cartItemId: string, quantity: number) => void
  remove: (cartItemId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function makeCartItemId(productId: string, addons: Addon[] = []) {
  const addonKey = [...addons].map(a => a._id).sort().join(',')
  return `${productId}::${addonKey}`
}

function readInitialCart(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem('mi_chotxoo_cart') || '[]')
    if (!Array.isArray(value)) return []
    return value
      .filter(x => x?.product?._id && Number(x?.quantity) > 0)
      .map(x => {
        const addons = Array.isArray(x.addons) ? x.addons.filter((a: any) => a?._id) : []
        return {
          cartItemId: x.cartItemId || makeCartItemId(x.product._id, addons),
          product: x.product,
          addons,
          quantity: Number(x.quantity)
        }
      })
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

  const add = (product: Product, addons: Addon[] = []) => {
    if (product.status !== 'available') return
    const selectedAddons = addons.filter(a => a.status === 'available')
    const cartItemId = makeCartItemId(product._id, selectedAddons)
    const found = items.find(item => item.cartItemId === cartItemId)
    save(found
      ? items.map(item => item.cartItemId === cartItemId ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item)
      : [...items, { cartItemId, product, addons: selectedAddons, quantity: 1 }]
    )
  }

  const change = (cartItemId: string, quantity: number) => {
    const q = Math.max(1, Math.min(99, Number(quantity) || 1))
    save(items.map(item => item.cartItemId === cartItemId ? { ...item, quantity: q } : item))
  }

  const remove = (cartItemId: string) => save(items.filter(item => item.cartItemId !== cartItemId))
  const clear = () => save([])

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => {
      const addonTotal = (item.addons || []).reduce((addonSum, addon) => addonSum + Number(addon.price || 0), 0)
      return sum + item.quantity * (Number(item.product.price || 0) + addonTotal)
    }, 0),
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
