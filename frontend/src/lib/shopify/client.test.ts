import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { shopifyFetch } from './client'

describe('shopifyFetch', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('returns data on a successful response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { shop: { name: 'Socktical' } } }),
    }) as unknown as typeof fetch

    const result = await shopifyFetch<{ shop: { name: string } }>('query { shop { name } }')

    expect(result).toEqual({ shop: { name: 'Socktical' } })
  })

  it('sends the query and variables in the request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await shopifyFetch('query Q($id: ID!) { node(id: $id) { id } }', { id: 'gid://1' })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse(requestInit.body)
    expect(body.query).toContain('node(id: $id)')
    expect(body.variables).toEqual({ id: 'gid://1' })
  })

  it('throws when the HTTP response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }) as unknown as typeof fetch

    await expect(shopifyFetch('query {}')).rejects.toThrow(/500/)
  })

  it('throws when the response contains GraphQL errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ errors: [{ message: 'Field does not exist' }] }),
    }) as unknown as typeof fetch

    await expect(shopifyFetch('query {}')).rejects.toThrow('Field does not exist')
  })

  it('throws when the response has no data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch

    await expect(shopifyFetch('query {}')).rejects.toThrow(/no data/)
  })
})
