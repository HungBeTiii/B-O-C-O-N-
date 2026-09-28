import React from 'react'

type State = { error: Error | null }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI ERROR:', error, info)
  }

  render() {
    if (this.state.error) {
      return <div className="grid min-h-screen place-items-center bg-slate-100 p-5">
        <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-8 shadow-xl">
          <div className="text-5xl">⚠️</div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Trang vừa gặp lỗi hiển thị</h1>
          <p className="mt-2 text-slate-600">Ứng dụng đã chặn lỗi để không còn hiện màn hình trắng. Bạn có thể tải lại trang hoặc quay về trang chủ.</p>
          <div className="mt-5 rounded-xl bg-red-50 p-4 font-mono text-sm text-red-700">{this.state.error.message}</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => location.reload()} className="rounded-xl bg-orange-600 px-5 py-3 font-black text-white">Tải lại trang</button>
            <button onClick={() => location.href = '/'} className="rounded-xl border px-5 py-3 font-black">Về trang khách hàng</button>
          </div>
        </div>
      </div>
    }
    return this.props.children
  }
}
