import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import CustomerHeader from '../components/CustomerHeader'
import { api } from '../lib/api'
import type { Order } from '../lib/types'

const statuses = ['Chờ xác nhận','Đã xác nhận','Đang chuẩn bị','Đang giao hàng','Hoàn thành']

export default function TrackPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const initial = params.get('code') || ''
  const [code, setCode] = useState(initial)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function track(value = code) {
    const query = value.trim()
    if (!query) return setError('Vui lòng nhập mã đơn hàng.')
    setLoading(true)
    setError('')
    try {
      const data = await api.trackOrder(query)
      setOrder(data)
    } catch (e: any) {
      setOrder(null)
      setError(e?.message || 'Không tìm thấy đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (initial) void track(initial) }, [])

  const currentIndex = order ? statuses.indexOf(order.orderStatus) : -1

  return <>
    <CustomerHeader/>
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black">Theo dõi đơn hàng</h1>
      <p className="mt-2 text-slate-500">Nhập mã đơn được trả về sau khi đặt hàng.</p>
      {(location.state as any)?.justCreated && order && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700"><b>Đặt hàng thành công!</b> Hãy lưu mã đơn <b>{order.orderCode}</b> để tra cứu.</div>}
      <div className="mt-6 flex gap-2"><input value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void track() }} className="flex-1 rounded-xl border bg-white p-3" placeholder="Ví dụ: MCX-260916-1234"/><button disabled={loading} onClick={() => void track()} className="rounded-xl bg-orange-600 px-6 font-black text-white disabled:opacity-60">{loading ? 'Đang tìm...' : 'Tra cứu'}</button></div>
      {error && <div className="mt-5 rounded-xl bg-red-50 p-4 font-semibold text-red-600">{error}</div>}
      {order && <div className="mt-7 rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-sm text-slate-500">Mã đơn</div><div className="text-xl font-black">{order.orderCode}</div></div><div className={`rounded-full px-4 py-2 font-black ${order.orderStatus === 'Đã hủy' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{order.orderStatus}</div></div>
        {order.orderStatus === 'Đã hủy' ? <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">Đơn hàng đã bị hủy.</div> : <div className="mt-7 grid gap-3">{statuses.map((status, index) => <div key={status} className="flex items-center gap-3"><div className={`h-4 w-4 rounded-full ${index <= currentIndex ? 'bg-orange-600' : 'bg-slate-200'}`}/><span className={index <= currentIndex ? 'font-bold' : 'text-slate-400'}>{status}</span></div>)}</div>}
        <div className="mt-7 border-t pt-5"><div className="flex justify-between gap-4"><span className="text-slate-500">Khách hàng</span><b>{order.customerName}</b></div><div className="mt-2 flex justify-between gap-4"><span className="text-slate-500">Địa chỉ</span><b className="text-right">{order.address}</b></div><div className="mt-2 flex justify-between"><span className="text-slate-500">Tổng tiền</span><b>{Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</b></div></div>
      </div>}
    </main>
  </>
}
