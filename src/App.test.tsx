import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from './App'

vi.mock('@/lib/shopify', () => ({
  getProducts: vi.fn().mockRejectedValue(new Error('not configured')),
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('renders the Home page at /', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { name: /built from the ground up/i })).toBeInTheDocument()
  })

  it('renders the product listing page at /products', () => {
    renderAt('/products')

    expect(screen.getByText(/product listing/i)).toBeInTheDocument()
  })

  it('renders the product detail page at /products/:handle', () => {
    renderAt('/products/aloha-runner')

    expect(screen.getByText(/aloha-runner/)).toBeInTheDocument()
  })

  it('renders the cart page at /cart', () => {
    renderAt('/cart')

    expect(screen.getByText(/cart — coming soon/i)).toBeInTheDocument()
  })

  it('renders the not found page for unknown routes', () => {
    renderAt('/does-not-exist')

    expect(screen.getByText(/404/)).toBeInTheDocument()
  })

  it('always renders the shared header and footer', () => {
    renderAt('/products')

    expect(screen.getByRole('link', { name: 'Socktical' })).toBeInTheDocument()
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument()
  })
})
