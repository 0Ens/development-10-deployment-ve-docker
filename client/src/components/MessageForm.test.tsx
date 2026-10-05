import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import MessageForm from './MessageForm'

test('bos ya da sadece bosluktan olusan mesaj gonderilemez', async () => {
  const user = userEvent.setup()
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  const onMessageCreated = vi.fn()

  render(<MessageForm token="fake-token" onMessageCreated={onMessageCreated} />)
  const button = screen.getByRole('button', { name: 'Gönder' })

  expect(button).toBeDisabled()

  await user.type(screen.getByLabelText('Mesajın'), '    ')
  expect(button).toBeDisabled()

  await user.click(button)
  expect(fetchMock).not.toHaveBeenCalled()
  expect(onMessageCreated).not.toHaveBeenCalled()
})
