import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Leaf, Bug, Upload, Trash2, Save, Loader2, ImageIcon, Info, ShieldAlert, Stethoscope, X, ChevronDown, ScanLine } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch, isoLocalNoMs } from '../api/client'
import { Card, Button, Alert, ConfirmDialog } from '../components/ui'
import { AnalysisProgress } from '../components/AnalysisProgress'
import { getClassInfo } from '../data/scan-info'

const LEAF_CLASSES = ['Early_Blight', 'Healthy', 'Late_Blight', 'Leaf_Roll', 'Verticillium_Wilt']

/** Must match backend `ml_services/prediction.py` PEST_CLASS_NAMES order. */
const PEST_CLASS_NAMES = [
  'Agrotis ipsilon (Hufnagel)',
  'Amrasca devastans (Distant)',
  'Aphis gossypii Glover',
  'Bemisia tabaci (Gennadius)',
  'Brachytrypes portentosus Lichtenstein',
  'Epilachna vigintioctopunctata (Fabricius)',
  'Myzus persicae (Sulzer)',
  'Phthorimaea operculella (Zeller)',
]

const MAX_FILE_BYTES = 12 * 1024 * 1024

function formatLabel(s) {
  if (!s) return ''
  if (s === 'noninsect') return 'No insect detected'
  return String(s).replace(/_/g, ' ')
}

/** Labels for probability rows (pest / binary detector). */
function probRowLabel(mode, name) {
  if (mode === 'leaf') return formatLabel(name)
  if (name === 'insect') return 'Insect'
  if (name === 'noninsect') return 'Non-insect'
  return String(name)
}

function probabilityClassNames(mode, result, probs) {
  if (!Array.isArray(probs) || probs.length === 0) return []
  if (mode === 'leaf') return LEAF_CLASSES.slice(0, probs.length)
  if (Array.isArray(result.class_names) && result.class_names.length >= probs.length) {
    return result.class_names.slice(0, probs.length)
  }
  if (probs.length === 2) return ['insect', 'noninsect']
  return PEST_CLASS_NAMES.slice(0, probs.length)
}

function validateImageFile(file) {
  if (!file) return 'Choose an image file.'
  if (!file.type.startsWith('image/')) return 'File must be an image (JPEG, PNG, WebP, etc.).'
  if (file.size > MAX_FILE_BYTES) return 'Image must be 12 MB or smaller.'
  return null
}

/** Prefer base64 from authenticated getimages (local disk + S3 without CORS); else presigned HTTP URL. */
function historyThumbnailSrc(scan, thumbMap) {
  const ref = scan.image_ref
  if (ref && thumbMap[ref]) return thumbMap[ref]
  const u = scan.image_url
  if (typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))) return u
  return ''
}

