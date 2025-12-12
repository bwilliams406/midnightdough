import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  BookOpen, 
  Calculator, 
  ClipboardList,
  Cookie,
  ArrowLeft,
  Tag,
  Bell,
  LogOut,
  User
} from 'lucide-react'
import { subscribeToNotifications } from '../lib/storage'
import { Notification } from '../types/admin'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/ingredients', icon: Package, label: 'Ingredients', end: false },
  { to: '/admin/recipes', icon: BookOpen, label: 'Recipes', end: false },
  { to: '/admin/products', icon: Tag, label: 'Products & Pricing', end: false },
  { to: '/admin/calculator', icon: Calculator, label: 'Batch Calculator', end: false },
  { to: '/admin/production', icon: ClipboardList, label: 'Production', end: false },
]

export function AdminLayout() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    const unsub = subscribeToNotifications(setNotifications)
    return () => unsub()
  }, [])
  
  const unreadCount = notifications.filter(n => !n.isRead).length
  const criticalCount = notifications.filter(n => n.severity === 'critical' && !n.isRead).length

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-midnight text-cream flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Cookie className="text-gold" size={28} />
            <div>
              <h1 className="font-serif text-xl text-gold">Midnight Dough</h1>
              <p className="text-xs text-cream/60">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gold text-midnight font-semibold'
                        : 'text-cream/80 hover:bg-white/10 hover:text-cream'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
            
            {/* Notifications - Special item with badge */}
            <li>
              <NavLink
                to="/admin/notifications"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gold text-midnight font-semibold'
                      : 'text-cream/80 hover:bg-white/10 hover:text-cream'
                  }`
                }
              >
                <div className="relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] font-bold flex items-center justify-center rounded-full ${
                      criticalCount > 0 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span>Notifications</span>
                {criticalCount > 0 && (
                  <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {criticalCount} critical
                  </span>
                )}
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* User & Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* User Info */}
          {userProfile && (
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream truncate">{userProfile.displayName}</p>
                <p className="text-xs text-cream/50 truncate">{userProfile.email}</p>
              </div>
            </div>
          )}
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
          
          {/* Back to Store */}
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-cream/60 hover:bg-white/10 hover:text-cream transition-all"
          >
            <ArrowLeft size={20} />
            <span>Back to Store</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  )
}
