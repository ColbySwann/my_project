import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'

import { CartProvider, useCart } from './use-cart'
import type { Cart } from '@/types/shopify'

vi.mock('@/lib/shopify', () => ({
  createCart: vi.fn(),
  addCartLines: vi.fn(),
  updateCartLines: vi.fn(),
  removeCartLines: vi.fn(),
  getCart: vi.fn(),
}))

import { createCart, addCartLines, updateCartLines, removeCartLines, getCart } from '@/lib/shopify'

const CART_ID_STORAGE_KEY = 'socktical:cartId'

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 'gid://shopify/Cart/1',
    checkoutUrl: 'https://socktical.myshopify.com/cart/c/1',
    totalQuantity: 1,
    cost: {
      subtotalAmount: { amount: '34.00', currencyCode: 'USD' },
      totalAmount: { amount: '34.00', currencyCode: 'USD' },
    },
    lines: [],
    ...overrides,
  }
}

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('throws when used outside a CartProvider', () => {
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/)
  })

  it('starts with no cart when localStorage has no cart id', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.cart).toBeNull()
    expect(getCart).not.toHaveBeenCalled()
  })

  it('loads an existing cart from localStorage on mount', async () => {
    localStorage.setItem(CART_ID_STORAGE_KEY, 'gid://shopify/Cart/1')
    vi.mocked(getCart).mockResolvedValue(makeCart())

    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(getCart).toHaveBeenCalledWith('gid://shopify/Cart/1')
    expect(result.current.cart?.id).toBe('gid://shopify/Cart/1')
  })

  it('clears a stale cart id when the cart no longer exists', async () => {
    localStorage.setItem(CART_ID_STORAGE_KEY, 'gid://shopify/Cart/expired')
    vi.mocked(getCart).mockResolvedValue(null)

    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.cart).toBeNull()
    expect(localStorage.getItem(CART_ID_STORAGE_KEY)).toBeNull()
  })

  it('creates a new cart on the first addItem call', async () => {
    vi.mocked(createCart).mockResolvedValue(makeCart())

    const { result } = renderHook(() => useCart(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addItem('gid://shopify/ProductVariant/1', 1)
    })

    expect(createCart).toHaveBeenCalledWith([
      { merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 1 },
    ])
    expect(result.current.cart?.id).toBe('gid://shopify/Cart/1')
    expect(localStorage.getItem(CART_ID_STORAGE_KEY)).toBe('gid://shopify/Cart/1')
  })

  it('adds lines to an existing cart on subsequent addItem calls', async () => {
    localStorage.setItem(CART_ID_STORAGE_KEY, 'gid://shopify/Cart/1')
    vi.mocked(getCart).mockResolvedValue(makeCart())
    vi.mocked(addCartLines).mockResolvedValue(makeCart({ totalQuantity: 2 }))

    const { result } = renderHook(() => useCart(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addItem('gid://shopify/ProductVariant/2', 1)
    })

    expect(addCartLines).toHaveBeenCalledWith('gid://shopify/Cart/1', [
      { merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 1 },
    ])
    expect(createCart).not.toHaveBeenCalled()
    expect(result.current.cart?.totalQuantity).toBe(2)
  })

  it('addItems creates a new cart with multiple lines at once', async () => {
    vi.mocked(createCart).mockResolvedValue(makeCart({ totalQuantity: 2 }))

    const { result } = renderHook(() => useCart(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addItems([
        { merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 1 },
        { merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 1 },
      ])
    })

    expect(createCart).toHaveBeenCalledWith([
      { merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 1 },
      { merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 1 },
    ])
    expect(result.current.cart?.totalQuantity).toBe(2)
  })

  it('addItems is a no-op when given an empty list', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addItems([])
    })

    expect(createCart).not.toHaveBeenCalled()
    expect(addCartLines).not.toHaveBeenCalled()
  })

  it('updateItem is a no-op without a cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateItem('gid://shopify/CartLine/1', 3)
    })

    expect(updateCartLines).not.toHaveBeenCalled()
  })

  it('updateItem calls updateCartLines when a cart exists', async () => {
    localStorage.setItem(CART_ID_STORAGE_KEY, 'gid://shopify/Cart/1')
    vi.mocked(getCart).mockResolvedValue(makeCart())
    vi.mocked(updateCartLines).mockResolvedValue(makeCart({ totalQuantity: 3 }))

    const { result } = renderHook(() => useCart(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateItem('gid://shopify/CartLine/1', 3)
    })

    expect(updateCartLines).toHaveBeenCalledWith('gid://shopify/Cart/1', [
      { id: 'gid://shopify/CartLine/1', quantity: 3 },
    ])
    expect(result.current.cart?.totalQuantity).toBe(3)
  })

  it('removeItem calls removeCartLines when a cart exists', async () => {
    localStorage.setItem(CART_ID_STORAGE_KEY, 'gid://shopify/Cart/1')
    vi.mocked(getCart).mockResolvedValue(makeCart())
    vi.mocked(removeCartLines).mockResolvedValue(makeCart({ totalQuantity: 0 }))

    const { result } = renderHook(() => useCart(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.removeItem('gid://shopify/CartLine/1')
    })

    expect(removeCartLines).toHaveBeenCalledWith('gid://shopify/Cart/1', ['gid://shopify/CartLine/1'])
    expect(result.current.cart?.totalQuantity).toBe(0)
  })
})
