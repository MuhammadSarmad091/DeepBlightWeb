import { useEffect, useState } from 'react'
import { Upload, ImageIcon, ScanSearch, BarChart3, CheckCircle2, Bug, Leaf } from 'lucide-react'

const STEP_MS = 720

const LEAF_STEPS = [
  { key: 'upload', label: 'Uploading image to the server', Icon: Upload },
  { key: 'prep', label: 'Preparing image for the model', Icon: ImageIcon },
  { key: 'infer', label: 'Running leaf disease model', Icon: Leaf },
  { key: 'scores', label: 'Computing class probabilities', Icon: BarChart3 },
  { key: 'done', label: 'Assembling your diagnosis', Icon: CheckCircle2 },
]

const PEST_STEPS = [
  { key: 'upload', label: 'Uploading image to the server', Icon: Upload },
  { key: 'prep', label: 'Preparing image for detection', Icon: ImageIcon },
  { key: 'infer', label: 'Running insect & pest classifier', Icon: Bug },
  { key: 'scores', label: 'Ranking species likelihoods', Icon: BarChart3 },
  { key: 'done', label: 'Finalizing detection summary', Icon: CheckCircle2 },
]

export function AnalysisProgress({ mode }) {
  const steps = mode === 'pest' ? PEST_STEPS : LEAF_STEPS
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
    const id = window.setInterval(() => {
      setIndex((i) => Math.min(i + 1, steps.length - 1))
    }, STEP_MS)
    return () => window.clearInterval(id)
  }, [mode, steps.length])

  return (
    <div className="analysis-progress" role="status" aria-live="polite" aria-label="Analysis in progress">
      <div className="analysis-progress__header">
        <span className="analysis-progress__pulse" aria-hidden />
        <ScanSearch size={20} strokeWidth={2} className="analysis-progress__header-icon" aria-hidden />
        <span className="analysis-progress__title">Analysis in progress</span>
      </div>
      <p className="analysis-progress__hint">This can take a few seconds depending on image size and server load.</p>
      <ol className="analysis-progress__steps">
        {steps.map((s, i) => {
          const { Icon } = s
          const done = i < index
          const active = i === index
          return (
            <li key={s.key} className={`analysis-step ${done ? 'analysis-step--done' : ''} ${active ? 'analysis-step--active' : ''}`}>
              <span className="analysis-step__dot" aria-hidden>
                {done ? <CheckCircle2 size={16} strokeWidth={2.5} /> : active ? <span className="analysis-step__spinner" /> : <span className="analysis-step__idle" />}
              </span>
              <Icon size={18} strokeWidth={2} className="analysis-step__icon" aria-hidden />
              <span className="analysis-step__label">{s.label}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
