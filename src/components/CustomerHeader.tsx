import { MapPinned, ShoppingCart, Shield, Star } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../lib/cart'

export default function CustomerHeader() {
  const { count } = useCart()
  return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
      <Link to="/" className="text-2xl font-black tracking-tight text-orange-600">mi_chotxoo</Link>
      <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
        <NavLink to="/" className="hover:text-orange-600">Thực đơn</NavLink>
        <NavLink to="/track" className="flex items-center gap-1 hover:text-orange-600"><MapPinned size={16}/>Theo dõi đơn</NavLink>
        <NavLink to="/review" className="flex items-center gap-1 hover:text-orange-600"><Star size={16}/>Đánh giá</NavLink>
        <NavLink to="/admin/login" className="flex items-center gap-1 text-slate-500 hover:text-orange-600"><Shield size={15}/>Quản trị</NavLink>
      </nav>
      <Link to="/cart" className="relative flex items-center gap-2 rounded-xl border border-orange-200 px-3 py-2 font-bold text-orange-600 hover:bg-orange-50">
        <ShoppingCart size={18}/><span className="hidden sm:inline">Giỏ hàng</span>
        {count > 0 && <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">{count}</span>}
      </Link>
    </div>
  </header>
}
