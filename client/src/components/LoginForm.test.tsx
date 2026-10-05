import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { jsonResponse } from '../test/fakeResponse'
import LoginForm from './LoginForm'

test('kayit modunda once kayit, sonra giris istegi atilir ve token iletilir', async () => {
  const user = userEvent.setup()
  const fetchMock = vi.fn(async (url: string) => {
    if (url === '/auth/register') return jsonResponse({ id: 1, email: 'yeni@example.com' }, 201)
    if (url === '/auth/login') return jsonResponse({ token: 'fake-token' })
    throw new Error(`Beklenmeyen istek: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  const onLogin = vi.fn()

  render(<LoginForm onLogin={onLogin} />)

  await user.click(screen.getByRole('button', { name: 'Hesabın yok mu? Kayıt ol' }))
  await user.type(screen.getByLabelText('E-posta'), 'yeni@example.com')
  await user.type(screen.getByLabelText('Şifre'), 'parola1234')
  await user.click(screen.getByRole('button', { name: 'Kayıt ol' }))

  await vi.waitFor(() => expect(onLogin).toHaveBeenCalledWith('fake-token'))
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/auth/register', '/auth/login'])
})

test('kayit hatasi kullaniciya gosterilir', async () => {
  const user = userEvent.setup()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => jsonResponse({ error: true, message: 'Bu e-posta zaten kayitli' }, 409)),
  )
  const onLogin = vi.fn()

  render(<LoginForm onLogin={onLogin} />)

  await user.click(screen.getByRole('button', { name: 'Hesabın yok mu? Kayıt ol' }))
  await user.type(screen.getByLabelText('E-posta'), 'var@example.com')
  await user.type(screen.getByLabelText('Şifre'), 'parola1234')
  await user.click(screen.getByRole('button', { name: 'Kayıt ol' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Bu e-posta zaten kayitli')
  expect(onLogin).not.toHaveBeenCalled()
})
