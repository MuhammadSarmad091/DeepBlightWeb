import { forwardRef } from 'react'

export function Button({ children, variant = 'primary', className = '', disabled, loading, loadingLabel, type = 'button', ...rest }) {
  const v = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }[variant] || 'btn-primary'
  const showLoading = Boolean(loading)
  const loadingContent = loadingLabel !== undefined && loadingLabel !== null ? loadingLabel : 'Working…'
  return (
    <button type={type} className={`btn ${v} ${className}`.trim()} disabled={disabled || loading} aria-busy={showLoading || undefined} {...rest}>
      {showLoading ? <span className="btn-loading">{loadingContent}</span> : children}
    </button>
  )
}

export const Input = forwardRef(function Input({ label, hint, error, id, className = '', ...rest }, ref) {
  const iid = id || rest.name
  return (
    <label className={`field ${className}`.trim()} htmlFor={iid}>
      {label && <span className="field-label">{label}</span>}
      <input ref={ref} id={iid} className={`field-input ${error ? 'field-input-error' : ''}`.trim()} aria-invalid={!!error} aria-describedby={hint || error ? `${iid}-desc` : undefined} {...rest} />
      {(hint || error) && (
        <span id={`${iid}-desc`} className={error ? 'field-error' : 'field-hint'}>
          {error || hint}
        </span>
      )}
    </label>
  )
})

export function Card({ children, className = '', title, action }) {
  return (
    <div className={`card ${className}`.trim()}>
      {(title || action) && (
        <div className="card-head">
          {title && <h2 className="card-title">{title}</h2>}
          {action}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}

export function Alert({ type = 'info', children, onDismiss }) {
  const cls = { info: 'alert-info', success: 'alert-success', error: 'alert-error', warning: 'alert-warning' }[type] || 'alert-info'
  return (
    <div className={`alert ${cls}`} role="alert">
      <span className="alert-text">{children}</span>
      {onDismiss && (
        <button type="button" className="alert-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="confirm-title">{title}</h3>}
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="spinner-wrap" role="status" aria-label={label}>
      <span className="spinner" />
    </div>
  )
}
