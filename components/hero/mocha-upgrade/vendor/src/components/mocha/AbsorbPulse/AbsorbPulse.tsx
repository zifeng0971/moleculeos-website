import './AbsorbPulse.css'

/** Small brand circle with a one-shot left-to-right flash before processing. */
export function AbsorbPulse() {
  return (
    <div className="absorb-pulse" role="status" aria-label="Reading">
      <span className="absorb-pulse-dot" />
    </div>
  )
}
