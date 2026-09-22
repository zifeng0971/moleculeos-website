import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import iconQuestion from '../../../assets/mocha/icon-question.svg'
import iconChevronDown from '../../../assets/mocha/icon-chevron-down.svg'
import radioSelected from '../../../assets/mocha/radio-selected.svg'
import radioUnselected from '../../../assets/mocha/radio-unselected.svg'
import { qaCard as defaultQaCard, type QACardData } from '../../../data/mochaFlow'
import './QACard.css'

export type { QACardData }

type QACardProps = {
  onSubmit?: () => void
  initialConfirmed?: boolean
  card?: QACardData
}

export function QACard({
  onSubmit,
  initialConfirmed = false,
  card = defaultQaCard,
}: QACardProps) {
  const [selectedId, setSelectedId] = useState(card.defaultOptionId)
  const [confirmed, setConfirmed] = useState(initialConfirmed)
  const [previewOpen, setPreviewOpen] = useState(false)
  const selected =
    card.options.find((option) => option.id === selectedId) ?? card.options[0]

  if (confirmed) {
    return (
      <div
        className={
          previewOpen
            ? 'qa-card qa-card-confirmed qa-card-confirmed-open'
            : 'qa-card qa-card-confirmed'
        }
      >
        <div className="qa-confirmed-row">
          <div className="qa-confirmed-left">
            <Icon src={iconQuestion} width={20} height={20} />
            <p className="qa-confirmed-label">{card.collapsedLabel}</p>
          </div>
          <button
            type="button"
            className="qa-confirmed-choice"
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((open) => !open)}
          >
            <p className="qa-confirmed-choice-label">{selected.title}</p>
            <span className="qa-confirmed-chevron">
              <Icon src={iconChevronDown} width={14} height={14} />
            </span>
          </button>
        </div>
        {previewOpen && selected.description ? (
          <div className="qa-confirmed-preview">
            <p className="qa-confirmed-preview-text">{selected.description}</p>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="qa-card">
      <div className="qa-card-body">
        <div className="qa-card-title-row">
          <Icon src={iconQuestion} width={20} height={20} />
          <p className="qa-card-title">{card.title}</p>
        </div>
        <p className="qa-card-prompt">{card.prompt}</p>
        {card.options.map((option) => {
          const isSelected = option.id === selectedId
          return (
            <button
              key={option.id}
              type="button"
              className={isSelected ? 'qa-option qa-option-selected' : 'qa-option'}
              onClick={() => setSelectedId(option.id)}
            >
              <div className="qa-option-copy">
                <p className="qa-option-name">{option.title}</p>
                {option.description ? (
                  <p className="qa-option-desc">{option.description}</p>
                ) : null}
              </div>
              <span className="qa-option-radio">
                <Icon
                  src={isSelected ? radioSelected : radioUnselected}
                  width={12}
                  height={12}
                />
              </span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="qa-submit"
        onClick={() => {
          setConfirmed(true)
          onSubmit?.()
        }}
      >
        {card.submitLabel}
      </button>
    </div>
  )
}
