import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api.login({ username, password })
      localStorage.setItem('admin_token', data.token)
      const from = (location.state as any)?.from || '/admin'
      navigate(from, { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return <div className="grid min-h-screen place-items-center bg-slate-950 p-4">
    <form onSubmit={login} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      <div className="text-3xl font-black text-orange-600">mi_chotxoo</div>
      <div className="mt-1 text-slate-500">Đăng nhập quản trị</div>
      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</div>}
      <div className="mt-6 grid gap-4">
        <label className="grid gap-1 text-sm font-bold">Tên đăng nhập<input value={username} onChange={e => setUsername(e.target.value)} className="rounded-xl border p-3 font-normal" autoComplete="username"/></label>
        <label className="grid gap-1 text-sm font-bold">Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl border p-3 font-normal" autoComplete="current-password"/></label>
        <button disabled={loading} className="rounded-xl bg-orange-600 py-3 font-black text-white disabled:opacity-60">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Tài khoản demo mặc định: <b>admin / 123456</b></div>
      <a href="/" className="mt-4 block text-center text-sm font-bold text-orange-600">← Về trang khách hàng</a>
    </form>
  </div>
}
