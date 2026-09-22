/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { MochaHeader } from '../../components/mocha/MochaHeader/MochaHeader'
import { ChatBubble } from '../../components/mocha/ChatBubble/ChatBubble'
import { TaskRow } from '../../components/mocha/TaskRow/TaskRow'
import { ReportBody } from '../../components/mocha/ReportBody/ReportBody'
import { TodosFold } from '../../components/mocha/TodosFold/TodosFold'
import { TodosUnfold } from '../../components/mocha/TodosUnfold/TodosUnfold'
import { TaskProgress } from '../../components/mocha/TaskProgress/TaskProgress'
import { WorkingPulse } from '../../components/mocha/WorkingPulse/WorkingPulse'
import { AbsorbPulse } from '../../components/mocha/AbsorbPulse/AbsorbPulse'
import { Composer } from '../../components/mocha/Composer/Composer'
import { MochaIdle } from '../../components/mocha/MochaIdle/MochaIdle'
import type { MochaIdleItem } from '../../components/mocha/MochaIdle/MochaIdle'
import { QACard } from '../../components/mocha/QACard/QACard'
import { disclaimer } from '../../data/mochaPanel'
import {
  progressTodosItems,
  resultBlocks,
  type FlowStep,
  type HistoryTurn,
  type UnfoldStep,
} from '../../data/mochaFlow'
import './MochaPanel.css'

const LIVE_FRAME_HOLD_MS = 0
const TODOS_MORPH_MS = 360
const TODOS_PREVIEW_MS = 3000
const TASK_PROGRESS_MS = 10000
const QA_REVEAL_MS = 360
const RESULT_COLLAPSE_BEAT_MS = 300
/** Leave this much previous-turn content above the new user bubble. */
const PIN_TOP_PEEK_PX = 100
/** Brief absorb beat before each turn starts processing. */
const TURN_ABSORB_MS = 1000

function formatWorkedFor(ms: number) {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  const parts = [
    minutes > 0 ? `${minutes}m` : null,
    seconds > 0 ? `${seconds}s` : null,
  ].filter(Boolean)
  return parts.length ? `Worked for ${parts.join(' ')}` : 'Worked for'
}

const idleStep: FlowStep = {
  id: 'idle',
  label: '',
  showUserTimestamp: false,
  showQaCard: false,
  showResult: false,
  composerAction: 'send',
  todos: { kind: 'none' },
  tasks: [],
}

function TodosSlot({
  left,
  children,
}: {
  left?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={
        left
          ? 'mocha-panel-todos mocha-panel-todos-with-meta'
          : 'mocha-panel-todos'
      }
    >
      {left}
      {children}
    </div>
  )
}

function nextFlowStep(steps: FlowStep[], stepId: FlowStep['id']) {
  const index = steps.findIndex((item) => item.id === stepId)
  return steps[index + 1]
}

function CompletedTurn({
  turn,
  workedFor,
  selectedStep,
  selectedStepText,
  onStepSelect,
}: {
  turn: HistoryTurn
  workedFor?: string | null
  selectedStep?: UnfoldStep | null
  selectedStepText?: string | null
  onStepSelect?: (step: UnfoldStep | null) => void
}) {
  const [todosOpen, setTodosOpen] = useState(false)

  return (
    <>
      <div className="mocha-user-block">
        <ChatBubble variant="user">{turn.user.text}</ChatBubble>
      </div>
      <div className="mocha-thread">
        {turn.tasks.length ? (
          <div className="mocha-task-list">
            {turn.tasks.map((task, index) => (
              <TaskRow
                key={`${task.type}-${index}`}
                task={task}
                selectedStep={selectedStep}
                selectedStepText={selectedStepText}
                onStepSelect={onStepSelect}
              />
            ))}
          </div>
        ) : null}
        {turn.todos ? (
          <TodosSlot
            left={
              !todosOpen && workedFor ? (
                <p className="mocha-todos-worked">{workedFor}</p>
              ) : null
            }
          >
            <TodosUnfold
              items={turn.todos.items}
              asChip={!todosOpen}
              chipVariant="complete"
              chipStatus={turn.todos.status}
              onClose={todosOpen ? () => setTodosOpen(false) : undefined}
              onChipExpand={todosOpen ? undefined : () => setTodosOpen(true)}
            />
          </TodosSlot>
        ) : null}
        {turn.result ? (
          <div className="mocha-result-anchor">
            <ReportBody
              result={turn.result}
              selectedId={selectedStepText}
              onHitSelect={onStepSelect}
              showMeta
            />
          </div>
        ) : null}
      </div>
    </>
  )
}

type MochaPanelProps = {
  header?: { title?: string }
  idle?: boolean
  playing?: boolean
  paused?: boolean
  step?: FlowStep
  flowSteps?: FlowStep[]
  /** Multiplier for absorb / todos / step / MOS progress timing. */
  paceScale?: number
  draft?: string
  hint?: string | null
  onDraftChange?: (value: string) => void
  onSubmit?: () => void
  onPause?: () => void
  selectedThinkingStep?: UnfoldStep | null
  onThinkingStepSelect?: (step: UnfoldStep | null) => void
  onFrameComplete?: () => void
  idleContent: { banner: string; prompt: string; sectionLabel: string; items: MochaIdleItem[] }
  onIdleSelect?: (id: string) => void
  composerPlaceholder?: string
  disclaimerText?: string
  renderReportSlot?: (kind: 'structure' | 'mutationTable') => ReactNode
}

