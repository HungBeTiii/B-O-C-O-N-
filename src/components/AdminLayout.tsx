import { LayoutDashboard, ReceiptText, Utensils, LogOut, Tags, Store, ExternalLink } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const nav = [
  ['/admin', LayoutDashboard, 'Tổng quan'],
  ['/admin/orders', ReceiptText, 'Đơn hàng'],
  ['/admin/products', Utensils, 'Món ăn'],
  ['/admin/categories', Tags, 'Danh mục']
] as const

export default function AdminLayout() {
  const navigate = useNavigate()
  return <div className="min-h-screen bg-slate-100 md:flex">
    <aside className="w-full bg-slate-950 p-5 text-white md:sticky md:top-0 md:min-h-screen md:w-64 md:self-start">
      <div className="mb-7 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-600"><Store size={22}/></div>
        <div><div className="text-xl font-black">mi_chotxoo</div><div className="text-xs font-semibold uppercase tracking-widest text-orange-400">Admin</div></div>
      </div>
      <nav className="grid gap-2">
        {nav.map(([to, Icon, label]) => <NavLink
          end={to === '/admin'} key={to} to={to}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}
        ><Icon size={18}/>{label}</NavLink>)}
      </nav>
      <a href="/" target="_blank" rel="noreferrer" className="mt-8 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5"><ExternalLink size={17}/>Mở trang khách</a>
      <button onClick={() => { localStorage.removeItem('admin_token'); navigate('/admin/login') }} className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10"><LogOut size={18}/>Đăng xuất</button>
    </aside>
    <main className="min-w-0 flex-1"><Outlet/></main>
  </div>
}
