import { Icon } from '../Icon/Icon'
import iconClose from '../../../assets/mocha/icon-close.svg'
import iconCopy from '../../../assets/mocha/icon-copy.svg'
import iconDownload from '../../../assets/mocha/icon-download.svg'
import type { MosTaskDetailData, SearchHit, UnfoldStep } from '../../../data/mochaFlow'
import { StepDetailControls } from './StepDetailControls'
import { HitDetailCharts } from './HitDetailCharts'
import './ThinkingDetail.css'

type ThinkingDetailProps = {
  step: UnfoldStep
  onClose: () => void
}

function CodeBlock({
  code,
  label = 'Copy code',
}: {
  code: string
  label?: string
}) {
  return (
    <div className="thinking-detail-code-block">
      <div className="thinking-detail-rule" />
      <div className="thinking-detail-code-toolbar">
        <button
          type="button"
          className="thinking-detail-copy-btn"
          aria-label={label}
          onClick={() => {
            void navigator.clipboard.writeText(code)
          }}
        >
          <Icon src={iconCopy} width={14} height={14} />
        </button>
      </div>
      <pre className="thinking-detail-code">{code}</pre>
    </div>
  )
}

function SchemaDetail({ taskName, json }: { taskName: string; json: string }) {
  return (
    <div className="schema-detail">
      <p className="schema-detail-name">Task Name：{taskName}</p>
      <CodeBlock code={json} label="Copy schema" />
    </div>
  )
}

function searchHitLabel(hit: SearchHit) {
  if (hit.title.trim()) {
    return hit.title
  }
  try {
    return new URL(hit.url).hostname.replace(/^www\./, '')
  } catch {
    return hit.url
  }
}

function SearchDetail({ hits }: { hits: SearchHit[] }) {
  return (
    <div className="search-detail">
      {hits.map((hit) => (
        <article key={hit.url} className="search-hit">
          <p className="search-hit-title">{searchHitLabel(hit)}</p>
          {hit.date ? <p className="search-hit-date">{hit.date}</p> : null}
          <a
            className="search-hit-url"
            href={hit.url}
            target="_blank"
            rel="noreferrer"
          >
            {hit.url}
          </a>
          <p className="search-hit-summary">{hit.summary}</p>
        </article>
      ))}
    </div>
  )
}

function truncateSequence(sequence: string, keep = 29) {
  if (sequence.length <= keep) {
    return sequence
  }
  return `${sequence.slice(0, keep)}...`
}

function MosTaskDetail({ data }: { data: MosTaskDetailData }) {
  const rows = [
    { label: 'Task ID', value: data.taskId },
    { label: 'Task Name', value: data.taskName },
    { label: 'Task Type', value: data.taskType },
    { label: 'Description', value: data.description },
    { label: 'Task Status', value: data.taskStatus },
  ]

  return (
    <div className="mos-task-detail">
      <dl className="mos-task-meta">
        {rows.map((row) => (
          <div key={row.label} className="mos-task-meta-row">
            <dt>{row.label}:</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mos-task-section" aria-label="Data Display">
        <h4 className="mos-task-section-title">Data Display</h4>
        <div className="mos-task-section-body">
          <p className="mos-task-subtitle">Output Data</p>
          <ul className="mos-task-files">
            {data.outputs.map((file) => (
              <li key={file.name} className="mos-task-file">
                <span className="mos-task-file-name">{file.name}</span>
                <button
                  type="button"
                  className="mos-task-download"
                  aria-label={`Download ${file.name}`}
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `Mocha playground download stub\n\n${file.name}\n`,
                    )
                  }}
                >
                  <Icon src={iconDownload} width={12} height={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mos-task-section" aria-label="Input Parameters">
        <h4 className="mos-task-section-title">Input Parameters</h4>
        <div className="mos-task-section-body">
          <div className="mos-task-input">
            <span className="mos-task-input-kind">{data.input.kind}</span>
            <span className="mos-task-input-count">×{data.input.count}</span>
            <span className="mos-task-input-chain">{data.input.chain}</span>
            <span className="mos-task-input-seq">
              {truncateSequence(data.input.sequence)}
            </span>
            <span className="mos-task-input-length">
              length {data.input.length}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export function ThinkingDetail({ step, onClose }: ThinkingDetailProps) {
  const schema = step.layout === 'schema'
  const search = step.layout === 'search' || Boolean(step.links?.length)
  const mosTask = step.layout === 'mosTask' && step.mosTask
  return (
    <aside className="thinking-detail" aria-label={step.text}>
      <div className="thinking-detail-inner">
        <div className="thinking-detail-header">
          <p className="thinking-detail-title">{step.text}</p>
          <button
            type="button"
            className="thinking-detail-close"
            aria-label="Close"
            onClick={onClose}
          >
            <Icon src={iconClose} width={10} height={10} />
          </button>
        </div>
        <div className="thinking-detail-body">
          {schema ? (
            <SchemaDetail
              taskName={step.taskName ?? ''}
              json={step.detail ?? ''}
            />
          ) : mosTask ? (
            <MosTaskDetail data={mosTask} />
          ) : search && step.links?.length ? (
            <SearchDetail hits={step.links} />
          ) : (
            <>
              {step.detail ? (
                <p className="thinking-detail-copy">{step.detail}</p>
              ) : null}
              {step.code ? <CodeBlock code={step.code} /> : null}
              {step.charts?.length ? <HitDetailCharts charts={step.charts} /> : null}
              {step.controls?.length ? (
                <StepDetailControls key={step.text} controls={step.controls} />
              ) : null}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
