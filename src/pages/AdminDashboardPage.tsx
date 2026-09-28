import { useEffect, useState } from 'react'
import { Banknote, PackageCheck, ReceiptText, TrendingUp, Clock3 } from 'lucide-react'
import { api } from '../lib/api'
import type { Stats } from '../lib/types'
import { ErrorBox, LoadingBlock } from '../components/Ui'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.stats()
      setStats(data)
    } catch (e: any) {
      setError(e?.message || 'Không tải được thống kê')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return <div className="p-6 md:p-8">
    <h1 className="text-3xl font-black">Tổng quan kinh doanh</h1>
    <p className="mt-1 text-slate-500">Theo dõi doanh thu, giá vốn và lợi nhuận của các đơn đã hoàn thành.</p>
    <div className="mt-7">{loading ? <LoadingBlock/> : error ? <ErrorBox message={error} onRetry={() => void load()}/> : stats ? <Dashboard stats={stats}/> : null}</div>
  </div>
}

function Dashboard({ stats }: { stats: Stats }) {
  const cards = [
    { Icon: Banknote, label: 'Doanh thu', value: stats.revenue, suffix: 'đ' },
    { Icon: ReceiptText, label: 'Tổng đơn', value: stats.totalOrders, suffix: '' },
    { Icon: Clock3, label: 'Đơn đang xử lý', value: stats.pendingOrders, suffix: '' },
    { Icon: PackageCheck, label: 'Giá vốn', value: stats.cost, suffix: 'đ' },
    { Icon: TrendingUp, label: 'Lợi nhuận', value: stats.profit, suffix: 'đ' }
  ]
  const days = Array.isArray(stats.byDay) ? stats.byDay : []
  const max = Math.max(...days.map(x => Number(x.revenue || 0)), 1)
  const best = Array.isArray(stats.bestSellers) ? stats.bestSellers : []

  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ Icon, label, value, suffix }) => <div key={label} className="rounded-2xl border bg-white p-5"><div className="flex items-center justify-between"><div className="text-sm font-bold text-slate-500">{label}</div><Icon className="text-orange-500" size={20}/></div><div className="mt-3 text-2xl font-black">{Number(value || 0).toLocaleString('vi-VN')}{suffix}</div></div>)}
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-black">Doanh thu 7 ngày gần nhất</h2>
        <div className="mt-8 flex h-64 items-end gap-3">
          {days.map(day => <div key={day.date} className="flex flex-1 flex-col items-center gap-2"><div title={`${Number(day.revenue || 0).toLocaleString('vi-VN')}đ`} className="w-full rounded-t-lg bg-orange-500" style={{ height: `${Math.max(8, Number(day.revenue || 0) / max * 210)}px` }}/><span className="text-xs text-slate-500">{day.date.slice(5)}</span></div>)}
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-black">Món bán chạy</h2>{best.length ? <div className="mt-5 grid gap-4">{best.map((item, index) => <div key={item.name} className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-orange-50 font-black text-orange-600">{index + 1}</div><div className="flex-1 font-bold">{item.name}</div><div className="font-black">{item.quantity}</div></div>)}</div> : <div className="mt-5 text-sm text-slate-500">Chưa có đủ đơn hoàn thành để thống kê món bán chạy.</div>}</section>
    </div>
  </>
}
