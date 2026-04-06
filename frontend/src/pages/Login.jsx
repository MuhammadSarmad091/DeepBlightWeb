import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button, Input, Card, Alert } from '../components/ui'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const sessionExpired = Boolean(location.state?.sessionExpired)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    const em = email.trim().toLowerCase()
    if (!em) e.email = 'Email is required.'
    else if (!emailRe.test(em)) e.email = 'Enter a valid email address.'
    if (!password) e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setSubmitError('')
    if (!validate()) return
    setLoading(true)
    const r = await login(email, password)
    setLoading(false)
    if (!r.ok) {
      setSubmitError(r.errorMessage || 'Login failed.')
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <Card className="auth-card" title="Welcome back">
      <div className="auth-logo" aria-hidden>
        <Leaf size={36} strokeWidth={1.5} />
      </div>
      <p className="auth-lead">Sign in to manage scans, catalogue, and weather insights.</p>

      {sessionExpired && (
        <Alert type="info">Your session expired or is no longer valid. Please sign in again.</Alert>
      )}

      {submitError && (
        <Alert type="error" onDismiss={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <form className="stack" onSubmit={handleSubmit} noValidate>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" className="btn-block" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="auth-footer">
        No account? <Link to="/signup">Create one</Link>
      </p>
    </Card>
  )
}
