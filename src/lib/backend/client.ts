import type { CustomerProfile, OrderSummary } from '@/types/backend'

// Full-page navigation, not a fetch: this kicks off the OAuth2 authorization
// code flow, which needs a real browser redirect to Shopify's hosted login.
export const SHOPIFY_LOGIN_URL = '/oauth2/authorization/shopify'
export const LOGOUT_URL = '/logout'

async function backendGet<T>(path: string): Promise<T | null> {
  const res = await fetch(path, { credentials: 'include' })

  if (res.status === 401) {
    return null
  }

  if (!res.ok) {
    throw new Error(`Backend request to ${path} failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export function getMe() {
  return backendGet<CustomerProfile>('/api/me')
}

export function getOrders() {
  return backendGet<OrderSummary[]>('/api/orders')
}
