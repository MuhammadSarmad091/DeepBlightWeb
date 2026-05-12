import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Leaf, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../api/client'
import { Card, Button, Input, Alert, Spinner } from '../components/ui'

const LS_DRAFT = 'deepblight_plants_q'

/**
 * Trefle paginates with `meta.total` and `links` (first/last/next/self). Some clients
 * expect `meta.last_page`, but that field is often absent — then `?? 1` breaks pagination.
 */
function pageFromTrefleHref(href) {
  if (!href || typeof href !== 'string') return null
  try {
    const u = new URL(href.includes('://') ? href : `https://trefle.io${href}`)
    const p = u.searchParams.get('page')
    if (p == null || p === '') return null
    const n = Number.parseInt(p, 10)
    return Number.isFinite(n) && n >= 1 ? n : null
  } catch {
    return null
  }
}

function resolveTotalPages(body, perPage) {
  const meta = body?.meta
  const links = body?.links
  if (meta && typeof meta === 'object') {
    if (typeof meta.last_page === 'number' && Number.isFinite(meta.last_page) && meta.last_page >= 1) {
      return meta.last_page
    }
    if (typeof meta.total === 'number' && Number.isFinite(meta.total) && meta.total >= 0 && perPage > 0) {
      return Math.max(1, Math.ceil(meta.total / perPage))
    }
  }
  const fromLast = typeof links?.last === 'string' ? pageFromTrefleHref(links.last) : null
  if (fromLast != null) return fromLast
  return null
}

/** Trefle often nests taxa as { name, common_name, slug, id, links }. */
function plantText(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(plantText).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    if (typeof value.common_name === 'string' && value.common_name) return value.common_name
    if (typeof value.name === 'string' && value.name) return value.name
    if (typeof value.scientific_name === 'string' && value.scientific_name) return value.scientific_name
    if (typeof value.slug === 'string' && value.slug) return value.slug
    if (typeof value.title === 'string' && value.title) return value.title
  }
  return ''
}

function trefleWebUrl(href) {
  if (!href || typeof href !== 'string') return null
  const h = href.trim()
  if (h.startsWith('http://') || h.startsWith('https://')) return h
  if (h.startsWith('/')) return `https://trefle.io${h}`
  return h
}

function PlantDetailContent({ data }) {
  const d = data || {}
  const extHref = trefleWebUrl(
    (typeof d.links?.self === 'string' && d.links.self) ||
      (typeof d.links?.plant === 'string' && d.links.plant) ||
      (typeof d.url === 'string' && d.url) ||
      ''
  )
  const subtitle = plantText(d.scientific_name) || plantText(d.name)
  const title =
    plantText(d.common_name) || plantText(d.scientific_name) || plantText(d.name) || 'Plant'

  return (
    <>
      <h2 id="plant-detail-title" className="modal-title">
        {title}
      </h2>
      {subtitle && title !== subtitle && <p className="modal-sub">{subtitle}</p>}
      {typeof d.image_url === 'string' && d.image_url && <img className="modal-img" src={d.image_url} alt="" />}
      <dl className="detail-dl">
        {plantText(d.family) && (
          <>
            <dt>Family</dt>
            <dd>{plantText(d.family)}</dd>
          </>
        )}
        {plantText(d.genus) && (
          <>
            <dt>Genus</dt>
            <dd>{plantText(d.genus)}</dd>
          </>
        )}
        {plantText(d.observations) && (
          <>
            <dt>Observations</dt>
            <dd>{plantText(d.observations)}</dd>
          </>
        )}
      </dl>
      {extHref && (
        <a className="external-link" href={extHref} target="_blank" rel="noreferrer">
          Open on Trefle
        </a>
      )}
    </>
  )
}

