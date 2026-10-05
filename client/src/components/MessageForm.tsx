import { useState, type FormEvent } from 'react'
import { createMessage } from '../api'
import type { Message } from '../types'

type MessageFormProps = {
  token: string
  onMessageCreated: (message: Message) => void
}

function MessageForm({ token, onMessageCreated }: MessageFormProps) {
  const [text, setText] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEmpty = text.trim() === ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isEmpty) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const message = await createMessage(token, text.trim())
      onMessageCreated(message)
      setText('')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Mesaj gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <form onSubmit={handleSubmit}>
        <label htmlFor="message-text">Mesajın</label>
        <textarea
          id="message-text"
          rows={3}
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {submitError && (
          <p className="field-error" role="alert">
            {submitError}
          </p>
        )}
        <button type="submit" disabled={isEmpty || submitting}>
          {submitting ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </form>
    </section>
  )
}

export default MessageForm
