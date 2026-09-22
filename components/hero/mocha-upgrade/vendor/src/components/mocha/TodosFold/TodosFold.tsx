import { Icon } from '../Icon/Icon'
import iconTodos from '../../../assets/mocha/icon-todos.svg'
import iconSuccess from '../../../assets/mocha/icon-success.svg'
import iconChevronDown from '../../../assets/mocha/icon-chevron-down.svg'
import iconLoading from '../../../assets/mocha/icon-loading.png'
import './TodosFold.css'

type TodosFoldProps = {
  variant: 'processing' | 'complete'
  status: string
  paused?: boolean
  embedded?: boolean
  onExpand?: () => void
}

export function TodosFold({
  variant,
  status,
  paused,
  embedded,
  onExpand,
}: TodosFoldProps) {
  const body = (
    <>
      <div className="todos-fold-left">
        <Icon src={iconTodos} width={16} height={16} />
        <p
          className={
            variant === 'processing' ? 'todos-fold-title-live' : 'todos-fold-title'
          }
        >
          Todos
        </p>
        {variant === 'processing' ? (
          paused ? (
            <span className="todos-paused-mark" aria-hidden />
          ) : (
            <span className="todos-fold-spinner">
              <Icon src={iconLoading} width={12} height={12} />
            </span>
          )
        ) : (
          <Icon src={iconSuccess} width={12} height={12} />
        )}
      </div>
      <div className="todos-fold-right">
        <p className="todos-fold-status">{status}</p>
        <span className="todos-fold-chevron">
          <Icon src={iconChevronDown} width={14} height={14} />
        </span>
      </div>
    </>
  )

  if (onExpand) {
    return (
      <button
        type="button"
        className={
          embedded
            ? 'todos-fold todos-fold-toggle todos-fold-embedded'
            : 'todos-fold todos-fold-toggle'
        }
        aria-expanded="false"
        onClick={onExpand}
      >
        {body}
      </button>
    )
  }

  return (
    <div className={embedded ? 'todos-fold todos-fold-embedded' : 'todos-fold'}>
      {body}
    </div>
  )
}
