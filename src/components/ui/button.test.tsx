import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from './button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Shop Socks</Button>)

    expect(screen.getByRole('button', { name: 'Shop Socks' })).toBeInTheDocument()
  })

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)

    await user.click(screen.getByRole('button', { name: 'Click me' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)

    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })

  it('renders as the child element when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/products">Shop</a>
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Shop' })
    expect(link).toHaveAttribute('href', '/products')
  })
})
