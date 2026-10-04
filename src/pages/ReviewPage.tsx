import { useState } from 'react'
import { Star } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import CustomerHeader from '../components/CustomerHeader'
import { api } from '../lib/api'

export default function ReviewPage() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({ orderCode: params.get('code') || '', phone: '', rating: 5, comment: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit() {
    if (!form.orderCode.trim() || !form.phone.trim()) return setError('Vui lòng nhập mã đơn và số điện thoại.')
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.createReview(form)
      setSuccess('Cảm ơn bạn! Đánh giá đã được ghi nhận.')
      setForm(current => ({ ...current, comment: '' }))
    } catch (e: any) {
      setError(e?.message || 'Không thể gửi đánh giá')
    } finally {
      setLoading(false)
    }
  }

  return <>
    <CustomerHeader/>
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black">Đánh giá đơn hàng</h1>
      <p className="mt-2 text-slate-500">Chỉ đơn hàng đã hoàn thành mới có thể gửi đánh giá. Mỗi đơn chỉ được đánh giá một lần.</p>
      <section className="mt-7 rounded-2xl border bg-white p-6">
        {error && <div className="mb-4 rounded-xl bg-red-50 p-4 font-semibold text-red-600">{error}</div>}
        {success && <div className="mb-4 rounded-xl bg-green-50 p-4 font-semibold text-green-700">{success}</div>}
        <div className="grid gap-4">
          <label className="grid gap-1 text-sm font-bold">Mã đơn hàng<input value={form.orderCode} onChange={e => setForm({ ...form, orderCode: e.target.value })} className="rounded-xl border p-3 font-normal" placeholder="Ví dụ: MCX-261003-1234"/></label>
          <label className="grid gap-1 text-sm font-bold">Số điện thoại đặt hàng<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9\s]/g, '') })} className="rounded-xl border p-3 font-normal" placeholder="09xxxxxxxx" inputMode="tel"/></label>
          <div><div className="text-sm font-bold">Mức đánh giá</div><div className="mt-2 flex gap-2">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} className="rounded-lg p-1 text-amber-500" aria-label={`${n} sao`}><Star size={34} fill={n <= form.rating ? 'currentColor' : 'none'}/></button>)}</div><div className="mt-1 text-sm text-slate-500">{form.rating}/5 sao</div></div>
          <label className="grid gap-1 text-sm font-bold">Nhận xét<textarea maxLength={500} value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} className="min-h-32 rounded-xl border p-3 font-normal" placeholder="Ví dụ: Món ngon, giao nhanh..."/><span className="text-right text-xs font-normal text-slate-400">{form.comment.length}/500</span></label>
          <button disabled={loading} onClick={() => void submit()} className="rounded-xl bg-orange-600 py-3 font-black text-white disabled:opacity-60">{loading ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
        </div>
      </section>
    </main>
  </>
}
