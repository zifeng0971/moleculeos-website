/* eslint-disable @next/next/no-img-element */
import iconAttachment from '../../../assets/mocha/icon-attachment.svg'
import iconDownload from '../../../assets/mocha/icon-download.svg'
import iconPlus from '../../../assets/mocha/icon-plus.svg'
import type { ReportAttachment } from '../../../data/mochaFlow'
import './ReportAttachments.css'

type ReportAttachmentsProps = {
  items: ReportAttachment[]
}

function fileExt(name: string) {
  const match = /\.([a-z0-9]+)$/i.exec(name)
  return match ? match[1].toLowerCase() : ''
}

function canImportAttachment(name: string) {
  const ext = fileExt(name)
  return ext === 'cif' || ext === 'tsv'
}

function downloadAttachment(item: ReportAttachment) {
  const body =
    item.content ??
    `Mocha playground attachment stub\n\n${item.name}\n${item.subtitle ?? ''}\n`
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = item.name
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportAttachments({ items }: ReportAttachmentsProps) {
  if (!items.length) {
    return null
  }
  return (
    <ul className="report-attachments" aria-label="Attachments">
      {items.map((item) => {
        const importable = canImportAttachment(item.name)
        return (
          <li
            key={item.name}
            className={[
              'report-attachment',
              importable ? 'report-attachment-importable' : null,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <img
              className="report-attachment-icon"
              src={iconAttachment}
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
            />
            <p className="report-attachment-name">{item.name}</p>
            <div className="report-attachment-actions">
              {importable ? (
                <button
                  type="button"
                  className="report-attachment-action"
                  aria-label={`Import ${item.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                  }}
                >
                  <img src={iconPlus} alt="" width={14} height={14} />
                </button>
              ) : null}
              <button
                type="button"
                className="report-attachment-action"
                aria-label={`Download ${item.name}`}
                onClick={() => downloadAttachment(item)}
              >
                <img src={iconDownload} alt="" width={14} height={14} />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
