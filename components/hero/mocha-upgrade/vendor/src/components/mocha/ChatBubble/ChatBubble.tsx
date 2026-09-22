import type { ReactNode } from 'react'
import './ChatBubble.css'

type ChatBubbleProps = {
  variant: 'user' | 'assistant'
  children: ReactNode
}

export function ChatBubble({ variant, children }: ChatBubbleProps) {
  return (
    <div className={`chat-bubble chat-bubble-${variant}`}>
      {typeof children === 'string' ? (
        <p className="chat-bubble-text">{children}</p>
      ) : (
        children
      )}
    </div>
  )
}