export default function Plants() {
  const { token } = useAuth()
  const [draft, setDraft] = useState(() => localStorage.getItem(LS_DRAFT) || '')
  const [committedSearch, setCommittedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(12)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    localStorage.setItem(LS_DRAFT, draft)
  }, [draft])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError('')
    const searchMode = committedSearch.length > 0
    const path = searchMode ? '/plants/search' : '/plants/get'
    const query = searchMode ? { q: committedSearch, page, per_page: perPage } : { page, per_page: perPage }
    const { ok, data: body, errorMessage, status } = await apiFetch(path, { token, query })
    setLoading(false)
    if (!ok) {
      if (status === 400) setError(body?.error || 'Invalid request.')
      else if (status === 504) setError('Plant database request timed out. Try again.')
      else setError(errorMessage || body?.error || 'Could not load plants.')
      setData(null)
      return
    }
    setData(body)
  }, [token, committedSearch, page, perPage])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  function submitSearch(ev) {
    ev.preventDefault()
    const t = draft.trim()
    setPage(1)
    setCommittedSearch(t.length ? t : '')
  }

  function clearSearch() {
    setDraft('')
    setPage(1)
    setCommittedSearch('')
  }

  async function openDetail(id) {
    if (!id || id < 1) return
    setDetail({ loading: true })
    setError('')
    const { ok, data: body, errorMessage, status } = await apiFetch(`/plants/${id}`, { token })
    if (!ok) {
      setDetail(null)
      if (status === 404) setError(body?.error || 'Plant not found.')
      else setError(errorMessage || 'Could not load plant details.')
      return
    }
    setDetail(body)
  }

  const plants = data?.data ?? []
  const totalPages = resolveTotalPages(data, perPage)
  const hasNextPage =
    Boolean(data?.links?.next) || (typeof totalPages === 'number' && page < totalPages)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Plant catalogue</h1>
          <p className="page-subtitle">Search and browse species via the Trefle plant database (through your API).</p>
        </div>
      </header>

      <Card>
        <form className="plants-search" onSubmit={submitSearch}>
          <Input
            label="Search plants"
            placeholder="e.g. Solanum tuberosum"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            hint="Submit with an empty field to browse all pages, or type a name to search."
          />
          <div className="plants-search-actions">
            <Button type="submit" disabled={loading}>
              <Search size={18} /> Search
            </Button>
            <Button type="button" variant="secondary" disabled={loading} onClick={clearSearch}>
              Browse all
            </Button>
          </div>
        </form>
      </Card>

      {error && !detail && <Alert type="error">{error}</Alert>}

      {loading && !data ? (
        <div className="center-pad">
          <Spinner label="Loading plants" />
        </div>
      ) : (
        <>
          <div className="plants-grid">
            {plants.map((p) => (
              <button key={p.id} type="button" className="plant-card" onClick={() => openDetail(p.id)}>
                <div className="plant-card-img">
                  {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <Leaf size={28} className="plant-card-placeholder" />}
                </div>
                <div className="plant-card-body">
                  <div className="plant-common">{p.common_name || '—'}</div>
                  <div className="plant-scientific">{p.scientific_name || '—'}</div>
                  {p.family_common_name && <div className="plant-family">{p.family_common_name}</div>}
                </div>
              </button>
            ))}
          </div>

          {!plants.length && !loading && <p className="muted center">No plants on this page. Try another search or page.</p>}

          <div className="pagination">
            <Button type="button" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={18} /> Prev
            </Button>
            <span className="pagination-info">
              Page {page}
              {typeof totalPages === 'number' ? ` of ${totalPages}` : ''}
            </span>
            <Button type="button" variant="secondary" disabled={loading || !hasNextPage} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight size={18} />
            </Button>
          </div>
        </>
      )}

      {detail && (
        <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="plant-detail-title">
          <button type="button" className="modal-scrim" onClick={() => setDetail(null)} aria-label="Close" />
          <div className="modal-sheet">
            <button type="button" className="modal-close" onClick={() => setDetail(null)} aria-label="Close">
              <X size={22} />
            </button>
            {detail.loading ? <Spinner label="Loading" /> : <PlantDetailContent data={detail.data} />}
          </div>
        </div>
      )}
    </div>
  )
}
