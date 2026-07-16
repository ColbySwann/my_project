import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { Account } from './Account'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockAddItems = vi.fn()
vi.mock('@/hooks/use-cart', () => ({
  useCart: () => ({ addItems: mockAddItems }),
}))

vi.mock('@/lib/backend/client', () => ({
  getMe: vi.fn(),
  getOrders: vi.fn(),
  SHOPIFY_LOGIN_URL: '/oauth2/authorization/shopify',
  LOGOUT_URL: '/logout',
}))

import { getMe, getOrders } from '@/lib/backend/client'

function renderAccount() {
  return render(
    <MemoryRouter>
      <Account />
    </MemoryRouter>,
  )
}

describe('Account', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a sign-in prompt when the customer is not authenticated', async () => {
    vi.mocked(getMe).mockResolvedValue(null)
    renderAccount()

    expect(await screen.findByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in with shopify/i })).toHaveAttribute(
      'href',
      '/oauth2/authorization/shopify',
    )
    expect(getOrders).not.toHaveBeenCalled()
  })

  it('shows the profile and order history when authenticated', async () => {
    vi.mocked(getMe).mockResolvedValue({
      id: 'gid://shopify/Customer/1',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    })
    vi.mocked(getOrders).mockResolvedValue([
      {
        id: 'gid://shopify/Order/1',
        name: '#1001',
        processedAt: '2026-06-01T12:00:00Z',
        totalPrice: { amount: '34.00', currencyCode: 'USD' },
        lineItems: [
          {
            title: 'Aloha Runner',
            quantity: 1,
            variantId: 'gid://shopify/ProductVariant/1',
            imageUrl: null,
            price: { amount: '34.00', currencyCode: 'USD' },
          },
        ],
      },
    ])

    renderAccount()

    expect(await screen.findByRole('heading', { name: /welcome back, jane/i })).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('#1001')).toBeInTheDocument()
    expect(screen.getByText('$34.00')).toBeInTheDocument()
    expect(screen.getByText(/1× Aloha Runner/)).toBeInTheDocument()
  })

  it('reorders by adding all variant lines to the cart and navigating to /cart', async () => {
    vi.mocked(getMe).mockResolvedValue({
      id: 'gid://shopify/Customer/1',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    })
    vi.mocked(getOrders).mockResolvedValue([
      {
        id: 'gid://shopify/Order/1',
        name: '#1001',
        processedAt: '2026-06-01T12:00:00Z',
        totalPrice: { amount: '34.00', currencyCode: 'USD' },
        lineItems: [
          {
            title: 'Aloha Runner',
            quantity: 2,
            variantId: 'gid://shopify/ProductVariant/1',
            imageUrl: null,
            price: { amount: '34.00', currencyCode: 'USD' },
          },
          {
            title: 'Discontinued Sock',
            quantity: 1,
            variantId: null,
            imageUrl: null,
            price: { amount: '10.00', currencyCode: 'USD' },
          },
        ],
      },
    ])
    mockAddItems.mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderAccount()

    await user.click(await screen.findByRole('button', { name: /reorder/i }))

    await waitFor(() =>
      expect(mockAddItems).toHaveBeenCalledWith([
        { merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 2 },
      ]),
    )
    expect(mockNavigate).toHaveBeenCalledWith('/cart')
  })
})
