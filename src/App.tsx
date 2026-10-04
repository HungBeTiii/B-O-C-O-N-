import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CartProvider } from './lib/cart'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import TrackPage from './pages/TrackPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminOrderDetailPage from './pages/AdminOrderDetailPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import NotFoundPage from './pages/NotFoundPage'
import ReviewPage from './pages/ReviewPage'
import AdminAddonsPage from './pages/AdminAddonsPage'
import AdminReviewsPage from './pages/AdminReviewsPage'

export default function App() {
  return <ErrorBoundary>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/cart" element={<CartPage/>}/>
          <Route path="/checkout" element={<CheckoutPage/>}/>
          <Route path="/track" element={<TrackPage/>}/>
          <Route path="/review" element={<ReviewPage/>}/>
          <Route path="/admin/login" element={<AdminLoginPage/>}/>
          <Route path="/admin" element={<ProtectedRoute><AdminLayout/></ProtectedRoute>}>
            <Route index element={<AdminDashboardPage/>}/>
            <Route path="orders" element={<AdminOrdersPage/>}/>
            <Route path="orders/:id" element={<AdminOrderDetailPage/>}/>
            <Route path="products" element={<AdminProductsPage/>}/>
            <Route path="categories" element={<AdminCategoriesPage/>}/>
            <Route path="addons" element={<AdminAddonsPage/>}/>
            <Route path="reviews" element={<AdminReviewsPage/>}/>
          </Route>
          <Route path="/admin/*" element={<Navigate to="/admin" replace/>}/>
          <Route path="*" element={<NotFoundPage/>}/>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </ErrorBoundary>
}
