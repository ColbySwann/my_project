import { describe, it, expect, vi, afterEach } from 'vitest'

import { getMe, getOrders } from './client'

describe('backend client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getMe returns null on a 401 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401, ok: false }))

    expect(await getMe()).toBeNull()
  })

  it('getMe returns the parsed profile on success', async () => {
    const profile = { id: 'gid://shopify/Customer/1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe' }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => profile }),
    )

    expect(await getMe()).toEqual(profile)
  })

  it('getMe throws on a non-401 error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 500, ok: false, statusText: 'Internal Server Error' }),
    )

    await expect(getMe()).rejects.toThrow(/500/)
  })

  it('sends credentials so the session cookie is included', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)

    await getOrders()

    expect(fetchMock).toHaveBeenCalledWith('/api/orders', { credentials: 'include' })
  })

  it('getOrders returns null on a 401 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401, ok: false }))

    expect(await getOrders()).toBeNull()
  })
})
