import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Bug, ScanLine, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import { Card, Alert, Spinner } from '../components/ui'

export default function Dashboard() {
  const { token, user, refreshProfile } = useAuth()
  const [leafTotal, setLeafTotal] = useState(null)
  const [insectTotal, setInsectTotal] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      const [leafRes, insectRes] = await Promise.all([
        apiFetch('/leafscan/getall', { token }),
        apiFetch('/insectscan/getall', { token }),
      ])
      if (cancelled) return
      if (!leafRes.ok) {
        setError(leafRes.errorMessage || 'Could not load leaf scans.')
        setLeafTotal(0)
      } else {
        setLeafTotal(leafRes.data?.total_scans ?? 0)
      }
      if (!insectRes.ok) {
        setError((e) => e || insectRes.errorMessage || 'Could not load pest scans.')
        setInsectTotal(0)
      } else {
        setInsectTotal(insectRes.data?.total_scans ?? 0)
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Hello, {user?.username || 'there'}</h1>
          <p className="page-subtitle">Monitor potato leaf health and pests from one place.</p>
        </div>
      </header>

      {error && (
        <Alert type="warning" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="hero-banner">
        <Sparkles size={22} strokeWidth={1.75} aria-hidden />
        <div>
          <strong>DeepBlight</strong> combines disease screening and insect classification so you can act early in the field.
        </div>
      </div>

      {loading ? (
        <div className="center-pad">
          <Spinner label="Loading dashboard" />
        </div>
      ) : (
        <div className="stats-grid">
          <Card className="stat-card">
            <div className="stat-icon stat-icon-leaf">
              <Leaf size={22} />
            </div>
            <div className="stat-value">{leafTotal ?? '—'}</div>
            <div className="stat-label">Leaf scans</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-icon stat-icon-bug">
              <Bug size={22} />
            </div>
            <div className="stat-value">{insectTotal ?? '—'}</div>
            <div className="stat-label">Pest scans</div>
          </Card>
        </div>
      )}

      <h2 className="section-title">Quick actions</h2>
      <div className="action-grid">
        <Link to="/detect" className="action-tile">
          <ScanLine size={24} strokeWidth={1.75} />
          <div>
            <div className="action-tile-title">Run detection</div>
            <div className="action-tile-desc">Upload a leaf or insect image and review AI results.</div>
          </div>
          <ArrowRight size={18} className="action-tile-arrow" />
        </Link>
        <Link to="/plants" className="action-tile">
          <Leaf size={24} strokeWidth={1.75} />
          <div>
            <div className="action-tile-title">Plant catalogue</div>
            <div className="action-tile-desc">Browse species data from the Trefle plant database.</div>
          </div>
          <ArrowRight size={18} className="action-tile-arrow" />
        </Link>
        <Link to="/weather" className="action-tile">
          <Sparkles size={24} strokeWidth={1.75} />
          <div>
            <div className="action-tile-title">Weather outlook</div>
            <div className="action-tile-desc">Plan irrigation and protection with forecasts.</div>
          </div>
          <ArrowRight size={18} className="action-tile-arrow" />
        </Link>
      </div>
    </div>
  )
}
