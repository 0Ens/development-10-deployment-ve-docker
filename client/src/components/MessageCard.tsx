import type { Message } from '../types'

type MessageCardProps = {
  message: Message
}

function MessageCard({ message }: MessageCardProps) {
  return (
    <article className="card">
      <header>
        <strong>{message.author}</strong>
        <time dateTime={message.createdAt}>{message.createdAt}</time>
      </header>
      <p>{message.text}</p>
    </article>
  )
}

export default MessageCard
