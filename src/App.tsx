import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Hero } from './pages/Hero'
import { Products } from './pages/Products'
import { Checkout } from './pages/Checkout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyEmail } from './pages/VerifyEmail'
import { Account } from './pages/Account'

// Import test email function for console testing
import './lib/testEmail'
import { 
  AdminLayout, 
  Dashboard, 
  Ingredients, 
  Recipes, 
  Products as AdminProducts,
  Calculator, 
  Production,
  Notifications,
  AdminLogin
} from './admin'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Store Routes */}
            <Route path="/" element={<Hero />} />
            <Route path="/products" element={<Products />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/account" element={<Account />} />
            
            {/* Admin Login (public) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="ingredients" element={<Ingredients />} />
              <Route path="recipes" element={<Recipes />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="calculator" element={<Calculator />} />
              <Route path="production" element={<Production />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App



