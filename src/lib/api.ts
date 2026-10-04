const API = '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function authHeaders() {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path: string, options: RequestInit = {}) {
  let response: Response
  try {
    response = await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {})
      }
    })
  } catch {
    throw new ApiError('Không kết nối được máy chủ API. Hãy chạy START_PROJECT.bat hoặc npm run dev.', 0)
  }

  const text = await response.text()
  let data: any = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { message: text || 'Phản hồi không hợp lệ từ máy chủ' } }

  if (!response.ok) {
    if (response.status === 401 && path !== '/admin/login') {
      localStorage.removeItem('admin_token')
    }
    throw new ApiError(data?.message || `Lỗi HTTP ${response.status}`, response.status)
  }
  return data
}

export const api = {
  health: () => request('/health'),
  products: () => request('/products'),
  product: (id: string) => request('/products/' + encodeURIComponent(id)),
  categories: () => request('/categories'),
  addons: () => request('/addons'),
  reviews: () => request('/reviews'),
  createReview: (body: any) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  createOrder: (body: any) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  trackOrder: (id: string) => request('/orders/track/' + encodeURIComponent(id)),
  login: (body: any) => request('/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  adminOrders: () => request('/orders'),
  adminOrder: (id: string) => request('/orders/' + encodeURIComponent(id)),
  updateOrderStatus: (id: string, orderStatus: string) => request('/orders/' + encodeURIComponent(id) + '/status', { method: 'PUT', body: JSON.stringify({ orderStatus }) }),
  stats: () => request('/statistics'),
  createProduct: (body: any) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: string, body: any) => request('/products/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id: string) => request('/products/' + encodeURIComponent(id), { method: 'DELETE' }),
  createCategory: (body: any) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: any) => request('/categories/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id: string) => request('/categories/' + encodeURIComponent(id), { method: 'DELETE' }),
  createAddon: (body: any) => request('/addons', { method: 'POST', body: JSON.stringify(body) }),
  updateAddon: (id: string, body: any) => request('/addons/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(body) }),
  deleteAddon: (id: string) => request('/addons/' + encodeURIComponent(id), { method: 'DELETE' }),
  adminReviews: () => request('/admin/reviews'),
  deleteReview: (id: string) => request('/reviews/' + encodeURIComponent(id), { method: 'DELETE' })
}
