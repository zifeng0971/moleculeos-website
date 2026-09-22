import type { HitVariant } from '../../../data/mochaPanel'
import './HitBar.css'

type HitBarProps = {
  variant: HitVariant
}

export function HitBar({ variant }: HitBarProps) {
  if (variant === 'gapped') {
    return (
      <div className="hit-bar hit-bar-gapped">
        <span className="hit-bar-seg" style={{ width: 14 }} />
        <span className="hit-bar-seg hit-bar-fill" />
        <span className="hit-bar-seg" style={{ width: 28 }} />
      </div>
    )
  }

  if (variant === 'split') {
    return (
      <div className="hit-bar hit-bar-split">
        <span className="hit-bar-seg hit-bar-fill" />
        <span className="hit-bar-seg hit-bar-fill" />
      </div>
    )
  }

  return (
    <div className="hit-bar">
      <span className="hit-bar-seg hit-bar-fill" />
    </div>
  )
}
