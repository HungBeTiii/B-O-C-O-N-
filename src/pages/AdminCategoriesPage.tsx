import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorBox, LoadingBlock } from '../components/Ui'
import { api, ApiError } from '../lib/api'
import type { Category } from '../lib/types'

export default function AdminCategoriesPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.categories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setError(e?.message || 'Không tải được danh mục')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function reset() { setEditing(null); setForm({ name: '', description: '' }) }

  async function save() {
    if (!form.name.trim()) return setError('Tên danh mục không được để trống.')
    setSaving(true)
    setError('')
    try {
      if (editing) await api.updateCategory(editing, form)
      else await api.createCategory(form)
      reset()
      await load()
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return navigate('/admin/login', { replace: true })
      setError(e?.message || 'Không thể lưu danh mục')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa danh mục này?')) return
    setError('')
    try {
      await api.deleteCategory(id)
      if (editing === id) reset()
      await load()
    } catch (e: any) {
      setError(e?.message || 'Không thể xóa danh mục')
    }
  }

  return <div className="p-6 md:p-8">
    <h1 className="text-3xl font-black">Quản lý danh mục</h1>
    <p className="mt-1 text-slate-500">Thêm, sửa và xóa các nhóm món ăn.</p>
    {error && <div className="mt-5"><ErrorBox message={error}/></div>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="h-fit rounded-2xl border bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-black">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>{editing && <button onClick={reset} className="text-sm font-bold text-slate-500">Hủy sửa</button>}</div><div className="mt-4 grid gap-3"><label className="grid gap-1 text-sm font-bold">Tên danh mục<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') void save() }} className="rounded-xl border p-3 font-normal" placeholder="Ví dụ: Món chính"/></label><label className="grid gap-1 text-sm font-bold">Mô tả<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-24 rounded-xl border p-3 font-normal" placeholder="Mô tả ngắn"/></label><button disabled={saving} onClick={() => void save()} className="rounded-xl bg-orange-600 py-3 font-black text-white disabled:opacity-60">{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}</button></div></section>
      <section>{loading ? <LoadingBlock text="Đang tải danh mục..."/> : <div className="overflow-hidden rounded-2xl border bg-white"><div className="border-b bg-slate-50 px-5 py-4 text-sm font-bold text-slate-500">Có {categories.length} danh mục</div>{categories.length ? <div className="divide-y">{categories.map(category => <div key={category._id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-black">{category.name}</div><div className="mt-1 text-sm text-slate-500">{category.description || 'Không có mô tả'}</div></div><div className="flex gap-3"><button onClick={() => { setEditing(category._id); setForm({ name: category.name, description: category.description || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="font-bold text-blue-600">Sửa</button><button onClick={() => void remove(category._id)} className="font-bold text-red-500">Xóa</button></div></div>)}</div> : <div className="p-8 text-center text-slate-500">Chưa có danh mục.</div>}</div>}</section>
    </div>
  </div>
}
