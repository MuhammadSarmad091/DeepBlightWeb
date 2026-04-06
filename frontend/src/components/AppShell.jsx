import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ScanSearch,
  Leaf,
  BookOpen,
  CloudSun,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/detect', label: 'Detection', icon: ScanSearch },
  { to: '/plants', label: 'Plant catalogue', icon: BookOpen },
  { to: '/weather', label: 'Weather', icon: CloudSun },
  { to: '/profile', label: 'Profile', icon: User },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon" aria-hidden>
            <Leaf size={22} strokeWidth={2} />
          </span>
          <div>
            <div className="brand-name">DeepBlight</div>
            <div className="brand-tag">Crop health intelligence</div>
          </div>
          <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {nav.map((item) => {
            const NavIcon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`} onClick={() => setOpen(false)}>
                <NavIcon size={20} strokeWidth={1.75} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user?.username || 'User'}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
          <button type="button" className="nav-item nav-logout" onClick={handleLogout}>
            <LogOut size={20} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      {open && <button type="button" className="sidebar-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <div className="main-area">
        <header className="top-bar">
          <button type="button" className="menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="top-bar-spacer" />
        </header>
        <main className="page-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-decoration" aria-hidden />
      <div className="auth-panel">{children}</div>
    </div>
  )
}
