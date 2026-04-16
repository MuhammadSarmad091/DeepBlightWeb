const BASE = import.meta.env.VITE_API_BASE ?? '/api'
//const BASE = import.meta.env.VITE_API_BASE ?? 'http://16.170.209.103:5000'

/** Clears session and redirects to login when an authenticated request returns 401. */
let unauthorizedHandler = null

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null
}

export function clearUnauthorizedHandler() {
  unauthorizedHandler = null
}

function getErrorMessage(data, status) {
  if (!data || typeof data !== 'object') {
    return status === 0 ? 'Network error. Check your connection.' : `Request failed (${status})`
  }
  if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
  if (data.message && typeof data.message === 'string' && data.message !== 'profile') return data.message
  if (data.details && typeof data.details === 'string') return data.details
  return `Request failed (${status})`
}

/**
 * @param {string} path - e.g. '/auth/login'
 * @param {object} options
 */
export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    token,
    isFormData = false,
    query,
  } = options

  let url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`
  if (query && typeof query === 'object') {
    const q = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
    })
    const s = q.toString()
    if (s) url += `?${s}`
  }

  const h = { ...headers }
  if (token) h.Authorization = `Bearer ${token}`
  if (!isFormData && body !== undefined && body !== null && typeof body !== 'string') {
    h['Content-Type'] = 'application/json'
  }

  let res
  try {
    res = await fetch(url, {
      method,
      headers: h,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      errorMessage: 'Network error. Is the backend running?',
    }
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  const errorMessage = res.ok ? null : getErrorMessage(data, res.status)

  if (res.status === 401 && token && unauthorizedHandler) {
    try {
      unauthorizedHandler()
    } catch {
      /* ignore */
    }
  }

  return { ok: res.ok, status: res.status, data, errorMessage }
}

export function isoLocalNoMs(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
