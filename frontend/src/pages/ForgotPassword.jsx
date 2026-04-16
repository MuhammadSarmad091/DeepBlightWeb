import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
import { apiFetch } from '../api/client'
import { Button, Input, Card, Alert } from '../components/ui'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendCode(ev) {
    ev.preventDefault()
    setSubmitError('')
    setInfo('')
    const e = {}
    const em = email.trim().toLowerCase()
    if (!em) e.email = 'Email is required.'
    else if (!emailRe.test(em)) e.email = 'Enter a valid email address.'
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    const { ok, data, errorMessage } = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: { email: em },
    })
    setLoading(false)
    if (!ok) {
      setSubmitError(errorMessage || data?.error || 'Could not send reset code.')
      return
    }
    setInfo(data?.message || 'If this email exists, a reset code has been sent.')
    setStep('reset')
  }

  async function handleReset(ev) {
    ev.preventDefault()
    setSubmitError('')
    setInfo('')
    const e = {}
    const c = code.replace(/\D/g, '')
    if (c.length !== 6) e.code = 'Enter the 6-digit code from your email.'
    if (!newPassword) e.newPassword = 'New password is required.'
    else if (newPassword.length < 6) e.newPassword = 'At least 6 characters.'
    if (newPassword && confirmPassword !== newPassword) e.confirmPassword = 'Passwords do not match.'
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    const { ok, data, errorMessage, status } = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), code: c, new_password: newPassword },
    })
    setLoading(false)
    if (!ok) {
      if (status === 404) setSubmitError(data?.error || 'Invalid or expired code.')
      else setSubmitError(errorMessage || data?.error || 'Reset failed.')
      return
    }
    setStep('done')
    setInfo(data?.message || 'Password reset. You can sign in now.')
  }

  if (step === 'done') {
    return (
      <Card className="auth-card" title="Password reset">
        <div className="auth-logo" aria-hidden>
          <KeyRound size={36} strokeWidth={1.5} />
        </div>
        <Alert type="success">{info}</Alert>
        <Link className="btn btn-primary btn-block" to="/login">
          Go to sign in
        </Link>
      </Card>
    )
  }

  if (step === 'reset') {
    return (
      <Card className="auth-card" title="Set new password">
        <p className="auth-lead">
          Enter the code we sent to <strong>{email.trim().toLowerCase()}</strong> and choose a new password.
        </p>
        {info && <Alert type="info">{info}</Alert>}
        {submitError && (
          <Alert type="error" onDismiss={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}
        <form className="stack" onSubmit={handleReset} noValidate>
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            label="Reset code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            error={errors.code}
          />
          <Input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            label="New password"
            hint="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.newPassword}
          />
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />
          <Button type="submit" className="btn-block" loading={loading}>
            Reset password
          </Button>
          <Button type="button" variant="ghost" className="btn-block" onClick={() => setStep('email')}>
            Back
          </Button>
        </form>
      </Card>
    )
  }

  return (
    <Card className="auth-card" title="Forgot password">
      <div className="auth-logo" aria-hidden>
        <Mail size={36} strokeWidth={1.5} />
      </div>
      <p className="auth-lead">Enter your account email and we will send a code to reset your password.</p>
      {submitError && (
        <Alert type="error" onDismiss={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}
      <form className="stack" onSubmit={handleSendCode} noValidate>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Button type="submit" className="btn-block" loading={loading}>
          Send reset code
        </Button>
      </form>
      <p className="auth-footer">
        Remember your password? <Link to="/login">Sign in</Link>
      </p>
    </Card>
  )
}
