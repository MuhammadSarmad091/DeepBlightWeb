import { useEffect, useState } from 'react'
import { User, Calendar, Hash, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import { Card, Alert, Spinner } from '../components/ui'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function Profile() {
  const { token, user, refreshProfile } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      const { ok, data, errorMessage, status } = await apiFetch('/profile', { token })
      if (cancelled) return
      if (!ok) {
        if (status === 401) setError(errorMessage || 'Session expired. Sign in again.')
        else setError(errorMessage || 'Could not load profile.')
        setProfileUser(null)
      } else {
        setProfileUser(data?.user ?? null)
        refreshProfile()
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token, refreshProfile])

  const u = profileUser || user

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your account details from the server.</p>
        </div>
      </header>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="center-pad">
          <Spinner label="Loading profile" />
        </div>
      ) : (
        <Card title="Account">
          <div className="profile-grid">
            <div className="profile-row">
              <User size={18} className="profile-icon" aria-hidden />
              <div>
                <div className="profile-label">Username</div>
                <div className="profile-value">{u?.username ?? '—'}</div>
              </div>
            </div>
            <div className="profile-row">
              <Mail size={18} className="profile-icon" aria-hidden />
              <div>
                <div className="profile-label">Email</div>
                <div className="profile-value">{u?.email ?? '—'}</div>
              </div>
            </div>
            <div className="profile-row">
              <Hash size={18} className="profile-icon" aria-hidden />
              <div>
                <div className="profile-label">User ID</div>
                <div className="profile-value mono">{u?.user_id ?? u?._id ?? '—'}</div>
              </div>
            </div>
            <div className="profile-row">
              <Calendar size={18} className="profile-icon" aria-hidden />
              <div>
                <div className="profile-label">Member since</div>
                <div className="profile-value">{formatDate(u?.created_at)}</div>
              </div>
            </div>
          </div>
          <p className="profile-note">Updates to username or email are not available in the current API. Use the mobile app or contact your administrator if you need changes.</p>
        </Card>
      )}
    </div>
  )
}
