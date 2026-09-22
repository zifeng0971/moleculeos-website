/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { TaskChip } from '../TaskChip/TaskChip'
import iconChevronDown from '../../../assets/mocha/icon-chevron-down.svg'
import iconChevronUp from '../../../assets/mocha/icon-chevron-up.svg'
import iconCaretRight from '../../../assets/mocha/icon-caret-right.svg'
import iconZoom from '../../../assets/mocha/icon-zoom.svg'
import {
  mosTaskDetail,
  residueSelectionLabel,
  type TaskRowData,
  type UnfoldStep,
} from '../../../data/mochaFlow'
import './TaskRow.css'

type TaskRowProps = {
  task: TaskRowData
  /** Multiplier for step hold times (1 = default demo pace). */
  paceScale?: number
  /** Freeze step advancement while the demo is paused. */
  paused?: boolean
  selectedStep?: UnfoldStep | null
  selectedStepText?: string | null
  onStepSelect?: (step: UnfoldStep | null) => void
  onLiveComplete?: () => void
  onExpandSettled?: () => void
  onActiveStepChange?: (step: UnfoldStep, index: number) => void
}

const STEP_INTERVAL_MS = 2000
const THINKING_STEP_INTERVAL_MS = 1000
const EXPAND_MS = 360

type OutgoingHeader = {
  title: string
  detail?: string
}

function LoadingDots() {
  return (
    <span className="task-row-dots" aria-hidden="true">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  )
}

function FlipLine({
  text,
  className,
}: {
  text: string
  className: string
}) {
  const [displayed, setDisplayed] = useState(text)
  const [outgoing, setOutgoing] = useState<string | null>(null)
  const displayedRef = useRef(text)
  displayedRef.current = displayed

  useLayoutEffect(() => {
    if (text === displayedRef.current) {
      return
    }
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) {
      setOutgoing(null)
      setDisplayed(text)
      return
    }
    setOutgoing(displayedRef.current)
    setDisplayed(text)
  }, [text])

  return (
    <span className="task-row-flip" aria-live="polite">
      {outgoing ? (
        <p className={`${className} task-row-flip-out`}>{outgoing}</p>
      ) : null}
      <p
        className={outgoing ? `${className} task-row-flip-in` : className}
        onAnimationEnd={(event) => {
          if (event.currentTarget !== event.target) {
            return
          }
          if (event.animationName !== 'task-row-flip-in') {
            return
          }
          setOutgoing(null)
        }}
      >
        {displayed}
      </p>
    </span>
  )
}

function TaskRowCopy({
  live,
  title,
  accent,
  chip,
  detail,
  flipDetail = false,
  loadingDots = false,
  detailLive = false,
  chipSelected,
  brandSelected = false,
  onChipSelect,
  onBrandSelect,
}: {
  live: boolean
  title: string
  accent?: string
  chip?: string
  detail?: string
  flipDetail?: boolean
  loadingDots?: boolean
  detailLive?: boolean
  chipSelected?: boolean
  brandSelected?: boolean
  onChipSelect?: () => void
  onBrandSelect?: () => void
}) {
  const formattedTitle = formatStepLabel(title, {
    brandSelected,
    onBrandSelect: live ? undefined : onBrandSelect,
  })
  const titleNode = accent ? (
    <>
      {formattedTitle}{' '}
      <span className="task-row-accent">{accent}</span>
    </>
  ) : (
    formattedTitle
  )
  return (
    <span className="task-row-copy">
      <span className="task-row-left">
        {live ? (
          <p className="task-row-live">{titleNode}</p>
        ) : (
          <p className="task-row-label">{titleNode}</p>
        )}
        {chip ? (
          <TaskChip
            live={live}
            label={chip}
            selected={chipSelected}
            onSelect={onChipSelect}
          />
        ) : null}
        {detail ? (
          <>
            <span className="task-row-pipe">｜</span>
            <span className="task-row-detail-wrap">
              {detailLive ? (
                <p className="task-row-live">{detail}</p>
              ) : flipDetail ? (
                <FlipLine text={detail} className="task-row-detail" />
              ) : (
                <p className="task-row-detail">{detail}</p>
              )}
              {loadingDots ? <LoadingDots /> : null}
            </span>
          </>
        ) : null}
      </span>
    </span>
  )
}