function InfoPanel({ mode, predictedClass }) {
  const info = getClassInfo(mode, predictedClass)
  const [expanded, setExpanded] = useState(true)
  if (!info) return null

  const isLeaf = mode === 'leaf'

  return (
    <div className="info-panel">
      <button type="button" className="info-panel-toggle" onClick={() => setExpanded((v) => !v)}>
        <Info size={18} />
        <span>{isLeaf ? 'Disease Information' : 'Pest Information'}</span>
        <ChevronDown size={16} className={`info-chevron ${expanded ? 'info-chevron-open' : ''}`} />
      </button>
      {expanded && (
        <div className="info-panel-body">
          <h4 className="info-name">{info.name}</h4>
          {isLeaf && info.pathogen && info.pathogen !== 'None' && (
            <p className="info-pathogen">Pathogen: <em>{info.pathogen}</em></p>
          )}
          {!isLeaf && info.scientificName && info.scientificName !== 'N/A' && (
            <p className="info-pathogen">Scientific name: <em>{info.scientificName}</em></p>
          )}
          {isLeaf && info.severity && (
            <p className="info-severity">
              <ShieldAlert size={14} /> Severity: <strong>{info.severity}</strong>
            </p>
          )}
          <p className="info-desc">{info.description}</p>

          {isLeaf && info.symptoms?.length > 0 && info.symptoms[0] !== 'No disease symptoms detected' && (
            <div className="info-section">
              <h5>Symptoms</h5>
              <ul>{info.symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}

          {!isLeaf && info.damage?.length > 0 && (
            <div className="info-section">
              <h5>Damage</h5>
              <ul>{info.damage.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          )}

          {info.treatment?.length > 0 && (
            <div className="info-section">
              <h5><Stethoscope size={14} /> Treatment & Management</h5>
              <ul>{info.treatment.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HistoryDetailModal({ scan, mode, thumbMap, onClose }) {
  if (!scan) return null
  const thumbSrc = historyThumbnailSrc(scan, thumbMap)
  const info = getClassInfo(mode, scan.predicted_class)
  const isLeaf = mode === 'leaf'

  return (
    <div className="confirm-backdrop" onClick={onClose}>
      <div className="history-detail-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="history-detail-header">
          <h3>Scan Details</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {thumbSrc && (
          <div className="history-detail-img">
            <img src={thumbSrc} alt="" />
          </div>
        )}

        <div className="history-detail-result">
          <span className="result-class">{formatLabel(scan.predicted_class)}</span>
          <span className="result-conf">{((scan.confidence_score ?? 0) * 100).toFixed(1)}% confidence</span>
        </div>

        <div className="history-detail-meta">
          {scan.datetime && <span>Scanned: {new Date(scan.datetime).toLocaleString()}</span>}
        </div>

        {info && (
          <div className="history-detail-info">
            <h4 className="info-name">{info.name}</h4>
            {isLeaf && info.pathogen && info.pathogen !== 'None' && (
              <p className="info-pathogen">Pathogen: <em>{info.pathogen}</em></p>
            )}
            {!isLeaf && info.scientificName && info.scientificName !== 'N/A' && (
              <p className="info-pathogen">Scientific name: <em>{info.scientificName}</em></p>
            )}
            {isLeaf && info.severity && (
              <p className="info-severity"><ShieldAlert size={14} /> Severity: <strong>{info.severity}</strong></p>
            )}
            <p className="info-desc">{info.description}</p>

            {isLeaf && info.symptoms?.length > 0 && info.symptoms[0] !== 'No disease symptoms detected' && (
              <div className="info-section">
                <h5>Symptoms</h5>
                <ul>{info.symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {!isLeaf && info.damage?.length > 0 && (
              <div className="info-section">
                <h5>Damage</h5>
                <ul>{info.damage.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
            {info.treatment?.length > 0 && (
              <div className="info-section">
                <h5><Stethoscope size={14} /> Treatment & Management</h5>
                <ul>{info.treatment.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Detection() {
  const { token, user } = useAuth()
  const userId = user?.user_id
  const fileInputRef = useRef(null)
  const location = useLocation()

  const [mode, setMode] = useState(() => {
    const s = location.state?.mode
    return s === 'pest' ? 'pest' : 'leaf'
  })
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
  const [thumbMap, setThumbMap] = useState({})
  const [historyError, setHistoryError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleteAlert, setDeleteAlert] = useState('')
  const [selectedScan, setSelectedScan] = useState(null)

  const basePath = mode === 'leaf' ? '/leafscan' : '/insectscan'

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    setThumbMap({})
    const { ok, data, errorMessage } = await apiFetch(`${basePath}/getall`, { token })
    if (!ok) {
      setHistoryLoading(false)
      setHistoryError(errorMessage || 'Could not load history.')
      setHistory([])
      return
    }
    const scans = data?.scans ?? []
    setHistory(scans)

    const paths = [...new Set(scans.map((s) => s.image_ref).filter(Boolean))]
    if (paths.length) {
      const imgRes = await apiFetch(`${basePath}/getimages`, {
        method: 'POST',
        token,
        body: { paths },
      })
      if (imgRes.ok && Array.isArray(imgRes.data?.images)) {
        const next = {}
        for (const img of imgRes.data.images) {
          if (img.found && img.image_data && img.path != null) {
            next[img.path] = `data:image/jpeg;base64,${img.image_data}`
          }
        }
        setThumbMap(next)
      }
    }
    setHistoryLoading(false)
  }, [token, basePath])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function resetFileInput() {
    const el = fileInputRef.current
    if (el) el.value = ''
  }

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
      resetFileInput()
      return
    }
    const err = validateImageFile(f)
    setFileError(err || '')
    setFile(err ? null : f)
    setPreview(err ? null : URL.createObjectURL(f))
    // Allow choosing the same file again (browser skips change if value unchanged)
    resetFileInput()
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    setFileError('')
    setResult(null)
    setAnalyzeError('')
    setSaveMessage('')
    setSaveError('')
    resetFileInput()
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
    setConfirmDeleteId(null)
    setDeletingId(scanId)
    setDeleteAlert('')
    const { ok, data, errorMessage, status } = await apiFetch(`${basePath}/delete`, {
      method: 'DELETE',
      token,
      body: { scan_id: scanId },
    })
    setDeletingId(null)
    if (!ok) {
      if (status === 404) setDeleteAlert(data?.error || 'Scan not found.')
      else setDeleteAlert(errorMessage || 'Delete failed.')
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
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
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
            <Button
              onClick={analyze}
              disabled={!file || analyzing}
              loading={analyzing}
              loadingLabel={
                <span className="btn-loading-inline">
                  <Loader2 className="spin" size={18} aria-hidden />
                  Analyzing…
                </span>
              }
            >
              <ScanLine size={18} aria-hidden />
              Run analysis
            </Button>
          </div>

          {analyzing && <AnalysisProgress mode={mode} />}

          {analyzeError && <Alert type="error">{analyzeError}</Alert>}

          {result && !analyzeError && (
            <div className="result-block">
              <h3 className="result-heading">Result</h3>
              <div className="result-main">
                <span className="result-class">{formatLabel(result.predicted_class)}</span>
                <span className="result-conf">{((result.confidence_score ?? 0) * 100).toFixed(1)}% confidence</span>
              </div>
              {Array.isArray(probs) && probs.length > 0 && (
                <div className="prob-list">
                  {probabilityClassNames(mode, result, probs).map((name, i) => (
                    <div key={`${name}-${i}`} className="prob-row">
                      <span className="prob-name" title={typeof name === 'string' ? name : ''}>
                        {probRowLabel(mode, name)}
                      </span>
                      <div className="prob-bar-wrap">
                        <div className="prob-bar" style={{ width: `${Math.min(100, (probs[i] ?? 0) * 100)}%` }} />
                      </div>
                      <span className="prob-val">{((probs[i] ?? 0) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
              <InfoPanel mode={mode} predictedClass={result.predicted_class} />

              <div className="btn-row">
                <Button
                  variant="secondary"
                  onClick={saveScan}
                  disabled={saving}
                  loading={saving}
                  loadingLabel={
                    <span className="btn-loading-inline">
                      <Loader2 className="spin" size={18} aria-hidden />
                      Saving…
                    </span>
                  }
                >
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
            {history.map((s) => {
              const thumbSrc = historyThumbnailSrc(s, thumbMap)
              return (
              <li key={s.scan_id} className="history-item" role="button" tabIndex={0} onClick={() => setSelectedScan(s)} onKeyDown={(e) => e.key === 'Enter' && setSelectedScan(s)}>
                <div className="history-thumb">
                  {thumbSrc ? <img src={thumbSrc} alt="" /> : <div className="history-thumb-fallback" />}
                </div>
                <div className="history-body">
                  <div className="history-class">{formatLabel(s.predicted_class)}</div>
                  <div className="history-meta">
                    {(s.confidence_score * 100).toFixed(1)}% · {s.datetime ? new Date(s.datetime).toLocaleString() : ''}
                  </div>
                  {!s.image_exists && <div className="history-warn">Image missing on server</div>}
                </div>
                <button type="button" className="icon-btn danger" disabled={deletingId === s.scan_id} onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.scan_id) }} aria-label="Delete scan">
                  {deletingId === s.scan_id ? <Loader2 className="spin" size={18} /> : <Trash2 size={18} />}
                </button>
              </li>
              )
            })}
          </ul>
        </Card>
      </div>

      {deleteAlert && <Alert type="error" onDismiss={() => setDeleteAlert('')}>{deleteAlert}</Alert>}

      <ConfirmDialog
        open={confirmDeleteId != null}
        title="Delete scan"
        message="Are you sure you want to delete this scan? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteScan(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <HistoryDetailModal
        scan={selectedScan}
        mode={mode}
        thumbMap={thumbMap}
        onClose={() => setSelectedScan(null)}
      />
    </div>
  )
}
