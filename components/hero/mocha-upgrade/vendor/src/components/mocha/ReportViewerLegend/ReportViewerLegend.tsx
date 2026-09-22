import { useState } from 'react'
import type { ReportViewerLegendItem } from '../../../data/mochaFlow'
import './ReportViewerLegend.css'

type ReportViewerLegendProps = {
  intro?: string
  items: ReportViewerLegendItem[]
  footnote?: string
}

export function ReportViewerLegend({
  intro,
  items,
  footnote,
}: ReportViewerLegendProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="report-viewer-legend">
      {intro ? <p className="report-viewer-legend-intro">{intro}</p> : null}
      <ul className="report-viewer-legend-list">
        {items.map((item) => {
          const selected = selectedId === item.id
          return (
            <li key={item.id} className="report-viewer-legend-row">
              <div className="report-viewer-legend-main">
                <p className="report-viewer-legend-title">{item.title}</p>
                <span className="report-viewer-legend-rule" aria-hidden="true" />
                <button
                  type="button"
                  className={[
                    'report-viewer-chip',
                    `report-viewer-chip-${item.tone}`,
                    selected ? 'report-viewer-chip-selected' : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={item.label}
                  aria-pressed={selected}
                  onClick={() =>
                    setSelectedId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                >
                  <span className="report-viewer-chip-swatch" />
                </button>
              </div>
              {item.detail ? (
                <p className="report-viewer-legend-detail">{item.detail}</p>
              ) : null}
            </li>
          )
        })}
      </ul>
      {footnote ? (
        <p className="report-viewer-legend-footnote">{footnote}</p>
      ) : null}
    </div>
  )
}