function formatStepLabel(
  text: string,
  options?: {
    brandSelected?: boolean
    onBrandSelect?: () => void
  },
) {
  const parts = text.split(/(MMFold)/g)
  if (parts.length === 1) {
    return text
  }
  return parts.map((part, index) =>
    part === 'MMFold' && options?.onBrandSelect ? (
      <button
        key={index}
        type="button"
        className={
          options.brandSelected
            ? 'thinking-step-brand thinking-step-brand-selected'
            : 'thinking-step-brand'
        }
        aria-label="MMFold"
        aria-pressed={options.brandSelected}
        onClick={(event) => {
          event.stopPropagation()
          options.onBrandSelect?.()
        }}
      >
        {part}
      </button>
    ) : part === 'MMFold' ? (
      <span key={index} className="thinking-step-brand">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

function UnfoldStepRow({
  step,
  processing,
  selected,
  enter = false,
  brandSelected = false,
  onSelect,
  onBrandSelect,
}: {
  step: UnfoldStep
  processing: boolean
  selected: boolean
  enter?: boolean
  brandSelected?: boolean
  onSelect: () => void
  onBrandSelect?: () => void
}) {
  const websiteCount = step.links?.length ?? 0
  const selectionLabel = step.selection
    ? residueSelectionLabel(step.selection)
    : null
  const showZoomAction =
    step.action === 'zoom' || step.text === 'Zoom to the Region'
  return (
    <div
      className={
        processing ? 'thinking-step thinking-step-processing' : 'thinking-step'
      }
    >
      <button
        type="button"
        className="thinking-step-hitarea"
        aria-pressed={selected}
        aria-label={step.text}
        onClick={onSelect}
      />
      <div className="thinking-step-face">
        <span className="thinking-step-text-clip">
          <p
            className={
              enter ? 'thinking-step-text thinking-step-text-in' : 'thinking-step-text'
            }
          >
            {formatStepLabel(step.text, {
              brandSelected,
              onBrandSelect,
            })}
            {websiteCount > 0 ? (
              <span className="thinking-step-count">
                {websiteCount} websites
              </span>
            ) : null}
            {processing ? <LoadingDots /> : null}
          </p>
          {selectionLabel ? (
            <TaskChip variant="tag" label={selectionLabel} interactive />
          ) : null}
          {showZoomAction ? (
            <button
              type="button"
              className="thinking-step-zoom"
              aria-label="Zoom"
              onClick={(event) => {
                event.stopPropagation()
              }}
            >
              <Icon src={iconZoom} width={14} height={14} />
            </button>
          ) : null}
        </span>
        <span className="thinking-step-chevron">
          <Icon src={iconCaretRight} width={24} height={24} />
        </span>
      </div>
    </div>
  )
}

export function TaskRow({
  task,
  paceScale = 1,
  paused = false,
  selectedStep,
  selectedStepText,
  onStepSelect,
  onLiveComplete,
  onExpandSettled,
  onActiveStepChange,
}: TaskRowProps) {
  const steps = task.unfoldSteps ?? []
  const [open, setOpen] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [complete, setComplete] = useState(task.mode === 'completed')
  const [outgoing, setOutgoing] = useState<OutgoingHeader | null>(null)
  const notifiedComplete = useRef(false)
  const openRef = useRef(open)
  const modeRef = useRef(task.mode)
  openRef.current = open
  const isLive = task.mode === 'processing' && !complete
  const canToggle = steps.length > 0
  const currentStep = steps[activeIndex]
  const listedSteps = (isLive ? steps.slice(0, activeIndex + 1) : steps).filter(
    (step) => !step.transient,
  )
  const showLiveDetail = isLive && !open && Boolean(currentStep ?? task.detail)
  const detailLive =
    showLiveDetail && !outgoing && Boolean(currentStep?.liveBrand)
  const detailText = currentStep
    ? (currentStep.liveDetail ?? currentStep.text)
    : task.detail
  const title = complete
    ? (task.completedLabel ?? task.label)
    : isLive && task.type === 'mostask'
      ? task.label.replace(/_$/, '')
      : task.label
  const accent = complete ? task.labelAccent : undefined
  const rawStatus = complete ? (task.completedStatus ?? task.status) : task.status
  const status = rawStatus?.replace(/\s*steps$/i, '')
  const chevron = open ? iconChevronUp : iconChevronDown
  const swapping = Boolean(outgoing)
  const accessibleTitle = accent ? `${title} ${accent}` : title
  const chipSelected = Boolean(
    (task.chip && selectedStepText === task.chip) ||
      selectedStepText === 'MMFold',
  )
  const openMmfoldDetail = onStepSelect
    ? () => {
        onStepSelect(mosTaskDetail('MMFold'))
      }
    : undefined
  const onChipSelect =
    task.type === 'mostask' && task.chip && onStepSelect
      ? () => {
          if (!task.chip) {
            return
          }
          onStepSelect(mosTaskDetail(task.chip))
        }
      : undefined
  const onBrandSelect = onChipSelect ?? openMmfoldDetail

  useEffect(() => {
    if (!isLive || !currentStep) {
      return
    }
    onActiveStepChange?.(currentStep, activeIndex)
  }, [isLive, activeIndex, currentStep, onActiveStepChange])

  useEffect(() => {
    if (!canToggle || !isLive || steps.length < 2 || paused) {
      return
    }

    const defaultMs =
      task.type === 'thinking' ? THINKING_STEP_INTERVAL_MS : STEP_INTERVAL_MS
    const baseMs = steps[activeIndex]?.durationMs ?? defaultMs
    const waitMs = Math.max(0, Math.round(baseMs * paceScale))
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => {
        if (index >= steps.length - 1) {
          const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
          ).matches
          if (!reduceMotion) {
            setOutgoing({
              title:
                task.type === 'mostask'
                  ? task.label.replace(/_$/, '')
                  : task.label,
              detail: openRef.current
                ? undefined
                : `${steps[index]?.liveDetail ?? steps[index]?.text ?? task.detail}...`,
            })
          }
          setComplete(true)
          return index
        }
        return index + 1
      })
    }, waitMs)

    return () => window.clearTimeout(timer)
  }, [
    canToggle,
    isLive,
    steps,
    activeIndex,
    paceScale,
    paused,
    task.type,
    task.label,
    task.detail,
  ])

  useLayoutEffect(() => {
    const previous = modeRef.current
    modeRef.current = task.mode

    if (previous === 'processing' && task.mode === 'completed') {
      if (!complete) {
        notifiedComplete.current = true
        setOutgoing(null)
        setComplete(true)
        setActiveIndex(Math.max(0, steps.length - 1))
      }
      return
    }

    if (previous === 'completed' && task.mode === 'processing') {
      // Block stale complete=true from firing onLiveComplete before reset paints.
      notifiedComplete.current = true
      setOutgoing(null)
      setComplete(false)
      setActiveIndex(0)
      setOpen(false)
    }
  }, [task.mode, steps.length, complete])

  useEffect(() => {
    // After a completed→processing reset, re-arm completion once UI is live again.
    if (task.mode === 'processing' && !complete && notifiedComplete.current) {
      notifiedComplete.current = false
    }
  }, [task.mode, complete])

  useEffect(() => {
    if (!complete || task.mode !== 'processing' || notifiedComplete.current) {
      return
    }
    notifiedComplete.current = true
    onLiveComplete?.()
  }, [complete, task.mode, onLiveComplete])

  useLayoutEffect(() => {
    if (!open) {
      setReveal(false)
      return
    }
    const frame = window.requestAnimationFrame(() => {
      setReveal(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open || !reveal) {
      return
    }
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const timer = window.setTimeout(
      () => onExpandSettled?.(),
      reduceMotion ? 0 : EXPAND_MS,
    )
    return () => window.clearTimeout(timer)
  }, [open, reveal, listedSteps.length, onExpandSettled])

  const completeCopy = (
    <TaskRowCopy
      live={false}
      title={title}
      accent={accent}
      chip={task.chip}
      chipSelected={chipSelected}
      brandSelected={chipSelected}
      onChipSelect={onChipSelect}
      onBrandSelect={onBrandSelect}
    />
  )
  const liveCopy = (
    <TaskRowCopy
      live
      title={outgoing?.title ?? title}
      detail={outgoing?.detail ?? (showLiveDetail ? detailText : undefined)}
      flipDetail={showLiveDetail && !outgoing && !detailLive}
      loadingDots={showLiveDetail && !outgoing && !detailLive}
      detailLive={detailLive}
      chip={task.type === 'mostask' ? undefined : task.chip}
      chipSelected={chipSelected}
      onChipSelect={onChipSelect}
    />
  )
  const copy = swapping ? (
    <span className="task-row-swap">
      <span className="task-row-swap-layer task-row-swap-out">{liveCopy}</span>
      <span
        className="task-row-swap-layer task-row-swap-in"
        onAnimationEnd={(event) => {
          if (event.currentTarget !== event.target) {
            return
          }
          setOutgoing(null)
        }}
      >
        {completeCopy}
      </span>
    </span>
  ) : isLive ? (
    liveCopy
  ) : (
    completeCopy
  )

  const header = (
    <>
      <Icon src={task.icon} width={20} height={20} />
      {copy}
      {complete && status ? (
        <p
          className={
            swapping ? 'task-row-status task-row-status-in' : 'task-row-status'
          }
        >
          {status}
        </p>
      ) : null}
      <span className="task-row-chevron">
        <Icon src={chevron} width={14} height={14} />
      </span>
    </>
  )

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const revealEnter = task.mode === 'processing' && !reduceMotion

  return (
    <div
      className={
        revealEnter
          ? 'task-row-mount task-row-mount-run'
          : 'task-row-mount'
      }
    >
      <div className="task-row-mount-inner">
        <div className={open ? 'task-row-block task-row-block-open' : 'task-row-block'}>
          <div className="task-row">
            {canToggle ? (
              <button
                type="button"
                className="task-row-hitarea"
                aria-expanded={open}
                aria-label={accessibleTitle}
                onClick={() => {
                  const next = !open
                  setOpen(next)
                  if (!next) {
                    onStepSelect?.(null)
                    return
                  }
                  onExpandSettled?.()
                }}
              />
            ) : null}
            <div className="task-row-face">
              {header}
            </div>
          </div>
          {open ? (
            <div
              className={
                reveal ? 'task-row-steps task-row-steps-open' : 'task-row-steps'
              }
            >
              <div className="task-row-steps-inner">
                {listedSteps.map((step, index) => {
                  const isSelected =
                    selectedStep === step ||
                    Boolean(
                      selectedStep &&
                        selectedStep.text === step.text &&
                        selectedStep.detail === step.detail &&
                        (selectedStep.links?.[0]?.url ?? '') ===
                          (step.links?.[0]?.url ?? '') &&
                        (selectedStep.links?.length ?? 0) ===
                          (step.links?.length ?? 0),
                    )
                  return (
                  <UnfoldStepRow
                    key={`${index}-${step.text}`}
                    step={step}
                    processing={!complete && step === currentStep}
                    enter={
                      isLive &&
                      step === currentStep &&
                      index === listedSteps.length - 1
                    }
                    selected={isSelected}
                    brandSelected={chipSelected}
                    onBrandSelect={onBrandSelect}
                    onSelect={() => {
                      onStepSelect?.(
                        step.layout === 'schema'
                          ? { ...step, taskName: task.chip ?? step.taskName }
                          : step.layout === 'mosTask'
                            ? step
                            : step.links?.length
                              ? { ...step, layout: 'search' }
                              : step,
                      )
                    }}
                  />
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
