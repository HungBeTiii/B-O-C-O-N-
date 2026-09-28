import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = localStorage.getItem('admin_token')
  return token ? children : <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
}
