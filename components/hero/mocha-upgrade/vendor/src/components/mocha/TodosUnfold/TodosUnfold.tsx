import { forwardRef, useLayoutEffect, useRef } from 'react'
import { Icon } from '../Icon/Icon'
import { TodosFold } from '../TodosFold/TodosFold'
import iconTodos from '../../../assets/mocha/icon-todos.svg'
import iconSuccess from '../../../assets/mocha/icon-success.svg'
import iconWarning from '../../../assets/mocha/icon-warning.svg'
import iconLoading from '../../../assets/mocha/icon-loading.png'
import iconUnexecuted from '../../../assets/mocha/icon-unexecuted.svg'
import iconChevronDown from '../../../assets/mocha/icon-chevron-down.svg'
import iconChevronUp from '../../../assets/mocha/icon-chevron-up.svg'
import type { TodosItem } from '../../../data/mochaFlow'
import './TodosUnfold.css'

const CHIP_WIDTH = 200
const CHIP_HEIGHT = 30
const MORPH_MS = 360
const ITEM_ICON = 12

type TodosUnfoldProps = {
  items: TodosItem[]
  closing?: boolean
  asChip?: boolean
  paused?: boolean
  chipVariant?: 'processing' | 'complete'
  chipStatus?: string
  onClose?: () => void
  onChipExpand?: () => void
  onCloseAnimationEnd?: () => void
}

function ItemIcon({
  status,
  paused,
}: {
  status: TodosItem['status']
  paused?: boolean
}) {
  if (status === 'success') {
    return <Icon src={iconSuccess} width={ITEM_ICON} height={ITEM_ICON} />
  }
  if (status === 'warning') {
    return <Icon src={iconWarning} width={ITEM_ICON} height={ITEM_ICON} />
  }
  if (status === 'unexecuted') {
    return <Icon src={iconUnexecuted} width={ITEM_ICON} height={ITEM_ICON} />
  }
  if (paused) {
    return <span className="todos-unfold-paused" aria-hidden />
  }
  return (
    <span className="todos-unfold-spinner">
      <Icon src={iconLoading} width={ITEM_ICON} height={ITEM_ICON} />
    </span>
  )
}

export const TodosUnfold = forwardRef<HTMLDivElement, TodosUnfoldProps>(function TodosUnfold({
  items,
  closing = false,
  asChip = false,
  paused = false,
  chipVariant = 'processing',
  chipStatus = '0/5',
  onClose,
  onChipExpand,
  onCloseAnimationEnd,
}, ref) {
  const cardRef = useRef<HTMLDivElement>(null)
  const docked = closing || asChip

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) {
      return
    }

    if (!closing) {
      card.style.width = ''
      card.style.height = ''
      return
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) {
      onCloseAnimationEnd?.()
      return
    }

    const fromWidth = card.offsetWidth
    const fromHeight = card.offsetHeight
    card.style.width = `${fromWidth}px`
    card.style.height = `${fromHeight}px`
    card.getBoundingClientRect()

    let finished = false
    const ended = new Set<string>()
    const finish = () => {
      if (finished) {
        return
      }
      finished = true
      onCloseAnimationEnd?.()
    }

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== card) {
        return
      }
      if (event.propertyName !== 'width' && event.propertyName !== 'height') {
        return
      }
      ended.add(event.propertyName)
      if (ended.has('width') && ended.has('height')) {
        finish()
      }
    }

    card.addEventListener('transitionend', onEnd)
    const frame = window.requestAnimationFrame(() => {
      card.style.width = `${CHIP_WIDTH}px`
      card.style.height = `${CHIP_HEIGHT}px`
    })
    const fallback = window.setTimeout(finish, MORPH_MS + 40)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(fallback)
      card.removeEventListener('transitionend', onEnd)
    }
  }, [closing, onCloseAnimationEnd])

  const enterClass = asChip
    ? 'todos-unfold-enter todos-unfold-enter-chip'
    : closing
      ? 'todos-unfold-enter todos-unfold-enter-closing'
      : 'todos-unfold-enter'
  const cardClass = asChip
    ? 'todos-unfold todos-unfold-as-chip'
    : closing
      ? 'todos-unfold todos-unfold-closing'
      : 'todos-unfold'

  return (
    <div ref={ref} className={enterClass}>
      <div className="todos-unfold-enter-inner">
        <div ref={cardRef} className={cardClass}>
          <div className="todos-unfold-header">
            <div className="todos-unfold-title-row">
              <Icon src={iconTodos} width={20} height={20} />
              <p
                className={
                  chipVariant === 'complete'
                    ? 'todos-unfold-title todos-unfold-title-complete'
                    : 'todos-unfold-title'
                }
              >
                Todos
              </p>
            </div>
            {onClose ? (
              <button
                type="button"
                className="todos-unfold-close"
                aria-label="Collapse todos"
                onClick={onClose}
              >
                <Icon src={iconChevronUp} width={14} height={14} />
              </button>
            ) : (
              <span className="todos-unfold-close">
                <Icon src={iconChevronUp} width={14} height={14} />
              </span>
            )}
          </div>
          {items.map((item, index) => (
            <div key={`${item.text}-${index}`} className="todos-unfold-item">
              <div className="todos-unfold-item-main">
                <ItemIcon status={item.status} paused={paused} />
                <p
                  className={[
                    'todos-unfold-item-text',
                    item.strike ? 'todos-unfold-item-strike' : '',
                    item.emphasis ? 'todos-unfold-item-emphasis' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {item.text}
                </p>
              </div>
              {item.note ? (
                <div className="todos-unfold-item-note">
                  <p>{item.note}</p>
                  <span className="todos-unfold-item-chevron">
                    <Icon src={iconChevronDown} width={14} height={14} />
                  </span>
                </div>
              ) : null}
            </div>
          ))}
          {docked ? (
            <button
              type="button"
              className="todos-unfold-chip-face todos-unfold-chip-face-toggle"
              aria-expanded="false"
              disabled={!onChipExpand}
              onClick={onChipExpand}
            >
              <TodosFold
                embedded
                paused={paused}
                variant={chipVariant}
                status={chipStatus}
              />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
})
