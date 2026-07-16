import { describe, it, expect, vi, afterEach } from 'vitest'

import { getProducts, getProductByHandle } from './products'
import * as client from './client'

const RAW_PRODUCT = {
  id: 'gid://shopify/Product/1',
  handle: 'aloha-runner',
  title: 'Aloha Runner',
  description: 'A breathable running sock.',
  tags: ['Running'],
  featuredImage: { url: 'https://cdn/aloha.jpg', altText: null, width: 800, height: 800 },
  priceRange: {
    minVariantPrice: { amount: '34.00', currencyCode: 'USD' },
    maxVariantPrice: { amount: '34.00', currencyCode: 'USD' },
  },
  images: {
    edges: [
      { node: { url: 'https://cdn/aloha.jpg', altText: null, width: 800, height: 800 } },
    ],
  },
  variants: {
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/1',
          title: 'Default',
          availableForSale: true,
          price: { amount: '34.00', currencyCode: 'USD' },
          selectedOptions: [{ name: 'Size', value: 'M' }],
          image: null,
        },
      },
    ],
  },
}

describe('getProducts', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('flattens edges/nodes into a plain product array', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({
      products: { edges: [{ node: RAW_PRODUCT }] },
    })

    const products = await getProducts()

    expect(products).toHaveLength(1)
    expect(products[0]).toMatchObject({
      id: RAW_PRODUCT.id,
      handle: 'aloha-runner',
      title: 'Aloha Runner',
      tags: ['Running'],
    })
    expect(products[0].images).toEqual([RAW_PRODUCT.images.edges[0].node])
    expect(products[0].variants).toEqual([RAW_PRODUCT.variants.edges[0].node])
  })

  it('passes first/query options through to the fetch call', async () => {
    const fetchSpy = vi.spyOn(client, 'shopifyFetch').mockResolvedValue({
      products: { edges: [] },
    })

    await getProducts({ first: 8, query: 'tag:Running' })

    expect(fetchSpy).toHaveBeenCalledWith(expect.any(String), {
      first: 8,
      query: 'tag:Running',
    })
  })

  it('defaults to first: 20 when no options are given', async () => {
    const fetchSpy = vi.spyOn(client, 'shopifyFetch').mockResolvedValue({
      products: { edges: [] },
    })

    await getProducts()

    expect(fetchSpy).toHaveBeenCalledWith(expect.any(String), {
      first: 20,
      query: undefined,
    })
  })
})

describe('getProductByHandle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes a single product', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({ product: RAW_PRODUCT })

    const product = await getProductByHandle('aloha-runner')

    expect(product?.handle).toBe('aloha-runner')
    expect(product?.variants).toHaveLength(1)
  })

  it('returns null when the product does not exist', async () => {
    vi.spyOn(client, 'shopifyFetch').mockResolvedValue({ product: null })

    const product = await getProductByHandle('does-not-exist')

    expect(product).toBeNull()
  })
})
