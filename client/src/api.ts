import type { Message } from './types'

export async function fetchMessages(): Promise<Message[]> {
  const res = await fetch('/api/messages')
  if (!res.ok) {
    throw new Error(`Mesajlar alınamadı (HTTP ${res.status})`)
  }
  return res.json()
}

export async function createMessage(token: string, text: string): Promise<Message> {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.fields?.text ?? body?.message ?? 'Mesaj gönderilemedi')
  }
  return res.json()
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Giriş yapılamadı')
  }
  const data: { token: string } = await res.json()
  return data.token
}
