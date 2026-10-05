import type { Message } from '../types'
import MessageCard from './MessageCard'

type MessageListProps = {
  messages: Message[]
  loading: boolean
  error: string | null
}

function MessageList({ messages, loading, error }: MessageListProps) {
  if (loading) {
    return <p className="status">Yükleniyor...</p>
  }

  if (error) {
    return (
      <p className="status error" role="alert">
        {error}
      </p>
    )
  }

  if (messages.length === 0) {
    return <p className="status">Henüz mesaj yok. İlk mesajı sen yaz!</p>
  }

  return (
    <ul className="message-list">
      {messages.map((message) => (
        <li key={message.id}>
          <MessageCard message={message} />
        </li>
      ))}
    </ul>
  )
}

export default MessageList
