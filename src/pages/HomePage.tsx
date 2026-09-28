import { useEffect, useMemo, useState } from 'react'
import { Clock3, Flame, Plus, Search } from 'lucide-react'
import CustomerHeader from '../components/CustomerHeader'
import { ErrorBox, LoadingBlock } from '../components/Ui'
import { api } from '../lib/api'
import { useCart } from '../lib/cart'
import type { Category, Product } from '../lib/types'

function productEmoji(name: string) {
  const n = name.toLowerCase()
  if (n.includes('trà')) return '🧋'
  if (n.includes('viên')) return '🍢'
  if (n.includes('combo')) return '🔥'
  return '🍜'
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { add } = useCart()

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [p, c] = await Promise.all([api.products(), api.categories()])
      setProducts(Array.isArray(p) ? p : [])
      setCategories(Array.isArray(c) ? c : [])
    } catch (e: any) {
      setError(e?.message || 'Không tải được thực đơn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => products.filter(product => {
    const categoryId = typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id
    const matchSearch = !search.trim() || product.name.toLowerCase().includes(search.trim().toLowerCase())
    const matchCategory = category === 'all' || categoryId === category
    return matchSearch && matchCategory
  }), [products, search, category])

  return <>
    <CustomerHeader/>
    <section className="brand-gradient text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold"><Flame size={16}/>Đồ ăn nóng - làm khi có đơn</div>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">Đói là chốt.<br/>Chốt là có đồ ăn.</h1>
          <p className="mt-5 max-w-xl text-orange-50">Đặt món nhanh, chọn vị trí giao hàng trên bản đồ và theo dõi trạng thái đơn ngay trên website.</p>
          <div className="mt-6 flex items-center gap-2 text-sm font-semibold"><Clock3 size={18}/>Phục vụ chủ yếu 18:00 – 01:00</div>
        </div>
        <div className="flex items-center justify-center text-[150px] drop-shadow-2xl">🍜</div>
      </div>
    </section>

    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-3xl font-black">Thực đơn hôm nay</h2><p className="text-slate-500">Chọn món rồi thêm vào giỏ hàng.</p></div>
        <div className="relative w-full md:w-80"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm món..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-orange-400"/></div>
      </div>

      <div className="mb-7 flex flex-wrap gap-2">
        <button onClick={() => setCategory('all')} className={`rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-orange-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>Tất cả</button>
        {categories.map(c => <button key={c._id} onClick={() => setCategory(c._id)} className={`rounded-full px-4 py-2 text-sm font-bold ${category === c._id ? 'bg-orange-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>{c.name}</button>)}
      </div>

      {loading ? <LoadingBlock text="Đang tải thực đơn..."/> : error ? <ErrorBox message={error} onRetry={() => void load()}/> : filtered.length === 0 ? <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Không tìm thấy món phù hợp.</div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(product => <article key={product._id} className="food-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {product.image ? <img src={product.image} alt={product.name} className="h-44 w-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}/>: <div className="flex h-44 items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 text-7xl">{productEmoji(product.name)}</div>}
          <div className="p-5">
            <div className="mb-1 flex items-start justify-between gap-3"><div className="text-lg font-black">{product.name}</div>{product.status === 'soldout' && <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600">Hết món</span>}</div>
            <p className="min-h-10 text-sm text-slate-500">{product.description || 'Món ngon tại mi_chotxoo'}</p>
            <div className="mt-4 flex items-center justify-between gap-2"><div className="text-xl font-black text-orange-600">{Number(product.price || 0).toLocaleString('vi-VN')}đ</div><button disabled={product.status !== 'available'} onClick={() => add(product)} className="flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:bg-slate-300"><Plus size={16}/>Thêm</button></div>
          </div>
        </article>)}
      </div>}
    </main>
  </>
}
