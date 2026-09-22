import './TaskChip.css'

type TaskChipProps = {
  label: string
  live?: boolean
  selected?: boolean
  variant?: 'text' | 'tag'
  interactive?: boolean
  onSelect?: () => void
}

export function TaskChip({
  label,
  live = false,
  selected = false,
  variant = 'text',
  interactive = false,
  onSelect,
}: TaskChipProps) {
  const canInteract = Boolean(onSelect || interactive)
  const className = [
    'task-chip',
    variant === 'tag' ? 'task-chip-tag' : null,
    selected && variant === 'tag' ? 'task-chip-tag-selected' : null,
    live ? 'task-row-live' : null,
    canInteract ? 'task-chip-action' : null,
  ]
    .filter(Boolean)
    .join(' ')

  if (!canInteract) {
    return <span className={className}>{label}</span>
  }

  return (
    <span
      className={className}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        onSelect?.()
      }}
    >
      {label}
    </span>
  )
}
