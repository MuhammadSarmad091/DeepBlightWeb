import { useEffect, useState } from 'react'
import { User, Calendar, Hash, Mail, KeyRound, ChevronDown } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import { Card, Button, Input, Alert, Spinner } from '../components/ui'

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

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwErrors, setPwErrors] = useState({})
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)

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

  async function handleChangePassword(ev) {
    ev.preventDefault()
    setPwMessage('')
    setPwError('')
    const e = {}
    if (!currentPw) e.currentPw = 'Current password is required.'
    if (!newPw) e.newPw = 'New password is required.'
    else if (newPw.length < 6) e.newPw = 'At least 6 characters.'
    if (newPw && confirmPw !== newPw) e.confirmPw = 'Passwords do not match.'
    setPwErrors(e)
    if (Object.keys(e).length) return

    setPwLoading(true)
    const { ok, data, errorMessage, status } = await apiFetch('/auth/change-password', {
      method: 'POST',
      token,
      body: { current_password: currentPw, new_password: newPw },
    })
    setPwLoading(false)
    if (!ok) {
      if (status === 401) setPwError(data?.error || 'Current password is incorrect.')
      else setPwError(errorMessage || data?.error || 'Could not change password.')
      return
    }
    setPwMessage(data?.message || 'Password changed successfully.')
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setPwErrors({})
  }

  const u = profileUser || user

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your account details and security settings.</p>
        </div>
      </header>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="center-pad">
          <Spinner label="Loading profile" />
        </div>
      ) : (
        <>
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
          </Card>

          <Card>
            <button type="button" className="pw-toggle" onClick={() => setPwOpen((v) => !v)}>
              <KeyRound size={18} />
              <span>Change password</span>
              <ChevronDown size={18} className={`pw-chevron ${pwOpen ? 'pw-chevron-open' : ''}`} />
            </button>
            {pwOpen && (
              <div className="pw-body">
                {pwMessage && <Alert type="success" onDismiss={() => setPwMessage('')}>{pwMessage}</Alert>}
                {pwError && <Alert type="error" onDismiss={() => setPwError('')}>{pwError}</Alert>}
                <form className="stack" onSubmit={handleChangePassword} noValidate>
                  <Input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    label="Current password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    error={pwErrors.currentPw}
                  />
                  <Input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    label="New password"
                    hint="At least 6 characters"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    error={pwErrors.newPw}
                  />
                  <Input
                    name="confirmNewPassword"
                    type="password"
                    autoComplete="new-password"
                    label="Confirm new password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    error={pwErrors.confirmPw}
                  />
                  <Button type="submit" loading={pwLoading}>
                    Update password
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
