import type { ReactNode } from 'react'
import { ResultTable } from '../ResultTable/ResultTable'
import { MessageMeta } from '../MessageMeta/MessageMeta'
import { ReportAttachments } from '../ReportAttachments/ReportAttachments'
import { ReportViewerLegend } from '../ReportViewerLegend/ReportViewerLegend'
import {
  resultBlocks,
  type StepResult,
  type UnfoldStep,
} from '../../../data/mochaFlow'
import './ReportBody.css'

type ReportBodyProps = {
  result: StepResult
  visibleCount?: number
  animate?: boolean
  selectedId?: string | null
  onHitSelect?: (step: UnfoldStep | null) => void
  showMeta?: boolean
  renderSlot?: (kind: 'structure' | 'mutationTable') => ReactNode
}

function resultPlainText(result: StepResult) {
  return resultBlocks(result)
    .map((block) => {
      if (block.type === 'h1' || block.type === 'h2' || block.type === 'p') {
        return block.text.replace(/\*\*/g, '')
      }
      if (block.type === 'attachments') {
        return block.items.map((item) => item.name).join('\n')
      }
      if (block.type === 'viewerLegend') {
        return [block.intro, ...block.items.map((item) => item.title)]
          .filter(Boolean)
          .join('\n')
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, index) => {
        const match = /^\*\*([^*]+)\*\*$/.exec(part)
        if (match) {
          return (
            <span key={index} className="report-mark">
              {match[1]}
            </span>
          )
        }
        return part
      })}
    </>
  )
}

function BlockShell({
  animate,
  children,
}: {
  animate: boolean
  children: ReactNode
}) {
  if (!animate) {
    return children
  }
  return (
    <div className="mocha-result-reveal">
      <div className="mocha-result-reveal-inner mocha-result-in">{children}</div>
    </div>
  )
}

export function ReportBody({
  result,
  visibleCount,
  animate = false,
  selectedId,
  onHitSelect,
  showMeta = false,
  renderSlot,
}: ReportBodyProps) {
  const blocks = resultBlocks(result)
  const visible = visibleCount == null ? blocks : blocks.slice(0, visibleCount)
  return (
    <div className="report-body">
      {visible.map((block, index) => {
        if (block.type === 'h1') {
          return (
            <BlockShell key={`h1-${index}`} animate={animate}>
              <h2 className="report-h1">
                <RichText text={block.text} />
              </h2>
            </BlockShell>
          )
        }
        if (block.type === 'h2') {
          return (
            <BlockShell key={`h2-${index}`} animate={animate}>
              <h3 className="report-h2">
                <RichText text={block.text} />
              </h3>
            </BlockShell>
          )
        }
        if (block.type === 'rule') {
          return (
            <BlockShell key={`rule-${index}`} animate={animate}>
              <div className="report-rule" />
            </BlockShell>
          )
        }
        if (block.type === 'table') {
          const table = (
            <ResultTable
              rows={result.tableRows}
              title={result.tableTitle}
              headers={result.tableHeaders}
              selectedId={selectedId}
              onHitSelect={onHitSelect}
            />
          )
          if (!animate) {
            return <div key={`table-${index}`}>{table}</div>
          }
          return (
            <div
              key={`table-${index}`}
              className="mocha-result-reveal mocha-result-reveal-table"
            >
              <div className="mocha-result-reveal-inner mocha-result-in">
                {table}
              </div>
            </div>
          )
        }
        if (block.type === 'attachments') {
          return (
            <BlockShell key={`attachments-${index}`} animate={animate}>
              <ReportAttachments items={block.items} />
            </BlockShell>
          )
        }
        if (block.type === 'viewerLegend') {
          return (
            <BlockShell key={`viewer-${index}`} animate={animate}>
              <ReportViewerLegend
                intro={block.intro}
                items={block.items}
                footnote={block.footnote}
              />
            </BlockShell>
          )
        }
        if (block.type === 'structure' || block.type === 'mutationTable') {
          return (
            <BlockShell key={`${block.type}-${index}`} animate={animate}>
              {renderSlot?.(block.type) ?? null}
            </BlockShell>
          )
        }
        return (
          <BlockShell key={`p-${index}`} animate={animate}>
            <p className="report-p">
              <RichText text={block.text} />
            </p>
          </BlockShell>
        )
      })}
      {showMeta ? (
        <MessageMeta
          onCopy={() => {
            void navigator.clipboard.writeText(resultPlainText(result))
          }}
        />
      ) : null}
    </div>
  )
}
