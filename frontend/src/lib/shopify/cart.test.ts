import { describe, it, expect, vi, afterEach } from 'vitest'

import { createCart, addCartLines, updateCartLines, removeCartLines, getCart } from './cart'
import * as client from './client'

const RAW_CART = {
  id: 'gid://shopify/Cart/1',
  checkoutUrl: 'https://socktical.myshopify.com/cart/c/1',
  totalQuantity: 1,
  cost: {
    subtotalAmount: { amount: '34.00', currencyCode: 'USD' },
    totalAmount: { amount: '34.00', currencyCode: 'USD' },
  },
  lines: {
    edges: [
      {
        node: {
          id: 'gid://shopify/CartLine/1',
          quantity: 1,
          cost: { totalAmount: { amount: '34.00', currencyCode: 'USD' } },
          merchandise: {
            id: 'gid://shopify/ProductVariant/1',
            title: 'Default',
            product: {
              handle: 'aloha-runner',
              title: 'Aloha Runner',
              featuredImage: null,
            },
          },
        },
      },
    ],
  },
}

describe('cart helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('createCart normalizes the returned cart', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({
      cartCreate: { cart: RAW_CART, userErrors: [] },
    })

    const cart = await createCart([{ merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 1 }])

    expect(cart.id).toBe(RAW_CART.id)
    expect(cart.lines).toEqual([RAW_CART.lines.edges[0].node])
  })

  it('createCart throws on userErrors', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({
      cartCreate: { cart: RAW_CART, userErrors: [{ field: ['lines'], message: 'Invalid quantity' }] },
    })

    await expect(createCart([])).rejects.toThrow('Invalid quantity')
  })

  it('addCartLines normalizes the returned cart', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({
      cartLinesAdd: { cart: RAW_CART, userErrors: [] },
    })

    const cart = await addCartLines(RAW_CART.id, [
      { merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 1 },
    ])

    expect(cart.totalQuantity).toBe(1)
  })

  it('updateCartLines normalizes the returned cart', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({
      cartLinesUpdate: { cart: RAW_CART, userErrors: [] },
    })

    const cart = await updateCartLines(RAW_CART.id, [{ id: 'gid://shopify/CartLine/1', quantity: 2 }])

    expect(cart.id).toBe(RAW_CART.id)
  })

  it('removeCartLines normalizes the returned cart', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({
      cartLinesRemove: { cart: RAW_CART, userErrors: [] },
    })

    const cart = await removeCartLines(RAW_CART.id, ['gid://shopify/CartLine/1'])

    expect(cart.id).toBe(RAW_CART.id)
  })

  it('getCart returns null when the cart no longer exists', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({ cart: null })

    const cart = await getCart('gid://shopify/Cart/expired')

    expect(cart).toBeNull()
  })
})
