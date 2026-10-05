import { useEffect, useState } from 'react'
import { fetchMessages } from './api'
import LoginForm from './components/LoginForm'
import MessageForm from './components/MessageForm'
import MessageList from './components/MessageList'
import type { Message } from './types'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // StrictMode effect'i gelistirmede iki kez calistirir; eski istegin sonucunu yok sayiyoruz.
    let ignore = false

    fetchMessages()
      .then((data) => {
        if (!ignore) setMessages(data)
      })
      .catch(() => {
        if (!ignore) setError('Mesajlar yüklenemedi. Sunucu çalışıyor mu?')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  function handleMessageCreated(message: Message) {
    setMessages([message, ...messages])
  }

  return (
    <main>
      <h1>Ziyaretçi Defteri</h1>
      {token ? (
        <>
          <MessageForm token={token} onMessageCreated={handleMessageCreated} />
          <button type="button" className="logout" onClick={() => setToken(null)}>
            Çıkış yap
          </button>
        </>
      ) : (
        <LoginForm onLogin={setToken} />
      )}
      <MessageList messages={messages} loading={loading} error={error} />
    </main>
  )
}

export default App
