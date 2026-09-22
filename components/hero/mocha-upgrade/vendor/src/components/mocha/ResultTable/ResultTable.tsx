import { Icon } from '../Icon/Icon'
import { HitBar } from '../HitBar/HitBar'
import iconCaretRight from '../../../assets/mocha/icon-caret-right.svg'
import iconCopy from '../../../assets/mocha/icon-copy.svg'
import iconDownload from '../../../assets/mocha/icon-download.svg'
import {
  resultTable as defaultResultTable,
  tableRows as defaultTableRows,
  type HitVariant,
  type TableRowData,
} from '../../../data/mochaPanel'
import type { UnfoldStep } from '../../../data/mochaFlow'
import './ResultTable.css'

const defaultHeaders = ['ID', 'Hit', 'Score', 'E-Value', 'Bit', '% ID', 'Reference'] as const
const headerKeys = ['id', 'hit', 'score', 'evalue', 'bit', 'idpct', 'ref'] as const
const numericKeys = new Set<(typeof headerKeys)[number]>([
  'score',
  'evalue',
  'bit',
  'idpct',
])

function buildTableText(rows: TableRowData[]) {
  return [
    ['ID', 'Score', 'E-Value', 'Bit', '% ID', 'Reference'],
    ...rows.map((row) => [
      row.id,
      row.score,
      row.eValue,
      row.bit,
      row.identity,
      row.reference,
    ]),
  ]
    .map((row) => row.join('\t'))
    .join('\n')
}

function copyTable(rows: TableRowData[]) {
  void navigator.clipboard.writeText(buildTableText(rows))
}

function downloadTable(rows: TableRowData[], filename: string) {
  const blob = new Blob([buildTableText(rows).replaceAll('\t', ',')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const hitAlignment: Record<HitVariant, string> = {
  full: 'Continuous',
  gapped: 'Gapped',
  split: 'Split',
}

function parseIdentity(value: string) {
  return Number.parseFloat(value.replace('%', ''))
}

function toHitDetail(
  row: TableRowData,
  rows: TableRowData[],
  columnHeaders: readonly string[],
): UnfoldStep {
  const identityValues = rows.map((item) => parseIdentity(item.identity))
  const hasNumericIdentity = identityValues.every((value) => Number.isFinite(value))
  return {
    text: row.id,
    detail: row.detail,
    charts: [
      {
        type: 'bars',
        title: hasNumericIdentity ? 'Identity in this hit list' : columnHeaders[2] ?? 'Score',
        unit: hasNumericIdentity ? '%' : '',
        min: hasNumericIdentity ? 97 : undefined,
        items: rows.map((item) => ({
          label: item.id,
          value: hasNumericIdentity
            ? parseIdentity(item.identity)
            : Number.parseFloat(item.score),
          current: item.id === row.id,
        })),
      },
      {
        type: 'alignment',
        title: `Coverage on a ${row.queryLength}-residue query`,
        length: row.queryLength,
        segments: row.alignment,
      },
      {
        type: 'stack',
        title: row.name,
        items: row.composition,
      },
    ],
    controls: [
      { type: 'readout', label: columnHeaders[2] ?? 'Score', value: row.score },
      { type: 'readout', label: columnHeaders[3] ?? 'E-Value', value: row.eValue },
      { type: 'readout', label: columnHeaders[4] ?? 'Bit', value: row.bit },
      { type: 'readout', label: columnHeaders[5] ?? '% ID', value: row.identity },
      { type: 'readout', label: 'Alignment', value: hitAlignment[row.hit] },
      { type: 'readout', label: columnHeaders[6] ?? 'Reference', value: row.reference },
    ],
  }
}

type ResultTableProps = {
  selectedId?: string | null
  onHitSelect?: (step: UnfoldStep | null) => void
  reveal?: boolean
  visibleRowCount?: number
  rows?: TableRowData[]
  title?: string
  headers?: readonly [string, string, string, string, string, string, string]
}

export function ResultTable({
  selectedId,
  onHitSelect,
  reveal = false,
  visibleRowCount,
  rows: rowsProp,
  title,
  headers,
}: ResultTableProps) {
  const sourceRows = rowsProp ?? defaultTableRows
  const rows =
    visibleRowCount == null ? sourceRows : sourceRows.slice(0, visibleRowCount)
  const tableTitle = title ?? defaultResultTable.title
  const columnHeaders = headers ?? defaultHeaders
  const downloadName = tableTitle.toLowerCase().includes('blast')
    ? 'blast-hits.csv'
    : 'session-table.csv'
  return (
    <div
      className={
        reveal ? 'result-table-frame result-table-frame-reveal' : 'result-table-frame'
      }
    >
      <div className="result-table-toolbar">
        <h3 className="result-table-title">{tableTitle}</h3>
        <div className="result-table-actions">
          <button
            type="button"
            className="result-table-action"
            aria-label="Copy table"
            onClick={() => copyTable(sourceRows)}
          >
            <Icon src={iconCopy} width={14} height={14} />
          </button>
          <button
            type="button"
            className="result-table-action"
            aria-label="Download table"
            onClick={() => downloadTable(sourceRows, downloadName)}
          >
            <Icon src={iconDownload} width={14} height={14} />
          </button>
        </div>
      </div>
      <div className="result-table">
        <div className="result-table-header" role="row">
          <div className="result-table-expand" />
          {columnHeaders.map((label, index) => {
            const key = headerKeys[index] ?? 'id'
            return (
              <div
                key={`${key}-${label}`}
                className={`result-table-hcell result-table-hcell-${key}${
                  numericKeys.has(key) ? ' result-table-num' : ''
                }`}
              >
                <span className={key === 'hit' ? 'result-table-hhit' : undefined}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="result-table-body">
          {rows.map((row, index) => (
            <div
              key={`${row.id}-${index}`}
              className={
                index % 2 === 1
                  ? 'result-table-row result-table-row-alt'
                  : 'result-table-row'
              }
              role="row"
            >
              <div className="result-table-expand">
                <Icon src={iconCaretRight} width={24} height={24} />
              </div>
              <div className="result-table-cell result-table-cell-id">
                <button
                  type="button"
                  className={
                    selectedId === row.id
                      ? 'result-table-id result-table-id-selected'
                      : 'result-table-id'
                  }
                  aria-pressed={selectedId === row.id}
                  onClick={() => {
                    if (selectedId === row.id) {
                      onHitSelect?.(null)
                      return
                    }
                    onHitSelect?.(toHitDetail(row, sourceRows, columnHeaders))
                  }}
                >
                  {row.id}
                </button>
              </div>
              <div className="result-table-cell result-table-cell-hit">
                <HitBar variant={row.hit} />
              </div>
              <div className="result-table-cell result-table-cell-score result-table-num">
                {row.score}
              </div>
              <div className="result-table-cell result-table-cell-evalue result-table-num">
                {row.eValue}
              </div>
              <div className="result-table-cell result-table-cell-bit result-table-num">
                {row.bit}
              </div>
              <div className="result-table-cell result-table-cell-idpct result-table-num">
                {row.identity}
              </div>
              <div className="result-table-cell result-table-cell-ref">
                <span className="result-table-link">{row.reference}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
