import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import type { Message } from '../types'
import MessageList from './MessageList'

const messages: Message[] = [
  { id: 2, author: 'ayse', text: 'Harika bir site!', createdAt: '2026-09-26 15:10:00' },
  { id: 1, author: 'mehmet', text: 'Merhaba herkese', createdAt: '2026-09-26 14:30:00' },
]

describe('MessageList', () => {
  test('dolu liste: her mesaj yazari ve metniyle render edilir', () => {
    render(<MessageList messages={messages} loading={false} error={null} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Harika bir site!')).toBeInTheDocument()
    expect(screen.getByText('mehmet')).toBeInTheDocument()
  })

  test('bos liste: "Ilk mesaji sen yaz!" mesaji gosterilir', () => {
    render(<MessageList messages={[]} loading={false} error={null} />)

    expect(screen.getByText(/İlk mesajı sen yaz!/)).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })
})
