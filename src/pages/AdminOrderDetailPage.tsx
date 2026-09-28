import { useEffect, useState } from 'react'
import { ArrowLeft, MapPinned, Phone } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LocationMap } from '../components/SafeMap'
import { ErrorBox, LoadingBlock } from '../components/Ui'
import { api, ApiError } from '../lib/api'
import type { Order } from '../lib/types'

const STATUSES = ['Chờ xác nhận','Đã xác nhận','Đang chuẩn bị','Đang giao hàng','Hoàn thành','Đã hủy']

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  async function load() {
    if (!id) { setError('Thiếu mã đơn hàng'); setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const data = await api.adminOrder(id)
      setOrder(data)
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setOrder(null)
      setError(e?.message || 'Không tải được chi tiết đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id])

  async function updateStatus(status: string) {
    if (!order) return
    setUpdating(true)
    setError('')
    try {
      const updated = await api.updateOrderStatus(order._id, status)
      setOrder(updated)
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setError(e?.message || 'Không cập nhật được trạng thái')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="p-6 md:p-8"><LoadingBlock text="Đang tải chi tiết đơn hàng..."/></div>
  if (error && !order) return <div className="p-6 md:p-8"><Link to="/admin/orders" className="mb-5 inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/>Quay lại danh sách</Link><ErrorBox message={error} onRetry={() => void load()}/></div>
  if (!order) return <div className="p-8">Không tìm thấy đơn hàng.</div>

  const items = Array.isArray(order.products) ? order.products : []
  const totalPrice = Number(order.totalPrice || 0)
  const totalCost = Number(order.totalCost ?? items.reduce((sum, item) => sum + Number(item.costSubtotal ?? Number(item.costPriceAtPurchase || 0) * Number(item.quantity || 0)), 0))
  const lat = Number(order.latitude)
  const lng = Number(order.longitude)
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
  const googleMapsUrl = hasLocation ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving` : ''

  return <div className="p-6 md:p-8">
    <Link to="/admin/orders" className="mb-5 inline-flex items-center gap-2 font-bold text-slate-600 hover:text-orange-600"><ArrowLeft size={18}/>Quay lại danh sách</Link>
    {error && <div className="mb-5"><ErrorBox message={error}/></div>}
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">Đơn {order.orderCode || order._id}</h1><p className="mt-1 text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Không có thời gian tạo'}</p></div><div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-500">Trạng thái:</span><select disabled={updating} value={order.orderStatus || 'Chờ xác nhận'} onChange={e => void updateStatus(e.target.value)} className="rounded-xl border bg-white p-3 font-bold disabled:opacity-60">{STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select></div></div>
    <div className="mt-7 grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">Thông tin đơn hàng</h2>{items.length === 0 ? <div className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-500">Đơn hàng chưa có dữ liệu món ăn.</div> : <div className="mt-5 grid gap-3">{items.map((item, index) => { const price = Number(item.priceAtPurchase || 0); const subtotal = Number(item.subtotal ?? price * Number(item.quantity || 0)); return <div key={`${item.productId}-${index}`} className="flex justify-between gap-4 border-b pb-3"><div><b>{item.name || 'Món ăn'}</b><div className="text-sm text-slate-500">{Number(item.quantity || 0)} × {price.toLocaleString('vi-VN')}đ</div></div><b>{subtotal.toLocaleString('vi-VN')}đ</b></div> })}</div>}
        <div className="mt-5 flex justify-between text-xl font-black"><span>Tổng</span><span className="text-orange-600">{totalPrice.toLocaleString('vi-VN')}đ</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Giá vốn snapshot</span><b>{totalCost.toLocaleString('vi-VN')}đ</b></div><div className="mt-1 flex justify-between text-sm"><span className="text-slate-500">Lợi nhuận dự kiến</span><b className="text-green-600">{(totalPrice - totalCost).toLocaleString('vi-VN')}đ</b></div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm"><b>Thanh toán:</b> {order.paymentMethod === 'bank' ? 'Chuyển khoản' : 'Tiền mặt'} • {order.paymentStatus || 'Chưa thanh toán'}</div>
      </section>
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">Khách hàng & giao hàng</h2><div className="mt-4 space-y-2"><div className="text-lg font-black">{order.customerName || 'Chưa có tên khách hàng'}</div><a href={`tel:${order.phone || ''}`} className="flex items-center gap-2 font-bold text-blue-600"><Phone size={16}/>{order.phone || 'Chưa có số điện thoại'}</a><div>{order.address || 'Chưa có địa chỉ giao hàng'}</div>{order.note && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><b>Ghi chú:</b> {order.note}</div>}</div>
        {hasLocation ? <><div className="mt-5"><LocationMap latitude={lat} longitude={lng}/></div><div className="mt-3 text-xs text-slate-500">Tọa độ: {lat.toFixed(6)}, {lng.toFixed(6)}</div><a href={googleMapsUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-orange-500 py-3 font-black text-orange-600"><MapPinned size={18}/>Chỉ đường tới vị trí khách hàng</a></> : <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">Đơn hàng chưa có tọa độ giao hàng hợp lệ nên chưa thể hiển thị bản đồ.</div>}
      </section>
    </div>
  </div>
}
