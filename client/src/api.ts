import type { Message } from './types'

// Canlida API baska bir adreste (Render) calisir; adres build sirasinda VITE_API_URL ile verilir.
// Lokalde bos kalir ve istekler Vite proxy uzerinden gider.
const API_URL = import.meta.env.VITE_API_URL ?? ''

export async function fetchMessages(): Promise<Message[]> {
  const res = await fetch(`${API_URL}/api/messages`)
  if (!res.ok) {
    throw new Error(`Mesajlar alınamadı (HTTP ${res.status})`)
  }
  return res.json()
}

export async function createMessage(token: string, text: string): Promise<Message> {
  const res = await fetch(`${API_URL}/api/messages`, {
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

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(
      body?.fields?.email ?? body?.fields?.password ?? body?.message ?? 'Kayıt yapılamadı',
    )
  }
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
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
