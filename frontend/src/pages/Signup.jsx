import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button, Input, Card, Alert } from '../components/ui'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  const { register, verify } = useAuth()

  const [step, setStep] = useState('form')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  function validateForm() {
    const e = {}
    if (!username.trim()) e.username = 'Username is required.'
    const em = email.trim().toLowerCase()
    if (!em) e.email = 'Email is required.'
    else if (!emailRe.test(em)) e.email = 'Enter a valid email address.'
    if (!password) e.password = 'Password is required.'
    else if (password.length < 6) e.password = 'Use at least 6 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateCode() {
    const e = {}
    const c = code.replace(/\D/g, '')
    if (c.length !== 6) e.code = 'Enter the 6-digit code from your email.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleRegister(ev) {
    ev.preventDefault()
    setSubmitError('')
    setInfo('')
    if (!validateForm()) return
    setLoading(true)
    const r = await register(username, email, password)
    setLoading(false)
    if (!r.ok) {
      setSubmitError(r.errorMessage || 'Could not start registration.')
      return
    }
    setInfo('We sent a 6-digit code to your inbox. It expires in one hour.')
    setStep('verify')
    setCode('')
  }

  async function handleVerify(ev) {
    ev.preventDefault()
    setSubmitError('')
    setInfo('')
    if (!validateCode()) return
    setLoading(true)
    const r = await verify(email, code)
    setLoading(false)
    if (!r.ok) {
      setSubmitError(r.errorMessage || 'Verification failed.')
      return
    }
    setStep('done')
    setInfo('Your email is verified. You can sign in now.')
  }

  if (step === 'done') {
    return (
      <Card className="auth-card" title="You are all set">
        <div className="auth-logo" aria-hidden>
          <Mail size={36} strokeWidth={1.5} />
        </div>
        <Alert type="success">{info}</Alert>
        <Link className="btn btn-primary btn-block" to="/login">
          Go to sign in
        </Link>
      </Card>
    )
  }

  if (step === 'verify') {
    return (
      <Card className="auth-card" title="Verify your email">
        <p className="auth-lead">Enter the code we sent to <strong>{email.trim().toLowerCase()}</strong>.</p>
        {info && <Alert type="info">{info}</Alert>}
        {submitError && (
          <Alert type="error" onDismiss={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}
        <form className="stack" onSubmit={handleVerify} noValidate>
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            label="Verification code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            error={errors.code}
          />
          <Button type="submit" className="btn-block" loading={loading}>
            Verify and finish
          </Button>
          <Button type="button" variant="ghost" className="btn-block" onClick={() => setStep('form')}>
            Back
          </Button>
        </form>
      </Card>
    )
  }

  return (
    <Card className="auth-card" title="Create an account">
      <div className="auth-logo" aria-hidden>
        <Leaf size={36} strokeWidth={1.5} />
      </div>
      <p className="auth-lead">We will email you a code to confirm your address before you can sign in.</p>

      {submitError && (
        <Alert type="error" onDismiss={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <form className="stack" onSubmit={handleRegister} noValidate>
        <Input name="username" autoComplete="username" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
        <Input name="email" type="email" autoComplete="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          label="Password"
          hint="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" className="btn-block" loading={loading}>
          Send verification code
        </Button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </Card>
  )
}
