import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { Order } from '../lib/types'
import { ErrorBox, LoadingBlock } from '../components/Ui'

const FILTERS = ['Tất cả','Chờ xác nhận','Đã xác nhận','Đang chuẩn bị','Đang giao hàng','Hoàn thành','Đã hủy']
function statusClass(status: string) {
  if (status === 'Hoàn thành') return 'bg-green-50 text-green-700'
  if (status === 'Đang giao hàng') return 'bg-blue-50 text-blue-700'
  if (status === 'Đã hủy') return 'bg-red-50 text-red-700'
  if (status === 'Chờ xác nhận') return 'bg-violet-50 text-violet-700'
  return 'bg-amber-50 text-amber-700'
}

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tất cả')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.adminOrders()
      setOrders(Array.isArray(data) ? data : [])
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setError(e?.message || 'Không tải được danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => orders.filter(order => {
    const text = `${order.orderCode || ''} ${order.customerName || ''} ${order.phone || ''}`.toLowerCase()
    const matchSearch = !search.trim() || text.includes(search.trim().toLowerCase())
    const matchFilter = filter === 'Tất cả' || order.orderStatus === filter
    return matchSearch && matchFilter
  }), [orders, search, filter])

  return <div className="p-6 md:p-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">Quản lý đơn hàng</h1><p className="mt-1 text-slate-500">Tiếp nhận, xử lý và cập nhật trạng thái đơn.</p></div><button onClick={() => void load()} className="rounded-xl border bg-white px-4 py-2 font-bold">Làm mới</button></div>
    <div className="mt-6 rounded-2xl border bg-white p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border py-2.5 pl-10 pr-3" placeholder="Tìm mã đơn, tên khách, số điện thoại..."/></div><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border px-4 py-2.5 font-bold">{FILTERS.map(x => <option key={x}>{x}</option>)}</select></div></div>
    <div className="mt-6">{loading ? <LoadingBlock text="Đang tải đơn hàng..."/> : error ? <ErrorBox message={error} onRetry={() => void load()}/> : filtered.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Không có đơn hàng phù hợp.</div> : <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['Mã đơn','Khách hàng','Điện thoại','Tổng tiền','Trạng thái','Thời gian',''].map(h => <th key={h} className="px-5 py-4">{h}</th>)}</tr></thead><tbody>{filtered.map(order => <tr key={order._id} className="border-t"><td className="px-5 py-4 font-black">{order.orderCode || order._id}</td><td className="px-5 py-4">{order.customerName || '-'}</td><td className="px-5 py-4">{order.phone || '-'}</td><td className="px-5 py-4 font-bold">{Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(order.orderStatus || '')}`}>{order.orderStatus || 'Chưa xác định'}</span></td><td className="px-5 py-4 text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}</td><td className="px-5 py-4"><Link className="font-bold text-blue-600" to={`/admin/orders/${order._id}`}>Xem chi tiết</Link></td></tr>)}</tbody></table></div>}</div>
  </div>
}
