import { shopifyFetch } from './client'
import { GET_PRODUCTS_QUERY, GET_PRODUCT_BY_HANDLE_QUERY } from './queries'
import type { ShopifyProduct } from '@/types/shopify'

interface RawEdge<T> {
  node: T
}

interface RawProduct {
  id: string
  handle: string
  title: string
  description: string
  tags: string[]
  featuredImage: ShopifyProduct['featuredImage']
  images: { edges: RawEdge<ShopifyProduct['images'][number]>[] }
  priceRange: ShopifyProduct['priceRange']
  variants: { edges: RawEdge<ShopifyProduct['variants'][number]>[] }
}

function normalizeProduct(raw: RawProduct): ShopifyProduct {
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    tags: raw.tags,
    featuredImage: raw.featuredImage,
    priceRange: raw.priceRange,
    images: raw.images.edges.map((edge) => edge.node),
    variants: raw.variants.edges.map((edge) => edge.node),
  }
}

export async function getProducts(options?: {
  first?: number
  query?: string
}): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<{ products: { edges: RawEdge<RawProduct>[] } }>(
    GET_PRODUCTS_QUERY,
    { first: options?.first ?? 20, query: options?.query },
  )

  return data.products.edges.map((edge) => normalizeProduct(edge.node))
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{ product: RawProduct | null }>(GET_PRODUCT_BY_HANDLE_QUERY, {
    handle,
  })

  return data.product ? normalizeProduct(data.product) : null
}
