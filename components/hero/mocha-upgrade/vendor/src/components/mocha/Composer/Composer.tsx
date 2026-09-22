import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import iconPlus from '../../../assets/mocha/icon-plus-interactive.svg'
import iconPlay from '../../../assets/mocha/icon-play.svg'
import iconSendMuted from '../../../assets/mocha/icon-send-muted.svg'
import iconSendSolid from '../../../assets/mocha/icon-send-solid.svg'
import { composer } from '../../../data/mochaPanel'
import './Composer.css'

const COMPOSER_COMPACT_MIN_HEIGHT = 44
const COMPOSER_MAX_HEIGHT = 250

type ComposerProps = {
  /** Idle home = tall composer; conversation = compact bar that still grows. */
  compact?: boolean
  action?: 'stop' | 'send'
  paused?: boolean
  value?: string
  hint?: string | null
  onChange?: (value: string) => void
  onSubmit?: () => void
  onPause?: () => void
  placeholder?: string
}

export function Composer({
  compact = false,
  action = 'stop',
  paused = false,
  value = '',
  hint,
  onChange,
  onSubmit,
  onPause,
  placeholder: placeholderProp,
}: ComposerProps) {
  const hasContent = value.trim().length > 0
  // Only lock the field while a turn is actively running (not while paused).
  const canType = action === 'send' || paused
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [compactMultiline, setCompactMultiline] = useState(false)

  useLayoutEffect(() => {
    if (!compact && compactMultiline) {
      setCompactMultiline(false)
    }
  }, [compact, compactMultiline])

  useLayoutEffect(() => {
    const box = boxRef.current
    const input = inputRef.current
    if (!box || !input) {
      return
    }

    const styles = getComputedStyle(box)
    const paddingY =
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom)
    const gap = Number.parseFloat(styles.rowGap || styles.gap) || 0
    const empty = value.trim().length === 0
    const lineHeight =
      Number.parseFloat(getComputedStyle(input).lineHeight) || 24.5

    const measureScrollHeight = () => {
      // Flex-grown textareas report the previous allocated height as scrollHeight.
      const previousFlex = input.style.flex
      const previousHeight = input.style.height
      const previousWidth = input.style.width
      input.style.flex = '0 0 auto'
      input.style.height = 'auto'
      const needed = input.scrollHeight
      input.style.flex = previousFlex
      input.style.height = previousHeight
      input.style.width = previousWidth
      return needed
    }

    if (compact) {
      const minHeight = COMPOSER_COMPACT_MIN_HEIGHT
      const maxHeight = COMPOSER_MAX_HEIGHT

      if (empty) {
        if (compactMultiline) {
          setCompactMultiline(false)
          return
        }
        // Row layout needs CSS flex:1 — never leave inline flex/width stuck.
        input.style.height = ''
        input.style.flex = ''
        input.style.width = ''
        input.style.overflowY = 'hidden'
        input.scrollTop = 0
        box.style.height = `${minHeight}px`
        return
      }

      const paddingX =
        Number.parseFloat(styles.paddingLeft) +
        Number.parseFloat(styles.paddingRight)
      // Decide multiline as if text sits beside + / send (narrower field).
      const sideControls = 28 + 8 + 28
      const narrowWidth = Math.max(
        80,
        box.clientWidth - paddingX - sideControls - 8,
      )
      const previousWidth = input.style.width
      input.style.width = `${narrowWidth}px`
      const narrowNeeded = measureScrollHeight()
      input.style.width = previousWidth
      const nextMultiline = narrowNeeded > lineHeight * 1.5
      if (nextMultiline !== compactMultiline) {
        setCompactMultiline(nextMultiline)
        return
      }

      if (!nextMultiline) {
        // Single-line capsule: [+] [text……] [send] — text must grow with flex.
        input.style.flex = ''
        input.style.width = ''
        input.style.height = ''
        input.style.overflowY = 'hidden'
        input.scrollTop = 0
        box.style.height = `${minHeight}px`
        return
      }

      const toolbar = toolbarRef.current
      const chrome = paddingY + gap + (toolbar?.offsetHeight ?? 28)
      const maxText = Math.max(0, maxHeight - chrome)
      input.style.flex = '0 0 auto'
      input.style.width = ''
      input.style.height = 'auto'
      const needed = input.scrollHeight
      const contentHeight = Math.min(
        maxText,
        Math.max(needed, Math.ceil(lineHeight)),
      )
      input.style.height = `${contentHeight}px`
      input.style.overflowY = needed > maxText ? 'auto' : 'hidden'
      input.scrollTop = 0
      box.style.height = `${Math.min(
        maxHeight,
        Math.max(minHeight, contentHeight + chrome),
      )}px`
      return
    }

    const actions = actionsRef.current
    if (!actions) {
      return
    }

    const maxHeight = COMPOSER_MAX_HEIGHT

    // Idle empty: clear sticky inline sizes; CSS flex fills the 150px box.
    if (empty) {
      input.style.height = ''
      input.style.flex = ''
      input.style.width = ''
      input.style.overflowY = 'hidden'
      input.scrollTop = 0
      box.style.height = ''
      return
    }

    // Idle with content: full-width text, height hugs lines only.
    const chrome = paddingY + gap + actions.offsetHeight
    const maxText = Math.max(0, maxHeight - chrome)
    input.style.flex = '0 0 auto'
    input.style.width = ''
    input.style.height = 'auto'
    const needed = input.scrollHeight
    const contentHeight = Math.min(
      maxText,
      Math.max(needed, Math.ceil(lineHeight)),
    )
    input.style.height = `${contentHeight}px`
    input.style.overflowY = needed > maxText ? 'auto' : 'hidden'
    input.scrollTop = 0
    if (contentHeight + chrome >= maxHeight) {
      box.style.height = `${maxHeight}px`
    } else {
      box.style.height = ''
    }
  }, [value, action, compact, compactMultiline, paused])

  const placeholder = placeholderProp ?? (compact
    ? composer.conversationPlaceholder
    : composer.placeholder)

  const sendControl = (
    <button
      type="button"
      className={
        hasContent
          ? 'composer-send composer-send-ready'
          : 'composer-send composer-send-disabled'
      }
      aria-label="Send"
      disabled={!hasContent}
      onClick={() => {
        if (!hasContent) {
          return
        }
        onSubmit?.()
      }}
    >
      <Icon
        src={hasContent ? iconSendSolid : iconSendMuted}
        width={14}
        height={14}
      />
    </button>
  )

  const pauseControl = (
    <button
      type="button"
      className="composer-stop"
      aria-label="Pause"
      onClick={() => onPause?.()}
    >
      <span className="composer-stop-icon" />
    </button>
  )

  const resumeControl = (
    <button
      type="button"
      className="composer-resume"
      aria-label="Continue"
      onClick={() => onSubmit?.()}
    >
      <Icon src={iconPlay} width={14} height={14} />
    </button>
  )

  const addControl = (
    <button type="button" className="composer-add" aria-label="Add">
      <Icon src={iconPlus} width={14} height={14} />
    </button>
  )

  // Running → pause; paused + empty → continue; paused + text / idle → send.
  const primaryControl =
    action === 'stop'
      ? pauseControl
      : paused && !hasContent
        ? resumeControl
        : sendControl

  return (
    <div className="composer-wrap">
      <div
        className={[
          'composer',
          compact ? 'composer-compact' : '',
          compact && compactMultiline ? 'composer-compact-multiline' : '',
          !compact && hasContent ? 'composer-idle-filled' : '',
          !compact && !hasContent ? 'composer-idle-empty' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        ref={boxRef}
      >
        {compact && !compactMultiline ? addControl : null}
        <textarea
          ref={inputRef}
          className="composer-input"
          placeholder={placeholder}
          rows={1}
          value={value}
          readOnly={!canType}
          onChange={(event) => onChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (!canType) {
              return
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              // Empty + not paused → disabled send; empty + paused → resume.
              if (!hasContent && !paused) {
                return
              }
              onSubmit?.()
            }
          }}
        />
        {compact ? (
          <div className="composer-toolbar" ref={toolbarRef}>
            {compactMultiline ? addControl : null}
            {primaryControl}
          </div>
        ) : (
          <div className="composer-actions" ref={actionsRef}>
            {addControl}
            {primaryControl}
          </div>
        )}
      </div>
      {hint ? <p className="composer-hint">{hint}</p> : null}
    </div>
  )
}
