import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorBox, LoadingBlock } from '../components/Ui'
import { api, ApiError } from '../lib/api'
import type { Addon } from '../lib/types'

const initialForm = { name: '', price: 5000, costPrice: 0, status: 'available' }

export default function AdminAddonsPage() {
  const navigate = useNavigate()
  const [addons, setAddons] = useState<Addon[]>([])
  const [form, setForm] = useState<any>(initialForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.addons()
      setAddons(Array.isArray(data) ? data : [])
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setError(e?.message || 'Không tải được đồ thêm')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  function reset() { setEditing(null); setForm(initialForm) }
  function edit(addon: Addon) {
    setEditing(addon._id)
    setForm({ name: addon.name, price: Number(addon.price || 0), costPrice: Number(addon.costPrice || 0), status: addon.status })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save() {
    if (!form.name.trim()) return setError('Tên đồ thêm không được để trống.')
    if (Number(form.price) < 0 || Number(form.costPrice) < 0) return setError('Giá bán và giá vốn phải lớn hơn hoặc bằng 0.')
    setSaving(true); setError('')
    try {
      if (editing) await api.updateAddon(editing, form)
      else await api.createAddon(form)
      reset(); await load()
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setError(e?.message || 'Không thể lưu đồ thêm')
    } finally { setSaving(false) }
  }

  async function remove(id: string) {
    if (!confirm('Xóa đồ thêm này? Các đơn cũ vẫn giữ snapshot đã lưu.')) return
    setError('')
    try { await api.deleteAddon(id); if (editing === id) reset(); await load() }
    catch (e: any) { setError(e?.message || 'Không thể xóa đồ thêm') }
  }

  return <div className="p-6 md:p-8">
    <h1 className="text-3xl font-black">Quản lý đồ thêm</h1>
    <p className="mt-1 text-slate-500">Quản lý topping, giá bán, giá vốn và tình trạng còn/hết.</p>
    {error && <div className="mt-5"><ErrorBox message={error}/></div>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="h-fit rounded-2xl border bg-white p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-black">{editing ? 'Sửa đồ thêm' : 'Thêm đồ thêm'}</h2>{editing && <button onClick={reset} className="text-sm font-bold text-slate-500">Hủy sửa</button>}</div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-bold">Tên đồ thêm<input className="rounded-xl border p-3 font-normal" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Trứng ốp"/></label>
          <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-bold">Giá bán<input type="number" min="0" className="rounded-xl border p-3 font-normal" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}/></label><label className="grid gap-1 text-sm font-bold">Giá vốn<input type="number" min="0" className="rounded-xl border p-3 font-normal" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })}/></label></div>
          <label className="grid gap-1 text-sm font-bold">Trạng thái<select className="rounded-xl border p-3 font-normal" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="available">Còn</option><option value="soldout">Hết</option></select></label>
          <button disabled={saving} onClick={() => void save()} className="rounded-xl bg-orange-600 py-3 font-black text-white disabled:opacity-60">{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm đồ thêm'}</button>
        </div>
      </section>
      <section>{loading ? <LoadingBlock text="Đang tải đồ thêm..."/> : <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Đồ thêm</th><th>Giá bán</th><th>Giá vốn</th><th>Trạng thái</th><th></th></tr></thead><tbody>{addons.map(addon => <tr key={addon._id} className="border-t"><td className="p-4 font-black">{addon.name}</td><td>{Number(addon.price || 0).toLocaleString('vi-VN')}đ</td><td>{Number(addon.costPrice || 0).toLocaleString('vi-VN')}đ</td><td><span className={`rounded-full px-3 py-1 text-xs font-bold ${addon.status === 'available' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{addon.status === 'available' ? 'Còn' : 'Hết'}</span></td><td className="space-x-3 whitespace-nowrap"><button onClick={() => edit(addon)} className="font-bold text-blue-600">Sửa</button><button onClick={() => void remove(addon._id)} className="font-bold text-red-500">Xóa</button></td></tr>)}{!addons.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có đồ thêm.</td></tr>}</tbody></table></div>}</section>
    </div>
  </div>
}
