import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { Home } from './Home'

vi.mock('@/lib/shopify', () => ({
  getProducts: vi.fn(),
}))

import { getProducts } from '@/lib/shopify'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the hero heading and CTAs', () => {
    vi.mocked(getProducts).mockRejectedValue(new Error('not configured'))
    renderHome()

    expect(screen.getByRole('heading', { name: /built from the ground up/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shop socks/i })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: /learn more/i })).toHaveAttribute('href', '/about')
  })

  it('falls back to placeholder products when the Storefront API is not configured', async () => {
    vi.mocked(getProducts).mockRejectedValue(new Error('not configured'))
    renderHome()

    expect(await screen.findByText('Aloha Runner')).toBeInTheDocument()
    expect(screen.getByText('Alpine Series')).toBeInTheDocument()
  })

  it('renders live products once the Storefront API responds', async () => {
    vi.mocked(getProducts).mockResolvedValue([
      {
        id: 'gid://shopify/Product/9',
        handle: 'summit-crew',
        title: 'Summit Crew',
        description: 'Heavyweight mountaineering sock.',
        tags: ['Hiking'],
        featuredImage: null,
        images: [],
        priceRange: {
          minVariantPrice: { amount: '40.00', currencyCode: 'USD' },
          maxVariantPrice: { amount: '40.00', currencyCode: 'USD' },
        },
        variants: [],
      },
    ])

    renderHome()

    expect(await screen.findByText('Summit Crew')).toBeInTheDocument()
    expect(screen.getByText('$40.00')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Aloha Runner')).not.toBeInTheDocument())
  })
})
