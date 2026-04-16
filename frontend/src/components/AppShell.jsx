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
      <div className="auth-decoration" aria-hidden>
        <div className="auth-deco-content">
          <svg className="auth-deco-leaf" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 20C60 20 20 60 20 120c0 30 10 50 30 60 10-40 30-70 60-90s60-30 70-40c-10-20-40-30-80-30z" fill="rgba(62,207,142,0.12)" stroke="rgba(62,207,142,0.35)" strokeWidth="1.5" />
            <path d="M100 20c10 30 20 70 10 110" stroke="rgba(62,207,142,0.3)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M100 55c-15 12-28 28-38 50" stroke="rgba(62,207,142,0.2)" strokeWidth="1" strokeLinecap="round" />
            <path d="M105 80c15-8 32-14 50-16" stroke="rgba(62,207,142,0.2)" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <h2 className="auth-deco-title">DeepBlight</h2>
          <p className="auth-deco-sub">AI-powered potato crop health monitoring. Detect leaf diseases, classify pests, and plan with real-time weather data.</p>
          <div className="auth-deco-features">
            <span>Leaf disease detection</span>
            <span>Pest classification</span>
            <span>Weather insights</span>
            <span>Plant catalogue</span>
          </div>
        </div>
      </div>
      <div className="auth-panel">{children}</div>
    </div>
  )
}
