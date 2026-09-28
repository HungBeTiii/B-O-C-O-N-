export function LoadingBlock({ text = 'Đang tải dữ liệu...' }: { text?: string }) {
  return <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
    {text}
  </div>
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
    <div className="font-black">Có lỗi xảy ra</div>
    <div className="mt-1 text-sm">{message}</div>
    {onRetry && <button onClick={onRetry} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Thử lại</button>}
  </div>
}

export function EmptyBlock({ title, text }: { title: string; text?: string }) {
  return <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
    <div className="text-lg font-black">{title}</div>
    {text && <div className="mt-1 text-sm text-slate-500">{text}</div>}
  </div>
}
