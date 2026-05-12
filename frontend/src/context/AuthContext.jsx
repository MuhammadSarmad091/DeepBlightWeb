import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, clearUnauthorizedHandler, setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'deepblight_auth'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }
    const parsed = JSON.parse(raw)
    return {
      token: parsed.token ?? null,
      user: parsed.user ?? null,
    }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(() => {
    const s = loadStored()
    return { token: s.token, user: s.user }
  })

  const persist = useCallback((t, u) => {
    setAuth({ token: t, user: u })
    if (t && u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const login = useCallback(
    async (email, password) => {
      const emailNorm = email.trim().toLowerCase()
      if (!emailNorm || !password) {
        return { ok: false, errorMessage: 'Email and password are required.' }
      }
      const { ok, data, errorMessage, status } = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: emailNorm, password },
      })
      if (!ok) {
        if (status === 401) return { ok: false, errorMessage: data?.error || 'Invalid email or password.' }
        return { ok: false, errorMessage: errorMessage || 'Login failed.' }
      }
      const t = data?.token
      const u = data?.user
      if (!t || !u) return { ok: false, errorMessage: 'Unexpected response from server.' }
      persist(t, u)
      return { ok: true }
    },
    [persist]
  )

  const register = useCallback(async (username, email, password) => {
    const emailNorm = email.trim().toLowerCase()
    if (!username?.trim() || !emailNorm || !password) {
      return { ok: false, errorMessage: 'Username, email, and password are required.' }
    }
    if (password.length < 6) {
      return { ok: false, errorMessage: 'Password must be at least 6 characters.' }
    }
    const { ok, data, errorMessage, status } = await apiFetch('/auth/register', {
      method: 'POST',
      body: { username: username.trim(), email: emailNorm, password },
    })
    if (!ok) {
      if (status === 409) return { ok: false, errorMessage: data?.error || 'Email already registered.' }
      return { ok: false, errorMessage: errorMessage || 'Registration failed.' }
    }
    return { ok: true, email: emailNorm }
  }, [])

  const verify = useCallback(async (email, code) => {
    const emailNorm = email.trim().toLowerCase()
    const c = String(code).replace(/\D/g, '')
    if (!emailNorm || c.length !== 6) {
      return { ok: false, errorMessage: 'Email and a 6-digit code are required.' }
    }
    const { ok, data, errorMessage, status } = await apiFetch('/auth/verify', {
      method: 'POST',
      body: { email: emailNorm, code: c },
    })
    if (!ok) {
      if (status === 404) return { ok: false, errorMessage: data?.error || 'Invalid email or verification code.' }
      if (status === 409) return { ok: false, errorMessage: data?.error || 'This email was just registered.' }
      return { ok: false, errorMessage: errorMessage || 'Verification failed.' }
    }
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    persist(null, null)
  }, [persist])

  const refreshProfile = useCallback(async () => {
    if (!token) return { ok: false }
    const { ok, data } = await apiFetch('/profile', { token })
    if (!ok || !data?.user) return { ok: false }
    const u = data.user
    const normalized = {
      user_id: u.user_id ?? u._id,
      username: u.username,
      email: u.email,
      created_at: u.created_at,
      role: u.role || 'user',
    }
    persist(token, normalized)
    return { ok: true }
  }, [token, persist])

  const value = useMemo(
    () => ({
      token,
      user,
      ready: true,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === 'admin',
      login,
      logout,
      register,
      verify,
      refreshProfile,
    }),
    [token, user, login, logout, register, verify, refreshProfile]
  )

  return (
    <AuthContext.Provider value={value}>
      <UnauthorizedListener />
      {children}
    </AuthContext.Provider>
  )
}

function UnauthorizedListener() {
  const navigate = useNavigate()
  const { logout } = useContext(AuthContext)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      const pathname = window.location.pathname
      navigate('/login', {
        replace: true,
        state: { sessionExpired: true, from: pathname && pathname !== '/login' ? { pathname } : undefined },
      })
    })
    return () => clearUnauthorizedHandler()
  }, [logout, navigate])

  return null
}
