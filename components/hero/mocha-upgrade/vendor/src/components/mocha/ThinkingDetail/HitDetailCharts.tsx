import type { DetailChart } from '../../../data/mochaFlow'
import './HitDetailCharts.css'

type HitDetailChartsProps = {
  charts: DetailChart[]
}

const STACK_COLORS = ['var(--ct-hit)', 'var(--ct-brand-default)', 'var(--ct-line-h2)']

export function HitDetailCharts({ charts }: HitDetailChartsProps) {
  return (
    <div className="hit-charts">
      {charts.map((chart) => {
        if (chart.type === 'bars') {
          const floor = chart.min ?? 0
          const peak = Math.max(...chart.items.map((item) => item.value), floor + 1)
          return (
            <section key={chart.title} className="hit-chart">
              <p className="hit-chart-title">{chart.title}</p>
              <div className="hit-chart-bars">
                {chart.items.map((item) => {
                  const width = ((item.value - floor) / (peak - floor)) * 100
                  return (
                    <div key={item.label} className="hit-chart-bar-row">
                      <span className="hit-chart-bar-label">{item.label}</span>
                      <div className="hit-chart-bar-track">
                        <span
                          className={
                            item.current
                              ? 'hit-chart-bar-fill hit-chart-bar-fill-current'
                              : 'hit-chart-bar-fill'
                          }
                          style={{ width: `${Math.max(width, 4)}%` }}
                        />
                      </div>
                      <span className="hit-chart-bar-value">
                        {item.value}
                        {chart.unit ?? ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        }

        if (chart.type === 'alignment') {
          return (
            <section key={chart.title} className="hit-chart">
              <p className="hit-chart-title">{chart.title}</p>
              <div className="hit-chart-align-track" aria-hidden>
                {chart.segments.map((segment) => {
                  const width =
                    ((segment.end - segment.start + 1) / chart.length) * 100
                  return (
                    <span
                      key={`${segment.kind}-${segment.start}`}
                      className={
                        segment.kind === 'match'
                          ? 'hit-chart-align-seg hit-chart-align-match'
                          : 'hit-chart-align-seg hit-chart-align-gap'
                      }
                      style={{ width: `${width}%` }}
                    />
                  )
                })}
              </div>
              <div className="hit-chart-align-scale">
                <span>1</span>
                <span>{chart.length}</span>
              </div>
              <ul className="hit-chart-legend">
                {chart.segments
                  .filter((segment) => segment.kind === 'match')
                  .map((segment) => (
                    <li key={`${segment.start}-${segment.end}`}>
                      Match {segment.start}–{segment.end}
                    </li>
                  ))}
              </ul>
            </section>
          )
        }

        const total = chart.items.reduce((sum, item) => sum + item.value, 0)
        return (
          <section key={chart.title} className="hit-chart">
            <p className="hit-chart-title">{chart.title}</p>
            <div className="hit-chart-stack" aria-hidden>
              {chart.items.map((item, index) => (
                <span
                  key={item.label}
                  className="hit-chart-stack-seg"
                  style={{
                    width: `${(item.value / total) * 100}%`,
                    background: STACK_COLORS[index % STACK_COLORS.length],
                  }}
                />
              ))}
            </div>
            <ul className="hit-chart-legend">
              {chart.items.map((item, index) => (
                <li key={item.label}>
                  <span
                    className="hit-chart-swatch"
                    style={{
                      background: STACK_COLORS[index % STACK_COLORS.length],
                    }}
                  />
                  {item.label} · {item.value}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
