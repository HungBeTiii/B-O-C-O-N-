import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CustomerHeader from '../components/CustomerHeader'
import { useCart } from '../lib/cart'

export default function CartPage() {
  const { items, total, change, remove } = useCart()
  const navigate = useNavigate()
  return <>
    <CustomerHeader/>
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">Giỏ hàng</h1>
      <p className="mt-1 text-slate-500">Kiểm tra món và đồ thêm trước khi đặt hàng.</p>
      {!items.length ? <div className="mt-10 rounded-2xl border bg-white p-10 text-center shadow-sm"><div className="text-6xl">🛒</div><p className="mt-4 font-bold">Giỏ hàng đang trống</p><Link className="mt-4 inline-block font-bold text-orange-600" to="/">Quay lại chọn món</Link></div> : <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {items.map(item => {
            const addonTotal = (item.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0)
            const unitPrice = Number(item.product.price || 0) + addonTotal
            return <div key={item.cartItemId} className="flex items-start gap-4 border-b border-slate-100 py-5 last:border-0">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-4xl">{item.product.image ? <img src={item.product.image} className="h-full w-full object-cover" alt=""/> : '🍜'}</div>
              <div className="min-w-0 flex-1"><div className="font-black">{item.product.name}</div><div className="font-bold text-orange-600">{Number(item.product.price).toLocaleString('vi-VN')}đ</div>{item.addons?.length ? <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800"><b>Đồ thêm:</b> {item.addons.map(a => `${a.name} (+${Number(a.price).toLocaleString('vi-VN')}đ)`).join(', ')}</div> : null}<div className="mt-3 flex items-center gap-2"><button onClick={() => change(item.cartItemId, item.quantity - 1)} className="rounded-lg border p-1"><Minus size={16}/></button><span className="w-7 text-center font-bold">{item.quantity}</span><button onClick={() => change(item.cartItemId, item.quantity + 1)} className="rounded-lg border p-1"><Plus size={16}/></button></div></div>
              <div className="text-right"><div className="font-black">{(unitPrice * item.quantity).toLocaleString('vi-VN')}đ</div><button onClick={() => remove(item.cartItemId)} className="mt-3 text-red-500" aria-label="Xóa món"><Trash2 size={18}/></button></div>
            </div>
          })}
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">Tóm tắt đơn</h2><div className="mt-5 flex justify-between text-slate-500"><span>Tạm tính</span><span>{total.toLocaleString('vi-VN')}đ</span></div><div className="mt-3 flex justify-between text-slate-500"><span>Phí giao hàng</span><span>Thỏa thuận</span></div><div className="my-5 border-t"/><div className="flex justify-between text-xl font-black"><span>Tổng</span><span className="text-orange-600">{total.toLocaleString('vi-VN')}đ</span></div><button onClick={() => navigate('/checkout')} className="mt-6 w-full rounded-xl bg-orange-600 py-3 font-black text-white hover:bg-orange-700">Tiến hành đặt hàng</button></aside>
      </div>}
    </main>
  </>
}