export function MochaPanel({
  header,
  idle = false,
  playing = false,
  paused = false,
  step: stepProp,
  flowSteps = [],
  paceScale = 1,
  draft = '',
  hint,
  onDraftChange,
  onSubmit,
  onPause,
  selectedThinkingStep,
  onThinkingStepSelect,
  onFrameComplete,
  idleContent,
  onIdleSelect,
  composerPlaceholder,
  disclaimerText,
  renderReportSlot,
}: MochaPanelProps) {
  const step = stepProp ?? idleStep
  const scaleMs = useCallback(
    (ms: number) => Math.max(0, Math.round(ms * paceScale)),
    [paceScale],
  )
  const [thinkingComplete, setThinkingComplete] = useState(false)
  const [todosCollapsed, setTodosCollapsed] = useState(false)
  const [todosClosing, setTodosClosing] = useState(false)
  const [todosExecuting, setTodosExecuting] = useState(0)
  const [todosMountId, setTodosMountId] = useState(0)
  const [todosPaused, setTodosPaused] = useState(
    step.todos.kind === 'unfold' && Boolean(step.todos.paused),
  )
  const [taskProgress, setTaskProgress] = useState<number | null>(null)
  const [qaIntro, setQaIntro] = useState(false)
  const [workedFor, setWorkedFor] = useState<string | null>(null)
  const [historyWorkedFor, setHistoryWorkedFor] = useState<string[]>([])
  const unfoldTodos = step.todos.kind === 'unfold' ? step.todos : null
  const foldTodos = step.todos.kind === 'fold' ? step.todos : null
  const currentUser = step.user
  const liveResult = step.result ?? { paragraphs: [] as string[] }
  const liveBlocks = resultBlocks(liveResult)
  const resultItemCount = liveBlocks.length
  const [resultPhase, setResultPhase] = useState(
    step.animateResult ? 0 : resultItemCount,
  )
  const [turnAbsorbing, setTurnAbsorbing] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const currentUserRef = useRef<HTMLDivElement>(null)
  const feedSpacerRef = useRef<HTMLDivElement>(null)
  const todosUnfoldRef = useRef<HTMLDivElement>(null)
  const pinBubbleRef = useRef(false)
  const userScrolledRef = useRef(false)
  const applyingScrollRef = useRef(false)
  const todosCollapsedRef = useRef(false)
  const todosClosingRef = useRef(false)
  const skipAutoCollapseRef = useRef(false)
  const collapsedByActionRef = useRef(false)
  const onFrameCompleteRef = useRef(onFrameComplete)
  const pausedRef = useRef(paused)
  const frameCompleteTimerRef = useRef(0)
  const frameCompleteSentRef = useRef(false)
  const qaBridgeTimerRef = useRef(0)
  const qaBridgePhaseRef = useRef<'idle' | 'collapsing' | 'revealing'>('idle')
  const beginQaRevealRef = useRef(() => {})
  const pendingResultAdvanceRef = useRef(false)
  const pendingTodosPreviewAdvanceRef = useRef(false)
  const taskProgressStartedRef = useRef(false)
  const taskProgressOpenRef = useRef(false)
  const taskProgressFrameRef = useRef(0)
  const taskProgressElapsedRef = useRef(0)
  const todosPreviewDoneRef = useRef(false)
  const wasThinkingCompleteRef = useRef(false)
  const startedAtRef = useRef<number | null>(null)
  const turnKeyRef = useRef<string | null>(null)
  const pendingHistoryWorkedRef = useRef<string | null>(null)
  onFrameCompleteRef.current = onFrameComplete
  pausedRef.current = paused
  const startCollapsed = Boolean(unfoldTodos?.startCollapsed)
  const initialExecuting = unfoldTodos?.initialExecuting ?? 0
  const revealTodosAfterThinking = Boolean(unfoldTodos?.afterThinkingComplete)
  const showLiveUnfold =
    Boolean(unfoldTodos) &&
    (!unfoldTodos?.afterThinkingComplete || thinkingComplete)
  const canCollapseTodos = Boolean(
    unfoldTodos?.foldStatus || unfoldTodos?.liveProgress,
  )
  const nextStep = nextFlowStep(flowSteps, step.id)
  const showQaCard = step.showQaCard || qaIntro
  const todosItems =
    unfoldTodos &&
    (unfoldTodos.liveProgress || unfoldTodos.initialExecuting != null)
      ? progressTodosItems(unfoldTodos.items, todosExecuting)
      : (unfoldTodos?.items ?? [])
  const todosComplete =
    Boolean(unfoldTodos) && todosExecuting >= (unfoldTodos?.items.length ?? 0)
  const todosFoldStatus = todosComplete
    ? `${unfoldTodos?.items.length}/${unfoldTodos?.items.length}`
    : unfoldTodos?.liveProgress
      ? `${todosExecuting}/${unfoldTodos.items.length}`
      : (unfoldTodos?.foldStatus ?? `${initialExecuting}/${unfoldTodos?.items.length ?? 5}`)
  // Never chase the scroll bottom. New turns pin the user bubble to the top;
  // when a result appears, keep that viewport — do not jump to the report.
  const followConversation = false
  const followConversationRef = useRef(followConversation)
  followConversationRef.current = followConversation

  const turnKey = idle
    ? null
    : `${flowSteps[0]?.id ?? step.id}:${step.history?.length ?? 0}`
  if (idle) {
    if (turnKeyRef.current != null) {
      turnKeyRef.current = null
      startedAtRef.current = null
      pendingHistoryWorkedRef.current = null
      if (workedFor != null) {
        setWorkedFor(null)
      }
      if (historyWorkedFor.length > 0) {
        setHistoryWorkedFor([])
      }
    }
  } else if (turnKeyRef.current !== turnKey) {
    if (workedFor) {
      pendingHistoryWorkedRef.current = workedFor
      setHistoryWorkedFor((list) => [...list, workedFor])
    } else {
      pendingHistoryWorkedRef.current = null
    }
    turnKeyRef.current = turnKey
    startedAtRef.current = performance.now()
    todosPreviewDoneRef.current = false
    taskProgressStartedRef.current = false
    taskProgressOpenRef.current = false
    wasThinkingCompleteRef.current = false
    pendingTodosPreviewAdvanceRef.current = false
    window.cancelAnimationFrame(taskProgressFrameRef.current)
    if (workedFor != null) {
      setWorkedFor(null)
    }
    setTaskProgress(null)
  }

  const showWorkedFor =
    (step.showResult && todosCollapsed && !todosClosing) ||
    foldTodos?.variant === 'complete'
  const displayWorkedFor =
    workedFor ??
    (showWorkedFor && startedAtRef.current != null
      ? formatWorkedFor(performance.now() - startedAtRef.current)
      : null)

  const stepIdRef = useRef(step.id)
  if (stepIdRef.current !== step.id) {
    const keepTodosOpen =
      Boolean(unfoldTodos) &&
      !todosCollapsedRef.current &&
      !todosClosingRef.current
    const keepTodosCollapsed =
      todosCollapsedRef.current || todosClosingRef.current
    stepIdRef.current = step.id
    setThinkingComplete(false)
    if (keepTodosCollapsed) {
      skipAutoCollapseRef.current = true
      todosPreviewDoneRef.current = true
    } else if (!keepTodosOpen) {
      setTodosCollapsed(startCollapsed)
      setTodosClosing(false)
      setTodosMountId(0)
      todosCollapsedRef.current = startCollapsed
      todosClosingRef.current = false
      if (startCollapsed) {
        todosPreviewDoneRef.current = true
      }
    }
    setTodosExecuting(initialExecuting)
    setTodosPaused(Boolean(unfoldTodos?.paused))
    if (!taskProgressOpenRef.current) {
      setTaskProgress(null)
      taskProgressStartedRef.current = false
      window.cancelAnimationFrame(taskProgressFrameRef.current)
    }
    setQaIntro(false)
    setResultPhase(step.animateResult ? 0 : resultItemCount)
    skipAutoCollapseRef.current =
      keepTodosOpen || keepTodosCollapsed
        ? skipAutoCollapseRef.current
        : false
    collapsedByActionRef.current =
      keepTodosOpen || keepTodosCollapsed
        ? collapsedByActionRef.current
        : false
    frameCompleteSentRef.current = false
    qaBridgePhaseRef.current = 'idle'
    pendingResultAdvanceRef.current = false
    if (frameCompleteTimerRef.current) {
      window.clearTimeout(frameCompleteTimerRef.current)
      frameCompleteTimerRef.current = 0
    }
    if (qaBridgeTimerRef.current) {
      window.clearTimeout(qaBridgeTimerRef.current)
      qaBridgeTimerRef.current = 0
    }
  }

  const scheduleFrameComplete = useCallback((delayMs: number) => {
    if (!onFrameCompleteRef.current || frameCompleteSentRef.current) {
      return
    }
    frameCompleteSentRef.current = true
    const run = () => {
      frameCompleteTimerRef.current = 0
      if (pausedRef.current) {
        frameCompleteTimerRef.current = window.setTimeout(run, 120)
        return
      }
      onFrameCompleteRef.current?.()
    }
    frameCompleteTimerRef.current = window.setTimeout(run, delayMs)
  }, [])

  todosCollapsedRef.current = todosCollapsed
  todosClosingRef.current = todosClosing

  const beginQaReveal = useCallback(() => {
    if (qaBridgePhaseRef.current === 'revealing') {
      return
    }
    qaBridgePhaseRef.current = 'revealing'
    if (qaBridgeTimerRef.current) {
      window.clearTimeout(qaBridgeTimerRef.current)
      qaBridgeTimerRef.current = 0
    }
    setQaIntro(true)
  }, [])
  beginQaRevealRef.current = beginQaReveal

  const lockedScrollTopRef = useRef<number | null>(null)

  const setBodyScrollTop = useCallback((nextTop: number) => {
    const body = bodyRef.current
    if (!body) {
      return
    }
    applyingScrollRef.current = true
    body.scrollTop = Math.max(0, nextTop)
    applyingScrollRef.current = false
  }, [])

  const feedHeightRef = useRef<number | null>(null)
  const pinTopPeekRef = useRef(0)

  const writeSpacerHeight = useCallback((height: number) => {
    const spacer = feedSpacerRef.current
    if (!spacer) {
      return 0
    }
    const next = Math.max(0, Math.round(height))
    if (spacer.style.height !== `${next}px`) {
      spacer.style.height = `${next}px`
    }
    return next
  }, [])

  const readSpacerHeight = useCallback(() => {
    const spacer = feedSpacerRef.current
    if (!spacer) {
      return 0
    }
    return spacer.offsetHeight || Number.parseFloat(spacer.style.height) || 0
  }, [])

  const clearFeedSpacer = useCallback(() => {
    const body = bodyRef.current
    if (readSpacerHeight() <= 0 && feedSpacerRef.current?.style.height === '0px') {
      feedHeightRef.current = null
      lockedScrollTopRef.current = null
      return
    }
    const previousTop = body?.scrollTop ?? 0
    writeSpacerHeight(0)
    feedHeightRef.current = null
    lockedScrollTopRef.current = null
    if (body) {
      const maxTop = Math.max(0, body.scrollHeight - body.clientHeight)
      setBodyScrollTop(Math.min(previousTop, maxTop))
    }
  }, [readSpacerHeight, writeSpacerHeight, setBodyScrollTop])

  // Keep the pinned bubble at the turn-start peek offset. Locking scrollTop
  // alone is not enough — history above the bubble can still grow (e.g.
  // "Worked for"), which would push the bubble down in the viewport.
  const restorePinOffset = useCallback(() => {
    if (!pinBubbleRef.current || userScrolledRef.current) {
      return
    }
    const body = bodyRef.current
    const bubble = currentUserRef.current
    if (!body || !bubble) {
      return
    }
    const desired = pinTopPeekRef.current
    const actual =
      bubble.getBoundingClientRect().top - body.getBoundingClientRect().top
    const drift = actual - desired
    if (Math.abs(drift) >= 1) {
      setBodyScrollTop(body.scrollTop + drift)
    }
    lockedScrollTopRef.current = body.scrollTop
  }, [setBodyScrollTop])

  // Pin the new user bubble near the top at turn start. With prior turns,
  // leave ~100px of previous content visible above the bubble.
  const pinCurrentUserTop = useCallback(() => {
    const body = bodyRef.current
    const bubble = currentUserRef.current
    const feed = body?.querySelector('.mocha-panel-feed')
    if (!body || !bubble || !(feed instanceof HTMLElement)) {
      return false
    }

    const bottomGap = 12
    const bodyRect = body.getBoundingClientRect()
    const bubbleRect = bubble.getBoundingClientRect()
    const feedRect = feed.getBoundingClientRect()

    // Capture target scroll before spacer changes (spacer can clamp scrollTop).
    const bubbleDocTop = bubbleRect.top - bodyRect.top + body.scrollTop
    const topPeek = Math.min(PIN_TOP_PEEK_PX, Math.max(0, bubbleDocTop))
    pinTopPeekRef.current = topPeek
    const contentFromBubbleTop = Math.max(0, feedRect.bottom - bubbleRect.top)
    writeSpacerHeight(
      Math.max(
        0,
        Math.ceil(body.clientHeight - topPeek - contentFromBubbleTop - bottomGap),
      ),
    )

    setBodyScrollTop(Math.max(0, bubbleDocTop - topPeek))

    const drift =
      bubble.getBoundingClientRect().top -
      body.getBoundingClientRect().top -
      topPeek
    if (Math.abs(drift) >= 1) {
      setBodyScrollTop(body.scrollTop + drift)
    }

    feedHeightRef.current = feed.offsetHeight
    lockedScrollTopRef.current = body.scrollTop

    return (
      Math.abs(
        bubble.getBoundingClientRect().top -
          body.getBoundingClientRect().top -
          topPeek,
      ) < 2
    )
  }, [writeSpacerHeight, setBodyScrollTop])

  // Keep body scrollHeight stable: opposite spacer delta to feed height changes.
  // Then re-assert the pin offset so growth above the bubble cannot drift it.
  const compensateFeedLayout = useCallback(() => {
    const feed = bodyRef.current?.querySelector('.mocha-panel-feed')
    if (!(feed instanceof HTMLElement)) {
      return
    }
    const feedHeight = feed.offsetHeight
    const prev = feedHeightRef.current
    if (prev == null) {
      feedHeightRef.current = feedHeight
      restorePinOffset()
      return
    }
    const feedDelta = feedHeight - prev
    feedHeightRef.current = feedHeight
    if (feedDelta !== 0) {
      writeSpacerHeight(Math.max(0, readSpacerHeight() - feedDelta))
    }
    restorePinOffset()
  }, [readSpacerHeight, writeSpacerHeight, restorePinOffset])

  const finishTodosCollapse = useCallback(() => {
    todosClosingRef.current = false
    todosCollapsedRef.current = true
    collapsedByActionRef.current = true
    setTodosClosing(false)
    setTodosCollapsed(true)
    if (qaBridgePhaseRef.current === 'collapsing') {
      beginQaRevealRef.current()
    }
    if (pendingResultAdvanceRef.current) {
      pendingResultAdvanceRef.current = false
      scheduleFrameComplete(80)
    }
    if (pendingTodosPreviewAdvanceRef.current) {
      pendingTodosPreviewAdvanceRef.current = false
      scheduleFrameComplete(80)
    }
  }, [scheduleFrameComplete])

  const requestTodosCollapse = useCallback(() => {
    if (
      todosCollapsedRef.current ||
      todosClosingRef.current ||
      !canCollapseTodos
    ) {
      return
    }
    todosClosingRef.current = true
    collapsedByActionRef.current = true
    setTodosClosing(true)
  }, [canCollapseTodos])

  const hideTaskProgress = useCallback(() => {
    window.cancelAnimationFrame(taskProgressFrameRef.current)
    if (!taskProgressOpenRef.current) {
      return
    }
    taskProgressOpenRef.current = false
    setTaskProgress(null)
  }, [])

  const startTaskProgress = useCallback(() => {
    if (taskProgressStartedRef.current) {
      return
    }
    taskProgressStartedRef.current = true
    taskProgressOpenRef.current = true
    // Don't cut the Todos preview short — chip progress shows after auto-collapse.
    if (todosPreviewDoneRef.current) {
      requestTodosCollapse()
    }
    setTodosExecuting((count) => Math.max(count, 3))
    window.cancelAnimationFrame(taskProgressFrameRef.current)
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) {
      setTaskProgress(100)
      taskProgressFrameRef.current = window.requestAnimationFrame(() => {
        hideTaskProgress()
      })
      return
    }
    setTaskProgress(0)
    taskProgressElapsedRef.current = 0
    const progressMs = scaleMs(TASK_PROGRESS_MS)
    let startedAt = performance.now()
    const tick = (now: number) => {
      if (pausedRef.current) {
        // Hold the clock while paused; keep the loop alive so resume continues.
        startedAt = now
        taskProgressFrameRef.current = window.requestAnimationFrame(tick)
        return
      }
      const elapsed = taskProgressElapsedRef.current + (now - startedAt)
      taskProgressElapsedRef.current = elapsed
      startedAt = now
      const t = Math.min(1, elapsed / progressMs)
      setTaskProgress(Math.round(t * 100))
      if (t < 1) {
        taskProgressFrameRef.current = window.requestAnimationFrame(tick)
        return
      }
      hideTaskProgress()
    }
    taskProgressFrameRef.current = window.requestAnimationFrame(tick)
  }, [hideTaskProgress, requestTodosCollapse, scaleMs])

  const collapseTodosIfObscured = useCallback((fromExpand = false) => {
    if (
      (!fromExpand && skipAutoCollapseRef.current) ||
      !todosPreviewDoneRef.current ||
      todosCollapsedRef.current ||
      todosClosingRef.current ||
      !canCollapseTodos
    ) {
      return
    }
    const body = bodyRef.current
    const todos = todosUnfoldRef.current
    if (!body || !todos) {
      return
    }
    const thread = body.querySelector('.mocha-thread')
    const contentBottom = (thread ?? body).getBoundingClientRect().bottom
    const todosTop = todos.getBoundingClientRect().top
    if (
      contentBottom > todosTop + 1 ||
      body.scrollHeight > body.clientHeight + 1
    ) {
      requestTodosCollapse()
    }
  }, [canCollapseTodos, requestTodosCollapse])

  const onRowExpandSettled = useCallback(() => {
    if (!followConversationRef.current) {
      return
    }
    collapseTodosIfObscured(true)
  }, [collapseTodosIfObscured])

  useEffect(() => {
    if (
      !showLiveUnfold ||
      !unfoldTodos ||
      startCollapsed ||
      todosCollapsed ||
      todosClosing ||
      skipAutoCollapseRef.current ||
      todosPreviewDoneRef.current
    ) {
      return
    }
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    let timer = 0
    const finish = () => {
      timer = 0
      if (pausedRef.current) {
        timer = window.setTimeout(finish, 120)
        return
      }
      todosPreviewDoneRef.current = true
      if (
        skipAutoCollapseRef.current ||
        todosCollapsedRef.current ||
        todosClosingRef.current
      ) {
        if (pendingTodosPreviewAdvanceRef.current) {
          pendingTodosPreviewAdvanceRef.current = false
          scheduleFrameComplete(0)
        }
        return
      }
      requestTodosCollapse()
    }
    timer = window.setTimeout(
      finish,
      reduceMotion ? 0 : scaleMs(TODOS_PREVIEW_MS),
    )
    return () => window.clearTimeout(timer)
  }, [
    showLiveUnfold,
    unfoldTodos,
    startCollapsed,
    todosCollapsed,
    todosClosing,
    thinkingComplete,
    requestTodosCollapse,
    scheduleFrameComplete,
    scaleMs,
  ])

  // After Thinking: force Todos open for the preview window (all rounds).
  useLayoutEffect(() => {
    const justFinishedThinking =
      revealTodosAfterThinking &&
      thinkingComplete &&
      !wasThinkingCompleteRef.current
    wasThinkingCompleteRef.current = thinkingComplete
    if (!justFinishedThinking) {
      return
    }
    todosPreviewDoneRef.current = false
    skipAutoCollapseRef.current = false
    collapsedByActionRef.current = false
    todosCollapsedRef.current = false
    todosClosingRef.current = false
    setTodosCollapsed(false)
    setTodosClosing(false)
    setTodosMountId((id) => id + 1)
  }, [thinkingComplete, revealTodosAfterThinking])

  useEffect(() => {
    if (!unfoldTodos?.liveProgress) {
      return
    }
    const stopAt = unfoldTodos.liveProgress.stopAtExecuting
    if (todosExecuting >= stopAt) {
      return
    }
    const timer = window.setInterval(() => {
      setTodosExecuting((index) => index + 1)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [unfoldTodos, todosExecuting])

  useEffect(() => {
    if (
      !showLiveUnfold ||
      todosCollapsed ||
      todosClosing ||
      !unfoldTodos?.afterThinkingComplete
    ) {
      return
    }
    const todos = todosUnfoldRef.current
    if (!todos) {
      return
    }
    const onOpenEnd = (event: AnimationEvent) => {
      if (event.animationName !== 'todos-unfold-open') {
        return
      }
      collapseTodosIfObscured()
    }
    todos.addEventListener('animationend', onOpenEnd)
    return () => {
      todos.removeEventListener('animationend', onOpenEnd)
    }
  }, [
    showLiveUnfold,
    todosCollapsed,
    todosClosing,
    thinkingComplete,
    unfoldTodos?.afterThinkingComplete,
    collapseTodosIfObscured,
  ])

  useLayoutEffect(() => {
    if (idle || !turnKey) {
      pinBubbleRef.current = false
      userScrolledRef.current = false
      clearFeedSpacer()
      return
    }

    pinBubbleRef.current = true
    userScrolledRef.current = false
    lockedScrollTopRef.current = null
    writeSpacerHeight(0)
    feedHeightRef.current = null
    // One pin + one late frame for history/worked-for. No multi-second re-pin loop.
    pinCurrentUserTop()
    const frameId = window.requestAnimationFrame(() => {
      if (!userScrolledRef.current && pinBubbleRef.current) {
        pinCurrentUserTop()
      }
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [turnKey, idle, pinCurrentUserTop, clearFeedSpacer, writeSpacerHeight])

  // Brief absorb beat before the first processing row mounts each turn.
  useEffect(() => {
    if (idle || !turnKey) {
      setTurnAbsorbing(false)
      return
    }
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) {
      setTurnAbsorbing(false)
      return
    }
    setTurnAbsorbing(true)
    let timer = 0
    const finish = () => {
      timer = 0
      if (pausedRef.current) {
        timer = window.setTimeout(finish, 120)
        return
      }
      setTurnAbsorbing(false)
    }
    timer = window.setTimeout(finish, scaleMs(TURN_ABSORB_MS))
    return () => {
      window.clearTimeout(timer)
    }
  }, [turnKey, idle, scaleMs])

  // When feed grows/shrinks (tasks, history meta, or result), adjust spacer
  // before paint so scrollHeight stays stable and the pin offset holds.
  useLayoutEffect(() => {
    if (idle || !turnKey) {
      return
    }
    compensateFeedLayout()
  }, [
    step.id,
    step.tasks.length,
    step.followOnTasks?.length,
    step.showResult,
    resultPhase,
    historyWorkedFor.length,
    turnAbsorbing,
    idle,
    turnKey,
    compensateFeedLayout,
  ])

  // Keep scroll locked to the turn-start pin; only unlock on user wheel/touch
  // or when the result starts (stay put — no auto jump to the report).
  useLayoutEffect(() => {
    if (idle || !turnKey) {
      return
    }
    const body = bodyRef.current
    const feed = body?.querySelector('.mocha-panel-feed')
    if (!body || !(feed instanceof HTMLElement)) {
      return
    }

    const onUserScrollIntent = () => {
      userScrolledRef.current = true
      pinBubbleRef.current = false
      lockedScrollTopRef.current = null
    }

    const onScroll = () => {
      if (applyingScrollRef.current || userScrolledRef.current) {
        return
      }
      const locked = lockedScrollTopRef.current
      if (locked != null && body.scrollTop !== locked) {
        setBodyScrollTop(locked)
      }
    }

    const observer = new ResizeObserver(() => {
      compensateFeedLayout()
    })
    observer.observe(feed)
    body.addEventListener('scroll', onScroll, { passive: true })
    body.addEventListener('wheel', onUserScrollIntent, { passive: true })
    body.addEventListener('touchmove', onUserScrollIntent, { passive: true })

    return () => {
      observer.disconnect()
      body.removeEventListener('scroll', onScroll)
      body.removeEventListener('wheel', onUserScrollIntent)
      body.removeEventListener('touchmove', onUserScrollIntent)
    }
  }, [turnKey, idle, compensateFeedLayout, setBodyScrollTop])

  const resultUnlockedRef = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (!step.showResult || resultPhase < 1) {
      if (!step.showResult) {
        resultUnlockedRef.current = null
      }
      return
    }
    if (resultUnlockedRef.current === step.id) {
      return
    }
    resultUnlockedRef.current = step.id
    // Stop forcing the turn-start pin. Do not clear spacer or change scrollTop —
    // result height should eat the spacer via compensateFeedLayout instead.
    pinBubbleRef.current = false
    userScrolledRef.current = true
    lockedScrollTopRef.current = null
  }, [step.id, step.showResult, resultPhase])

  // After the result finishes revealing, drop leftover pin spacer so the
  // report is not left sitting above a tall empty region.
  useLayoutEffect(() => {
    if (!step.showResult || resultPhase < resultItemCount) {
      return
    }
    clearFeedSpacer()
  }, [step.showResult, resultPhase, resultItemCount, clearFeedSpacer])

  useLayoutEffect(() => {
    if (!displayWorkedFor || workedFor === displayWorkedFor) {
      return
    }
    setWorkedFor(displayWorkedFor)
  }, [displayWorkedFor, workedFor])

  useEffect(() => {
    if (!step.showResult || !step.animateResult) {
      return
    }
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) {
      setResultPhase(resultItemCount)
      return
    }
    setResultPhase(0)
    const timers = liveBlocks.map((_, index) =>
      window.setTimeout(() => setResultPhase(index + 1), 80 + index * 100),
    )
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [step.id, step.showResult, step.animateResult, resultItemCount])

  useEffect(() => {
    if (!onFrameComplete || !step.showResult) {
      return
    }
    const hasLiveTask =
      step.tasks.some((task) => task.mode === 'processing') ||
      Boolean(step.followOnTasks?.some((task) => task.mode === 'processing'))
    if (hasLiveTask) {
      return
    }
    if (step.animateResult && resultPhase < resultItemCount) {
      return
    }
    scheduleFrameComplete(120)
  }, [
    onFrameComplete,
    step.id,
    step.showResult,
    step.animateResult,
    step.tasks,
    step.followOnTasks,
    resultPhase,
    resultItemCount,
    scheduleFrameComplete,
  ])

  useEffect(() => {
    if (!qaIntro || step.showQaCard) {
      return
    }
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const advanceId = window.setTimeout(
      () => scheduleFrameComplete(0),
      reduceMotion ? 0 : QA_REVEAL_MS + 80,
    )
    return () => {
      window.clearTimeout(advanceId)
    }
  }, [qaIntro, step.showQaCard, scheduleFrameComplete])

  useEffect(() => {
    return () => {
      if (frameCompleteTimerRef.current) {
        window.clearTimeout(frameCompleteTimerRef.current)
      }
      if (qaBridgeTimerRef.current) {
        window.clearTimeout(qaBridgeTimerRef.current)
      }
      window.cancelAnimationFrame(taskProgressFrameRef.current)
    }
  }, [])

  const todosChip = Boolean(
    showLiveUnfold && unfoldTodos && todosCollapsed && !todosClosing,
  )
  const todosLeftMeta = !todosChip
    ? null
    : taskProgress != null
      ? <TaskProgress percent={taskProgress} />
      : step.showResult && displayWorkedFor
        ? <p className="mocha-todos-worked">{displayWorkedFor}</p>
        : <WorkingPulse />

  return (
    <section className="mocha-panel" aria-label="Mocha">
      <MochaHeader title={header?.title} />

      <div className="mocha-panel-body" ref={bodyRef}>
        {idle ? (
          <MochaIdle {...idleContent} onSelect={onIdleSelect} />
        ) : (
          <>
          <div className="mocha-panel-feed">
        {step.history?.map((turn, turnIndex) => (
          <CompletedTurn
            key={`history-${turnIndex}`}
            turn={turn}
            workedFor={
              historyWorkedFor[turnIndex] ??
              (turnIndex === historyWorkedFor.length
                ? pendingHistoryWorkedRef.current
                : null)
            }
            selectedStep={selectedThinkingStep}
            selectedStepText={selectedThinkingStep?.text}
            onStepSelect={onThinkingStepSelect}
          />
        ))}
        {currentUser ? (
        <div className="mocha-user-block" ref={currentUserRef}>
          <ChatBubble variant="user">{currentUser.text}</ChatBubble>
        </div>
        ) : null}

        <div
          className={
            showQaCard && !step.followOnTasks
              ? 'mocha-thread mocha-thread-qa'
              : 'mocha-thread'
          }
        >
          {turnAbsorbing ? (
            <div className="mocha-absorb">
              <AbsorbPulse />
            </div>
          ) : null}
          {!turnAbsorbing && step.tasks.length ? (
          <div className="mocha-task-list">
            {step.tasks.map((task, index) => (
              <TaskRow
                key={`${turnKey ?? 'live'}-${task.type}-${index}`}
                task={task}
                paceScale={paceScale}
                paused={paused}
                selectedStep={selectedThinkingStep}
                selectedStepText={selectedThinkingStep?.text}
                onStepSelect={onThinkingStepSelect}
                onLiveComplete={() => {
                  if (revealTodosAfterThinking) {
                    setThinkingComplete(true)
                    // Hold the next frame until Todos have previewed.
                    pendingTodosPreviewAdvanceRef.current = true
                    return
                  }
                  const nextShowsResult = Boolean(nextStep?.showResult)
                  if (
                    nextShowsResult &&
                    !todosCollapsedRef.current &&
                    !todosClosingRef.current
                  ) {
                    pendingResultAdvanceRef.current = true
                    const reduceMotion = window.matchMedia(
                      '(prefers-reduced-motion: reduce)',
                    ).matches
                    window.setTimeout(
                      () => {
                        if (!pendingResultAdvanceRef.current) {
                          return
                        }
                        requestTodosCollapse()
                        window.setTimeout(() => {
                          if (pendingResultAdvanceRef.current) {
                            pendingResultAdvanceRef.current = false
                            scheduleFrameComplete(0)
                          }
                        }, reduceMotion ? 0 : TODOS_MORPH_MS + 80)
                      },
                      reduceMotion ? 0 : scaleMs(RESULT_COLLAPSE_BEAT_MS),
                    )
                    return
                  }
                  scheduleFrameComplete(LIVE_FRAME_HOLD_MS)
                }}
                onActiveStepChange={(active) => {
                  if (active.liveBrand || active.text === 'MMFold is Running') {
                    startTaskProgress()
                  }
                }}
                onExpandSettled={onRowExpandSettled}
              />
            ))}
          </div>
          ) : null}
          {!turnAbsorbing && step.followOnTasks?.length ? (
            <div className="mocha-task-list">
              {step.followOnTasks.map((task, index) => (
                <TaskRow
                  key={`${turnKey ?? 'live'}-follow-${task.type}-${index}`}
                  task={task}
                  paceScale={paceScale}
                  paused={paused}
                  selectedStep={selectedThinkingStep}
                  selectedStepText={selectedThinkingStep?.text}
                  onStepSelect={onThinkingStepSelect}
                  onLiveComplete={() => {
                    if (unfoldTodos?.completeAfterThinking) {
                      setTodosExecuting(unfoldTodos.items.length)
                    }
                    const nextShowsResult = Boolean(nextStep?.showResult)
                    if (
                      nextShowsResult &&
                      !todosCollapsedRef.current &&
                      !todosClosingRef.current
                    ) {
                      pendingResultAdvanceRef.current = true
                      const reduceMotion = window.matchMedia(
                        '(prefers-reduced-motion: reduce)',
                      ).matches
                      window.setTimeout(
                        () => {
                          if (!pendingResultAdvanceRef.current) {
                            return
                          }
                          requestTodosCollapse()
                          window.setTimeout(() => {
                            if (pendingResultAdvanceRef.current) {
                              pendingResultAdvanceRef.current = false
                              scheduleFrameComplete(0)
                            }
                          }, reduceMotion ? 0 : TODOS_MORPH_MS + 80)
                        },
                        reduceMotion ? 0 : scaleMs(RESULT_COLLAPSE_BEAT_MS),
                      )
                      return
                    }
                    scheduleFrameComplete(LIVE_FRAME_HOLD_MS)
                  }}
                  onExpandSettled={onRowExpandSettled}
                />
              ))}
            </div>
          ) : null}
          {!turnAbsorbing && showLiveUnfold && unfoldTodos ? (
            <TodosSlot left={todosLeftMeta}>
              <TodosUnfold
                key={todosMountId}
                ref={todosUnfoldRef}
                items={todosItems}
                closing={todosClosing}
                asChip={todosCollapsed && !todosClosing}
                paused={todosPaused}
                chipVariant={todosComplete ? 'complete' : 'processing'}
                chipStatus={todosFoldStatus}
                onClose={canCollapseTodos ? requestTodosCollapse : undefined}
                onChipExpand={
                  todosCollapsed && !todosClosing
                    ? () => {
                        if (collapsedByActionRef.current) {
                          skipAutoCollapseRef.current = true
                        }
                        todosClosingRef.current = false
                        todosCollapsedRef.current = false
                        setTodosClosing(false)
                        setTodosCollapsed(false)
                        setTodosMountId((id) => id + 1)
                      }
                    : undefined
                }
                onCloseAnimationEnd={finishTodosCollapse}
              />
            </TodosSlot>
          ) : null}
          {foldTodos ? (
            <TodosSlot
              left={
                displayWorkedFor ? (
                  <p className="mocha-todos-worked">{displayWorkedFor}</p>
                ) : null
              }
            >
              <TodosFold
                variant={foldTodos.variant}
                status={foldTodos.status}
              />
            </TodosSlot>
          ) : null}
          {step.showResult && resultPhase > 0 ? (
            <div className="mocha-result-anchor">
              <ReportBody
                result={liveResult}
                visibleCount={resultPhase}
                animate={Boolean(step.animateResult)}
                selectedId={selectedThinkingStep?.text}
                onHitSelect={onThinkingStepSelect}
                showMeta={resultPhase >= resultItemCount}
                renderSlot={renderReportSlot}
              />
            </div>
          ) : null}
          {showQaCard ? (
            <QACard
              initialConfirmed={Boolean(step.qaStartConfirmed)}
              onSubmit={() => scheduleFrameComplete(80)}
            />
          ) : null}
        </div>
        </div>
        <div
          className="mocha-feed-spacer"
          ref={feedSpacerRef}
          aria-hidden="true"
        />
        </>
        )}
      </div>

      <Composer
        compact={!idle}
        action={idle || !playing || paused ? 'send' : 'stop'}
        paused={paused}
        value={draft}
        hint={hint}
        onChange={onDraftChange}
        onSubmit={onSubmit}
        onPause={onPause}
        placeholder={composerPlaceholder}
      />

      {idle ? <p className="mocha-disclaimer">{disclaimerText ?? disclaimer}</p> : null}
    </section>
  )
}
