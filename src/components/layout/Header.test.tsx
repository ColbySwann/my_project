import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { Header } from './Header'

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  it('renders the brand link back to home', () => {
    renderHeader()

    expect(screen.getByRole('link', { name: 'Socktical' })).toHaveAttribute('href', '/')
  })

  it('renders a cart link', () => {
    renderHeader()

    expect(screen.getByRole('link', { name: 'Cart' })).toHaveAttribute('href', '/cart')
  })

  it('opens the mobile nav sheet when the menu button is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('closes the mobile nav sheet after a link is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('link', { name: 'About' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
