import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import App from './App'
import { jsonResponse } from './test/fakeResponse'
import type { Message } from './types'

const existing: Message = {
  id: 1,
  author: 'mehmet',
  text: 'Eski mesaj',
  createdAt: '2026-09-26 14:30:00',
}

describe('App', () => {
  test('hata durumu: API ulasilamazsa hata mesaji gosterilir', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Mesajlar yüklenemedi')
  })

  test('basarili gonderimden sonra liste guncellenir ve input temizlenir', async () => {
    const user = userEvent.setup()
    const created: Message = {
      id: 2,
      author: 'deneme',
      text: 'Yeni mesaj',
      createdAt: '2026-09-26 15:00:00',
    }

    // URL ve method'a gore API'yi taklit eden sahte fetch
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (url === '/api/messages' && options?.method === 'POST') return jsonResponse(created, 201)
      if (url === '/api/messages') return jsonResponse([existing])
      if (url === '/auth/login') return jsonResponse({ token: 'fake-token' })
      throw new Error(`Beklenmeyen istek: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    await screen.findByText('Eski mesaj')

    await user.type(screen.getByLabelText('E-posta'), 'deneme@example.com')
    await user.type(screen.getByLabelText('Şifre'), 'deneme1234')
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }))

    const textarea = await screen.findByLabelText('Mesajın')
    await user.type(textarea, 'Yeni mesaj')
    await user.click(screen.getByRole('button', { name: 'Gönder' }))

    await screen.findByText('Yeni mesaj', { selector: 'p' })
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Yeni mesaj')).toBeInTheDocument()
    expect(textarea).toHaveValue('')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }),
      }),
    )
  })
})
