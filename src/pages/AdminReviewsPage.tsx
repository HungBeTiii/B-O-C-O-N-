import { useEffect, useMemo, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorBox, LoadingBlock } from '../components/Ui'
import { api, ApiError } from '../lib/api'
import type { Review } from '../lib/types'

export default function AdminReviewsPage() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { const data = await api.adminReviews(); setReviews(Array.isArray(data) ? data : []) }
    catch (e: any) { if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true }); setError(e?.message || 'Không tải được đánh giá') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const average = useMemo(() => reviews.length ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length : 0, [reviews])

  async function remove(id: string) {
    if (!confirm('Xóa đánh giá này?')) return
    try { await api.deleteReview(id); await load() } catch (e: any) { setError(e?.message || 'Không thể xóa đánh giá') }
  }

  return <div className="p-6 md:p-8">
    <h1 className="text-3xl font-black">Đánh giá khách hàng</h1>
    <p className="mt-1 text-slate-500">Đánh giá chỉ được tạo từ các đơn hàng đã hoàn thành.</p>
    {error && <div className="mt-5"><ErrorBox message={error}/></div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border bg-white p-5"><div className="text-sm font-bold text-slate-500">Tổng đánh giá</div><div className="mt-2 text-3xl font-black">{reviews.length}</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-sm font-bold text-slate-500">Điểm trung bình</div><div className="mt-2 flex items-center gap-2 text-3xl font-black"><Star className="text-amber-500" fill="currentColor"/>{average.toFixed(1)}/5</div></div></div>
    <div className="mt-6">{loading ? <LoadingBlock text="Đang tải đánh giá..."/> : reviews.length ? <div className="grid gap-4">{reviews.map(review => <article key={review._id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="font-black">{review.customerName}</div><div className="mt-1 text-xs text-slate-500">Đơn {review.orderCode || '—'} • {review.createdAt ? new Date(review.createdAt).toLocaleString('vi-VN') : ''}</div></div><div className="flex items-center gap-3"><div className="flex gap-1 text-amber-500">{[1,2,3,4,5].map(n => <Star key={n} size={17} fill={n <= review.rating ? 'currentColor' : 'none'}/>)}</div><button onClick={() => void remove(review._id)} className="text-red-500" aria-label="Xóa đánh giá"><Trash2 size={18}/></button></div></div><p className="mt-4 rounded-xl bg-slate-50 p-4 text-slate-700">{review.comment || 'Không có nhận xét.'}</p></article>)}</div> : <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Chưa có đánh giá nào.</div>}</div>
  </div>
}
