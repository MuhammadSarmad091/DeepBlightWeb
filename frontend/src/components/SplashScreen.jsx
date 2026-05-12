import { useEffect, useMemo, useState } from 'react'
import { Leaf } from 'lucide-react'

const MIN_VISIBLE_MS = 1350
const EXIT_MS = 480

function getSplashDurations() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return { min: MIN_VISIBLE_MS, exit: EXIT_MS }
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { min: 280, exit: 120 }
  }
  return { min: MIN_VISIBLE_MS, exit: EXIT_MS }
}

function SplashPanel({ exiting }) {
  return (
    <div className={`splash-root ${exiting ? 'splash-root--exit' : ''}`} role="presentation">
      <div className="splash-bg" />
      <div className="splash-grid" aria-hidden />
      <div className="splash-content">
        <div className="splash-logo-ring" aria-hidden>
          <span className="splash-logo-ring__glow" />
          <span className="splash-logo-ring__orbit" />
          <div className="splash-mark">
            <span className="splash-mark__leaf" aria-hidden>
              <Leaf size={36} strokeWidth={2} />
            </span>
          </div>
        </div>
        <h1 className="splash-title">DeepBlight</h1>
        <p className="splash-tagline">Potato leaf &amp; pest intelligence</p>
        <div className="splash-badges" aria-hidden>
          <span>Disease screening</span>
          <span>Pest ID</span>
          <span>Field-ready</span>
        </div>
        <div className="splash-bar" aria-hidden>
          <div className="splash-bar__fill" />
        </div>
      </div>
    </div>
  )
}

/**
 * Full-load branded splash; children mount after exit animation.
 */
export function SplashGate({ children }) {
  const [phase, setPhase] = useState('show')
  const { min, exit } = useMemo(() => getSplashDurations(), [])

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('exit'), min)
    return () => window.clearTimeout(t1)
  }, [min])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const t2 = window.setTimeout(() => setPhase('done'), exit)
    return () => window.clearTimeout(t2)
  }, [phase, exit])

  if (phase === 'done') return children

  return (
    <div className="splash-gate" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading DeepBlight</span>
      <SplashPanel exiting={phase === 'exit'} />
    </div>
  )
}
