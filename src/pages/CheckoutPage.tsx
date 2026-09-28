import { useState } from 'react'
import { Crosshair, MapPin, Navigation } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CustomerHeader from '../components/CustomerHeader'
import { MapPicker, type LatLngValue } from '../components/SafeMap'
import { useCart } from '../lib/cart'
import { api } from '../lib/api'

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const navigate = useNavigate()
  const [position, setPosition] = useState<LatLngValue | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoMessage, setGeoMessage] = useState('')
  const [form, setForm] = useState({ customerName: '', phone: '', address: '', note: '', paymentMethod: 'cash' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }))

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoMessage('Trình duyệt này không hỗ trợ xác định vị trí.')
      return
    }

    setLocating(true)
    setGeoMessage('Đang lấy vị trí hiện tại...')

    navigator.geolocation.getCurrentPosition(
      result => {
        const next: LatLngValue = [result.coords.latitude, result.coords.longitude]
        setPosition(next)
        setAccuracy(Number.isFinite(result.coords.accuracy) ? result.coords.accuracy : null)
        setGeoMessage(`Đã lấy vị trí hiện tại${result.coords.accuracy ? ` (độ chính xác khoảng ${Math.round(result.coords.accuracy)} m)` : ''}. Bạn có thể kéo ghim để chỉnh lại.`)
        setLocating(false)
      },
      err => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Bạn đã từ chối quyền vị trí. Hãy cho phép Location trong trình duyệt rồi thử lại, hoặc bấm trực tiếp lên bản đồ.'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Thiết bị chưa xác định được vị trí. Hãy thử lại hoặc bấm trực tiếp lên bản đồ.'
              : 'Lấy vị trí quá lâu. Hãy thử lại hoặc chọn thủ công trên bản đồ.'
        setGeoMessage(message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  function selectPosition(next: LatLngValue) {
    setPosition(next)
    setAccuracy(null)
    setGeoMessage('Đã chọn điểm giao hàng. Bạn có thể kéo ghim đỏ để chỉnh chính xác hơn.')
  }

  async function submit() {
    if (!items.length) return setError('Giỏ hàng đang trống.')
    if (!form.customerName.trim() || !form.phone.trim() || !form.address.trim()) return setError('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.')
    if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, ''))) return setError('Số điện thoại cần gồm 10 chữ số và bắt đầu bằng 0.')
    if (!position) return setError('Vui lòng chọn vị trí giao hàng trên bản đồ hoặc bấm “Dùng vị trí hiện tại”.')

    setLoading(true)
    setError('')

    try {
      const order = await api.createOrder({
        ...form,
        latitude: position[0],
        longitude: position[1],
        products: items.map(item => ({ productId: item.product._id, quantity: item.quantity }))
      })
      clear()
      navigate('/track?code=' + encodeURIComponent(order.orderCode), { state: { justCreated: true } })
    } catch (e: any) {
      setError(e?.message || 'Không thể tạo đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  if (!items.length) return <><CustomerHeader/><main className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-2xl border bg-white p-10 text-center"><div className="text-5xl">🛒</div><h1 className="mt-4 text-2xl font-black">Chưa có món để đặt</h1><p className="mt-2 text-slate-500">Hãy thêm món vào giỏ trước khi vào trang thanh toán.</p><Link to="/" className="mt-5 inline-block rounded-xl bg-orange-600 px-5 py-3 font-black text-white">Chọn món</Link></div></main></>

  return <>
    <CustomerHeader/>
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black">Đặt hàng</h1>
      <p className="mt-1 text-slate-500">Điền thông tin và đánh dấu đúng vị trí bạn muốn nhận món.</p>

      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-black">Thông tin người nhận</h2>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1 text-sm font-bold">Họ và tên<input value={form.customerName} onChange={e => set('customerName', e.target.value)} className="rounded-xl border p-3 font-normal" placeholder="Nguyễn Văn A"/></label>
            <label className="grid gap-1 text-sm font-bold">Số điện thoại<input value={form.phone} onChange={e => set('phone', e.target.value.replace(/[^0-9\s]/g, ''))} className="rounded-xl border p-3 font-normal" placeholder="09xxxxxxxx" inputMode="tel"/></label>
            <label className="grid gap-1 text-sm font-bold">Địa chỉ giao hàng<input value={form.address} onChange={e => set('address', e.target.value)} className="rounded-xl border p-3 font-normal" placeholder="Số nhà, ngõ, đường, quận/huyện..."/></label>
            <label className="grid gap-1 text-sm font-bold">Ghi chú<textarea value={form.note} onChange={e => set('note', e.target.value)} className="min-h-24 rounded-xl border p-3 font-normal" placeholder="Ví dụ: gọi trước khi giao"/></label>
            <div>
              <div className="mb-2 text-sm font-bold">Phương thức thanh toán</div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => set('paymentMethod', 'cash')} className={`rounded-xl border px-4 py-3 font-bold ${form.paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-600' : ''}`}>Tiền mặt khi nhận hàng</button>
                <button type="button" onClick={() => set('paymentMethod', 'bank')} className={`rounded-xl border px-4 py-3 font-bold ${form.paymentMethod === 'bank' ? 'border-orange-500 bg-orange-50 text-orange-600' : ''}`}>Chuyển khoản</button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Vị trí giao hàng</h2>
              <p className="mt-1 text-sm text-slate-500">Vị trí này sẽ được lưu vào đơn để Admin mở chỉ đường khi giao hàng.</p>
            </div>

            <button
              type="button"
              disabled={locating}
              onClick={useCurrentLocation}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              <Crosshair size={17}/>
              {locating ? 'Đang định vị...' : 'Dùng vị trí hiện tại'}
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            <b>Cách chọn:</b> bấm “Dùng vị trí hiện tại” để lấy GPS, hoặc bấm lên bản đồ. Sau đó có thể <b>kéo ghim đỏ</b> đến đúng cửa nhà/ngõ cần giao.
          </div>

          {geoMessage && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{geoMessage}</div>}

          <div className="mt-4">
            <MapPicker value={position} onChange={selectPosition} accuracy={accuracy}/>
          </div>

          {position ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                <div className="flex items-center gap-2 font-black"><MapPin size={17}/>Đã chọn vị trí giao hàng</div>
                <div className="mt-1 font-mono text-xs">{position[0].toFixed(6)}, {position[1].toFixed(6)}</div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500 px-4 py-3 text-sm font-black text-blue-600"
              >
                <Navigation size={17}/>Kiểm tra trên Google Maps
              </a>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              Chưa chọn vị trí. Hệ thống sẽ không cho đặt hàng cho đến khi bạn đánh dấu một điểm giao hàng.
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <span className="font-bold">Tổng thanh toán</span>
            <span className="text-2xl font-black text-orange-600">{total.toLocaleString('vi-VN')}đ</span>
          </div>

          <button
            disabled={loading}
            onClick={() => void submit()}
            className="mt-4 w-full rounded-xl bg-orange-600 py-3.5 font-black text-white disabled:opacity-60"
          >
            {loading ? 'Đang tạo đơn...' : 'Xác nhận đặt hàng'}
          </button>
        </section>
      </div>
    </main>
  </>
}
