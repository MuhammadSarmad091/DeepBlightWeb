import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ScanSearch,
  Leaf,
  BookOpen,
  CloudSun,
  CircleUser,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/detect', label: 'Detection', icon: ScanSearch },
  { to: '/plants', label: 'Plant catalogue', icon: BookOpen },
  { to: '/weather', label: 'Weather', icon: CloudSun },
  { to: '/profile', label: 'Profile', icon: CircleUser },
]

function linkClass(isActive) {
  return `top-nav__link ${isActive ? 'top-nav__link--active' : ''}`
}

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    function onKey(ev) {
      if (ev.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav__inner">
          <NavLink to="/" end className="top-nav__brand" onClick={() => setOpen(false)}>
            <span className="top-nav__brand-icon" aria-hidden>
              <Leaf size={22} strokeWidth={2} />
            </span>
            <span className="top-nav__brand-text">
              <span className="top-nav__brand-name">DeepBlight</span>
              <span className="top-nav__brand-tag">Crop health intelligence</span>
            </span>
          </NavLink>

          <nav
            className={`top-nav__nav ${open ? 'top-nav__nav--open' : ''}`}
            id="primary-navigation"
            aria-label="Main"
          >
            <div className="top-nav__link-row">
              {nav.map((item) => {
                const NavIcon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => linkClass(isActive)}
                    onClick={() => setOpen(false)}
                  >
                    <NavIcon size={18} strokeWidth={1.75} className="top-nav__link-icon" aria-hidden />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>

            <div className="top-nav__nav-mobile-footer">
              <div className="top-nav__mobile-user">
                <User size={18} strokeWidth={2} className="top-nav__user-icon" aria-hidden />
                <span className="top-nav__mobile-user-name">{user?.username || 'User'}</span>
              </div>
              <button type="button" className="top-nav__logout top-nav__logout--mobile" onClick={handleLogout}>
                <LogOut size={16} strokeWidth={2} aria-hidden />
                Sign out
              </button>
            </div>
          </nav>

          <div className="top-nav__end">
            <div className="top-nav__user-desk">
              <User size={18} strokeWidth={2} className="top-nav__user-icon" aria-hidden />
              <span className="top-nav__user-desk-name">{user?.username || 'User'}</span>
            </div>
            <button type="button" className="top-nav__logout top-nav__logout--desk" onClick={handleLogout}>
              <LogOut size={16} strokeWidth={2} aria-hidden />
              <span>Sign out</span>
            </button>
            <button
              type="button"
              className={`top-nav__menu-btn ${open ? 'top-nav__menu-btn--open' : ''}`}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="primary-navigation"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <button type="button" className="top-nav__scrim" aria-label="Close menu" onClick={() => setOpen(false)} />
        )}
      </header>

      <div className="main-area">
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
          <div className="auth-deco-leaf-wrap">
            <svg className="auth-deco-leaf" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M100 20C60 20 20 60 20 120c0 30 10 50 30 60 10-40 30-70 60-90s60-30 70-40c-10-20-40-30-80-30z" fill="rgba(62,207,142,0.12)" stroke="rgba(62,207,142,0.35)" strokeWidth="1.5" />
              <path d="M100 20c10 30 20 70 10 110" stroke="rgba(62,207,142,0.3)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M100 55c-15 12-28 28-38 50" stroke="rgba(62,207,142,0.2)" strokeWidth="1" strokeLinecap="round" />
              <path d="M105 80c15-8 32-14 50-16" stroke="rgba(62,207,142,0.2)" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="auth-deco-title">
            <span className="auth-deco-title__neon">DeepBlight</span>
          </h2>
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
