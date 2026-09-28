import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ErrorBox, LoadingBlock } from '../components/Ui'
import { api, ApiError } from '../lib/api'
import type { Category, Product } from '../lib/types'

const initialForm = { name: '', description: '', image: '', price: 30000, costPrice: 10000, categoryId: '', status: 'available' }

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<any>(initialForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [p, c] = await Promise.all([api.products(), api.categories()])
      setProducts(Array.isArray(p) ? p : [])
      setCategories(Array.isArray(c) ? c : [])
      if (!form.categoryId && Array.isArray(c) && c[0]?._id) setForm((current: any) => ({ ...current, categoryId: c[0]._id }))
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setError(e?.message || 'Không tải được dữ liệu món ăn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const visible = useMemo(() => products.filter(p => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase())), [products, search])

  function resetForm() {
    setEditing(null)
    setForm({ ...initialForm, categoryId: categories[0]?._id || '' })
  }

  function edit(product: Product) {
    const categoryId = typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id || ''
    setEditing(product._id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      image: product.image || '',
      price: Number(product.price || 0),
      costPrice: Number(product.costPrice || 0),
      categoryId,
      status: product.status || 'available'
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save() {
    if (!form.name.trim()) return setError('Tên món không được để trống.')
    if (!form.categoryId) return setError('Vui lòng chọn danh mục.')
    if (Number(form.price) < 0 || Number(form.costPrice) < 0) return setError('Giá bán và giá vốn phải lớn hơn hoặc bằng 0.')
    setSaving(true)
    setError('')
    try {
      if (editing) await api.updateProduct(editing, form)
      else await api.createProduct(form)
      resetForm()
      await load()
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setError(e?.message || 'Không thể lưu món ăn')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa món này? Dữ liệu snapshot trong các đơn cũ vẫn được giữ nguyên.')) return
    setError('')
    try {
      await api.deleteProduct(id)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Không thể xóa món')
    }
  }

  return <div className="p-6 md:p-8">
    <h1 className="text-3xl font-black">Quản lý món ăn</h1>
    <p className="mt-1 text-slate-500">Quản lý giá bán, giá vốn, danh mục và tình trạng còn/hết món.</p>
    {error && <div className="mt-5"><ErrorBox message={error}/></div>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[430px_1fr]">
      <section className="h-fit rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-black">{editing ? 'Sửa món' : 'Thêm món mới'}</h2>{editing && <button onClick={resetForm} className="text-sm font-bold text-slate-500">Hủy sửa</button>}</div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-bold">Tên món<input className="rounded-xl border p-3 font-normal" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
          <label className="grid gap-1 text-sm font-bold">Mô tả<textarea className="min-h-20 rounded-xl border p-3 font-normal" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
          <label className="grid gap-1 text-sm font-bold">Ảnh món (URL, có thể bỏ trống)<input className="rounded-xl border p-3 font-normal" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..."/></label>
          <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-bold">Giá bán<input type="number" min="0" className="rounded-xl border p-3 font-normal" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}/></label><label className="grid gap-1 text-sm font-bold">Giá vốn<input type="number" min="0" className="rounded-xl border p-3 font-normal" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })}/></label></div>
          <label className="grid gap-1 text-sm font-bold">Danh mục<select className="rounded-xl border p-3 font-normal" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}><option value="">Chọn danh mục</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-bold">Trạng thái<select className="rounded-xl border p-3 font-normal" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="available">Còn món</option><option value="soldout">Hết món</option></select></label>
          <button disabled={saving || !categories.length} onClick={() => void save()} className="rounded-xl bg-orange-600 py-3 font-black text-white disabled:opacity-50">{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm món'}</button>
          {!categories.length && !loading && <div className="text-sm text-amber-700">Cần tạo ít nhất một danh mục trước khi thêm món.</div>}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-white p-4"><Search size={18} className="text-slate-400"/><input className="flex-1 outline-none" placeholder="Tìm món ăn..." value={search} onChange={e => setSearch(e.target.value)}/><span className="text-sm font-bold text-slate-500">{visible.length} món</span></div>
        {loading ? <LoadingBlock text="Đang tải món ăn..."/> : <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Món</th><th>Danh mục</th><th>Giá bán</th><th>Giá vốn</th><th>Trạng thái</th><th></th></tr></thead><tbody>{visible.map(product => { const cat = typeof product.categoryId === 'string' ? categories.find(c => c._id === product.categoryId)?.name : product.categoryId?.name; return <tr key={product._id} className="border-t"><td className="p-4 font-bold">{product.name}</td><td>{cat || '—'}</td><td>{Number(product.price || 0).toLocaleString('vi-VN')}đ</td><td>{Number(product.costPrice || 0).toLocaleString('vi-VN')}đ</td><td><span className={`rounded-full px-3 py-1 text-xs font-bold ${product.status === 'available' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{product.status === 'available' ? 'Còn món' : 'Hết món'}</span></td><td className="space-x-3 whitespace-nowrap"><button className="font-bold text-blue-600" onClick={() => edit(product)}>Sửa</button><button className="font-bold text-red-500" onClick={() => void remove(product._id)}>Xóa</button></td></tr> })}{!visible.length && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không có món phù hợp.</td></tr>}</tbody></table></div>}
      </section>
    </div>
  </div>
}
