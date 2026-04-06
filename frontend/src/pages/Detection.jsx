import { useCallback, useEffect, useState } from 'react'
import { Leaf, Bug, Upload, Trash2, Save, Loader2, ImageIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch, isoLocalNoMs } from '../api/client'
import { Card, Button, Alert } from '../components/ui'

const LEAF_CLASSES = ['Early_Blight', 'Healthy', 'Late_Blight', 'Leaf_Roll', 'Verticillium_Wilt']
const MAX_FILE_BYTES = 12 * 1024 * 1024

function formatLabel(s) {
  if (!s) return ''
  if (s === 'noninsect') return 'No insect detected'
  return String(s).replace(/_/g, ' ')
}

function validateImageFile(file) {
  if (!file) return 'Choose an image file.'
  if (!file.type.startsWith('image/')) return 'File must be an image (JPEG, PNG, WebP, etc.).'
  if (file.size > MAX_FILE_BYTES) return 'Image must be 12 MB or smaller.'
  return null
}

export default function Detection() {
  const { token, user } = useAuth()
  const userId = user?.user_id

  const [mode, setMode] = useState('leaf')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileError, setFileError] = useState('')

  const [result, setResult] = useState(null)
  const [analyzeError, setAnalyzeError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const [history, setHistory] = useState([])
  const [historyError, setHistoryError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const basePath = mode === 'leaf' ? '/leafscan' : '/insectscan'

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    const { ok, data, errorMessage } = await apiFetch(`${basePath}/getall`, { token })
    setHistoryLoading(false)
    if (!ok) {
      setHistoryError(errorMessage || 'Could not load history.')
      setHistory([])
      return
    }
    setHistory(data?.scans ?? [])
  }, [token, basePath])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function onFileChange(e) {
    const f = e.target.files?.[0]
    setResult(null)
    setAnalyzeError('')
    setSaveMessage('')
    setSaveError('')
    if (preview) URL.revokeObjectURL(preview)
    if (!f) {
      setFile(null)
      setPreview(null)
      return
    }
    const err = validateImageFile(f)
    setFileError(err || '')
    setFile(err ? null : f)
    setPreview(err ? null : URL.createObjectURL(f))
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    setFileError('')
    setResult(null)
    setAnalyzeError('')
    setSaveMessage('')
    setSaveError('')
  }

  async function analyze() {
    setAnalyzeError('')
    setSaveMessage('')
    setSaveError('')
    if (!userId) {
      setAnalyzeError('Missing user session. Sign in again.')
      return
    }
    const err = file ? validateImageFile(file) : 'Choose an image first.'
    if (err) {
      setFileError(err)
      return
    }

    const fd = new FormData()
    fd.append('image', file)
    fd.append('userid', userId)

    setAnalyzing(true)
    const { ok, data, errorMessage, status } = await apiFetch(`${basePath}/upload`, {
      method: 'POST',
      token,
      body: fd,
      isFormData: true,
    })
    setAnalyzing(false)

    if (!ok) {
      if (status === 403) setAnalyzeError(data?.error || 'User mismatch.')
      else if (status === 400) setAnalyzeError(data?.error || 'Invalid request.')
      else if (status === 500 && data?.error === 'Leaf not detected') setAnalyzeError('No clear leaf found in this image. Try a closer photo with good lighting.')
      else if (data?.message === 'No model configured') setAnalyzeError('Disease model is not available on the server.')
      else setAnalyzeError(errorMessage || data?.error || 'Analysis failed.')
      setResult(null)
      return
    }

    setResult(data)
  }

  async function saveScan() {
    setSaveMessage('')
    setSaveError('')
    if (!userId || !file || !result?.next_scan_id) {
      setSaveError('Analyze an image first.')
      return
    }
    const predicted = result.predicted_class

    const fd = new FormData()
    fd.append('scan_id', String(result.next_scan_id))
    fd.append('datetime', isoLocalNoMs())
    fd.append('predicted_class', String(predicted))
    fd.append('confidence_score', String(result.confidence_score ?? 0))
    fd.append('image', file)

    setSaving(true)
    const { ok, data, errorMessage, status } = await apiFetch(`${basePath}/save`, {
      method: 'POST',
      token,
      body: fd,
      isFormData: true,
    })
    setSaving(false)

    if (!ok) {
      if (status === 409) setSaveError(data?.error || 'This scan ID already exists.')
      else setSaveError(errorMessage || data?.error || 'Save failed.')
      return
    }
    setSaveMessage(data?.message || 'Saved to history.')
    loadHistory()
  }

  async function deleteScan(scanId) {
    if (!window.confirm('Delete this scan from history?')) return
    setDeletingId(scanId)
    const { ok, data, errorMessage, status } = await apiFetch(`${basePath}/delete`, {
      method: 'DELETE',
      token,
      body: { scan_id: scanId },
    })
    setDeletingId(null)
    if (!ok) {
      if (status === 404) alert(data?.error || 'Scan not found.')
      else alert(errorMessage || 'Delete failed.')
      return
    }
    loadHistory()
  }

  const probs = result?.probabilities

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Detection</h1>
          <p className="page-subtitle">Analyze potato leaves for disease or classify insects and pests.</p>
        </div>
      </header>

      <div className="tabs">
        <button type="button" className={`tab ${mode === 'leaf' ? 'tab-active' : ''}`} onClick={() => { setMode('leaf'); clearFile() }}>
          <Leaf size={18} />
          Leaf disease
        </button>
        <button type="button" className={`tab ${mode === 'pest' ? 'tab-active' : ''}`} onClick={() => { setMode('pest'); clearFile() }}>
          <Bug size={18} />
          Insect / pest
        </button>
      </div>

      <div className="detect-layout">
        <Card title={mode === 'leaf' ? 'Leaf image' : 'Insect image'}>
          <div className="upload-zone">
            <label className="upload-label">
              <input type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
              <span className="upload-prompt">
                <Upload size={20} />
                Drop an image or click to browse
              </span>
              <span className="upload-hint">JPEG, PNG, WebP — max 12 MB</span>
            </label>
            {fileError && <Alert type="error">{fileError}</Alert>}
            {preview && (
              <div className="preview-wrap">
                <img src={preview} alt="Selected" className="preview-img" />
                <button type="button" className="icon-btn" onClick={clearFile} aria-label="Remove image">
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="btn-row">
            <Button onClick={analyze} disabled={!file || analyzing} loading={analyzing}>
              Run analysis
            </Button>
          </div>

          {analyzeError && <Alert type="error">{analyzeError}</Alert>}

          {result && !analyzeError && (
            <div className="result-block">
              <h3 className="result-heading">Result</h3>
              <div className="result-main">
                <span className="result-class">{formatLabel(result.predicted_class)}</span>
                <span className="result-conf">{((result.confidence_score ?? 0) * 100).toFixed(1)}% confidence</span>
              </div>
              {mode === 'leaf' && Array.isArray(probs) && probs.length > 0 && (
                <div className="prob-list">
                  {LEAF_CLASSES.map((name, i) => (
                    <div key={name} className="prob-row">
                      <span>{formatLabel(name)}</span>
                      <div className="prob-bar-wrap">
                        <div className="prob-bar" style={{ width: `${Math.min(100, (probs[i] ?? 0) * 100)}%` }} />
                      </div>
                      <span className="prob-val">{((probs[i] ?? 0) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="result-meta">Next scan ID (for saving): <code>{result.next_scan_id}</code></p>

              <div className="btn-row">
                <Button variant="secondary" onClick={saveScan} disabled={saving} loading={saving}>
                  <Save size={18} /> Save to history
                </Button>
              </div>
              {saveMessage && <Alert type="success">{saveMessage}</Alert>}
              {saveError && <Alert type="warning">{saveError}</Alert>}
            </div>
          )}
        </Card>

        <Card title="Previous scans">
          {historyLoading && (
            <p className="muted center">
              <Loader2 className="spin inline-icon" size={18} /> Loading…
            </p>
          )}
          {historyError && <Alert type="error">{historyError}</Alert>}
          {!historyLoading && !history.length && (
            <div className="empty-state">
              <ImageIcon size={32} strokeWidth={1.25} />
              <p>No scans yet. Run an analysis and save it to build history.</p>
            </div>
          )}
          <ul className="history-list">
            {history.map((s) => (
              <li key={s.scan_id} className="history-item">
                <div className="history-thumb">
                  {s.image_url ? <img src={s.image_url} alt="" /> : <div className="history-thumb-fallback" />}
                </div>
                <div className="history-body">
                  <div className="history-class">{formatLabel(s.predicted_class)}</div>
                  <div className="history-meta">
                    {(s.confidence_score * 100).toFixed(1)}% · {s.datetime ? new Date(s.datetime).toLocaleString() : ''}
                  </div>
                  {!s.image_exists && <div className="history-warn">Image missing on server</div>}
                </div>
                <button type="button" className="icon-btn danger" disabled={deletingId === s.scan_id} onClick={() => deleteScan(s.scan_id)} aria-label="Delete scan">
                  {deletingId === s.scan_id ? <Loader2 className="spin" size={18} /> : <Trash2 size={18} />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
