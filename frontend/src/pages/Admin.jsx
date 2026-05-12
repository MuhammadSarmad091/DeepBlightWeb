import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { Users, Leaf, Bug, Activity, ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import { Card, Alert, Spinner, Button } from '../components/ui'

function mergeSignupSeries(scansByDay, signupsByDay) {
  const map = new Map(signupsByDay.map((r) => [r.date, r.count]))
  return scansByDay.map((row) => ({
    ...row,
    signups: map.get(row.date) ?? 0,
  }))
}

const axisTickProps = { fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }

/** Recharts default tooltip uses poor contrast on dark UI; this matches app tokens. */
function AdminChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="admin-chart-tooltip">
      {label != null && label !== '' && <div className="admin-chart-tooltip__label">{String(label)}</div>}
      <ul className="admin-chart-tooltip__list">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="admin-chart-tooltip__row">
            <span className="admin-chart-tooltip__dot" style={{ background: p.color || p.payload?.fill || 'var(--accent)' }} aria-hidden />
            <span className="admin-chart-tooltip__name">{p.name}</span>
            <span className="admin-chart-tooltip__value">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const tooltipCursorLine = {
  stroke: 'rgba(180, 220, 190, 0.35)',
  strokeWidth: 1,
  strokeDasharray: '4 6',
}

const legendProps = {
  wrapperStyle: { paddingTop: 14, color: 'var(--text-muted)', fontSize: 12 },
  iconType: 'plainline',
}

export default function Admin() {
  const { token, refreshProfile } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    await refreshProfile()
    const { ok, data: body, errorMessage, status } = await apiFetch('/admin/analytics', { token, query: { days: 14 } })
    setLoading(false)
    if (!ok) {
      if (status === 403) setError('You do not have access to the admin dashboard.')
      else setError(errorMessage || body?.error || 'Could not load analytics.')
      setData(null)
      return
    }
    setData(body)
  }, [token, refreshProfile])

  useEffect(() => {
    void load()
  }, [load])

  const chartData = useMemo(() => {
    if (!data?.scans_by_day) return []
    return mergeSignupSeries(data.scans_by_day, data.signups_by_day || [])
  }, [data])

  const s = data?.summary

  return (
    <div className="page admin-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Admin analytics</h1>
          <p className="page-subtitle">System-wide usage: accounts, leaf scans, and pest scans (last {data?.range_days ?? 14} days).</p>
        </div>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
          Refresh
        </Button>
      </header>

      {error && (
        <Alert type="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading && !data ? (
        <div className="center-pad">
          <Spinner label="Loading analytics" />
        </div>
      ) : (
        <>
          <div className="admin-stat-grid">
            <Card className="admin-stat-card admin-stat-card--anim">
              <div className="admin-stat-icon admin-stat-icon--users">
                <Users size={22} />
              </div>
              <div className="admin-stat-value">{s?.total_users ?? '—'}</div>
              <div className="admin-stat-label">Registered users</div>
              <div className="admin-stat-sub muted">{s?.non_admin_users ?? 0} non-admin</div>
            </Card>
            <Card className="admin-stat-card admin-stat-card--anim">
              <div className="admin-stat-icon admin-stat-icon--leaf">
                <Leaf size={22} />
              </div>
              <div className="admin-stat-value">{s?.total_leaf_scans ?? '—'}</div>
              <div className="admin-stat-label">Leaf disease scans</div>
              <div className="admin-stat-sub muted">{s?.distinct_users_leaf_scans ?? 0} users with scans</div>
            </Card>
            <Card className="admin-stat-card admin-stat-card--anim">
              <div className="admin-stat-icon admin-stat-icon--bug">
                <Bug size={22} />
              </div>
              <div className="admin-stat-value">{s?.total_insect_scans ?? '—'}</div>
              <div className="admin-stat-label">Pest scans</div>
              <div className="admin-stat-sub muted">{s?.distinct_users_insect_scans ?? 0} users with scans</div>
            </Card>
            <Card className="admin-stat-card admin-stat-card--anim">
              <div className="admin-stat-icon admin-stat-icon--total">
                <Activity size={22} />
              </div>
              <div className="admin-stat-value">{s?.total_scans ?? '—'}</div>
              <div className="admin-stat-label">All scans</div>
              <div className="admin-stat-sub muted">{s?.admin_users ?? 0} admin accounts</div>
            </Card>
          </div>

          <div className="admin-charts">
            <Card className="admin-chart-card admin-chart-card--anim" title="Activity over time">
              <p className="admin-chart-hint muted">Daily leaf vs pest scans and new sign-ups.</p>
              <div className="admin-chart-wrap admin-recharts">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={axisTickProps} tickMargin={8} stroke="var(--border)" />
                    <YAxis tick={axisTickProps} allowDecimals={false} width={40} stroke="var(--border)" />
                    <Tooltip content={<AdminChartTooltip />} cursor={tooltipCursorLine} />
                    <Legend {...legendProps} />
                    <Line
                      type="monotone"
                      dataKey="leaf"
                      name="Leaf scans"
                      stroke="var(--accent)"
                      strokeWidth={2.25}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--bg-deep)', fill: 'var(--accent)' }}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="insect"
                      name="Pest scans"
                      stroke="var(--info)"
                      strokeWidth={2.25}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--bg-deep)', fill: 'var(--info)' }}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="signups"
                      name="New users"
                      stroke="var(--warning)"
                      strokeWidth={2.25}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--bg-deep)', fill: 'var(--warning)' }}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="admin-charts-row">
              <Card className="admin-chart-card admin-chart-card--anim admin-chart-card--anim-delay-1" title="Leaf predictions (top classes)">
                <div className="admin-chart-wrap admin-chart-wrap--short admin-recharts">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data?.leaf_class_distribution || []} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={axisTickProps} allowDecimals={false} stroke="var(--border)" />
                      <YAxis
                        type="category"
                        dataKey="class"
                        width={100}
                        tick={{ ...axisTickProps, fontSize: 10 }}
                        stroke="var(--border)"
                        tickFormatter={(v) => (String(v).length > 18 ? `${String(v).slice(0, 16)}…` : v)}
                      />
                      <Tooltip content={<AdminChartTooltip />} cursor={{ fill: 'rgba(62, 207, 142, 0.08)' }} />
                      <Bar
                        dataKey="count"
                        name="Scans"
                        fill="var(--accent)"
                        radius={[0, 6, 6, 0]}
                        maxBarSize={22}
                        animationDuration={900}
                        animationEasing="ease-out"
                        animationBegin={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="admin-chart-card admin-chart-card--anim admin-chart-card--anim-delay-2" title="Pest predictions (top classes)">
                <div className="admin-chart-wrap admin-chart-wrap--short admin-recharts">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data?.insect_class_distribution || []} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={axisTickProps} allowDecimals={false} stroke="var(--border)" />
                      <YAxis
                        type="category"
                        dataKey="class"
                        width={100}
                        tick={{ ...axisTickProps, fontSize: 10 }}
                        stroke="var(--border)"
                        tickFormatter={(v) => (String(v).length > 18 ? `${String(v).slice(0, 16)}…` : v)}
                      />
                      <Tooltip content={<AdminChartTooltip />} cursor={{ fill: 'rgba(126, 184, 218, 0.1)' }} />
                      <Bar
                        dataKey="count"
                        name="Scans"
                        fill="var(--info)"
                        radius={[0, 6, 6, 0]}
                        maxBarSize={22}
                        animationDuration={900}
                        animationEasing="ease-out"
                        animationBegin={120}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>

          <Card title="Recent registrations">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent_users || []).map((u) => (
                    <tr key={u.user_id || u.email}>
                      <td>{u.username || '—'}</td>
                      <td>{u.email || '—'}</td>
                      <td>
                        <span className={u.role === 'admin' ? 'admin-badge' : ''}>{u.role || 'user'}</span>
                      </td>
                      <td className="muted">{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="admin-footnote muted">
            <ShieldAlert size={16} aria-hidden /> Default admin login is set at deploy time via{' '}
            <code className="inline-code">ADMIN_EMAIL</code> / <code className="inline-code">ADMIN_PASSWORD</code> (see backend
            seed). Change credentials in production.
          </div>
        </>
      )}
    </div>
  )
}
