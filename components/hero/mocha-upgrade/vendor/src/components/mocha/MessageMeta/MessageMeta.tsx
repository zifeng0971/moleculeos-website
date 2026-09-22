import { Icon } from '../Icon/Icon'
import iconCopy from '../../../assets/mocha/icon-copy.svg'
import iconExternalLink from '../../../assets/mocha/icon-external-link.svg'
import iconReset from '../../../assets/mocha/icon-reset.svg'
import iconMore from '../../../assets/mocha/icon-more.svg'
import './MessageMeta.css'

type MessageMetaProps = {
  onCopy?: () => void
  onShare?: () => void
  onRetry?: () => void
  onMore?: () => void
}

export function MessageMeta({
  onCopy,
  onShare,
  onRetry,
  onMore,
}: MessageMetaProps) {
  return (
    <div className="message-meta">
      <div className="message-meta-actions">
        <button
          type="button"
          className="message-meta-action"
          aria-label="复制"
          onClick={onCopy}
        >
          <Icon src={iconCopy} width={14} height={14} />
        </button>
        <button
          type="button"
          className="message-meta-action"
          aria-label="分享"
          onClick={onShare}
        >
          <Icon src={iconExternalLink} width={16} height={16} />
        </button>
        <button
          type="button"
          className="message-meta-action"
          aria-label="重试"
          onClick={onRetry}
        >
          <Icon src={iconReset} width={16} height={16} />
        </button>
        <button
          type="button"
          className="message-meta-action"
          aria-label="更多"
          onClick={onMore}
        >
          <Icon src={iconMore} width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
