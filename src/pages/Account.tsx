import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { getMe, getOrders, LOGOUT_URL, SHOPIFY_LOGIN_URL } from '@/lib/backend/client'
import type { CustomerProfile, OrderSummary } from '@/types/backend'

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(
    Number(amount),
  )
}

export function Account() {
  const navigate = useNavigate()
  const { addItems } = useCart()

  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getMe()
      .then(async (me) => {
        if (cancelled) return
        setProfile(me)

        if (me) {
          const fetchedOrders = await getOrders()
          if (!cancelled) setOrders(fetchedOrders ?? [])
        }
      })
      .catch((error) => console.error('Failed to load account', error))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleReorder(order: OrderSummary) {
    const lines = order.lineItems
      .filter((item) => item.variantId !== null)
      .map((item) => ({ merchandiseId: item.variantId as string, quantity: item.quantity }))

    if (lines.length === 0) return

    setReorderingId(order.id)
    try {
      await addItems(lines)
      navigate('/cart')
    } finally {
      setReorderingId(null)
    }
  }

  if (isLoading) {
    return <p className="p-8 text-muted-foreground">Loading account…</p>
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in with your Shopify account to view order history and reorder in one click.
        </p>
        <Button className="mt-6" asChild>
          <a href={SHOPIFY_LOGIN_URL}>Sign in with Shopify</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {profile.firstName ? `Welcome back, ${profile.firstName}` : 'Your account'}
          </h1>
          {profile.email && <p className="text-muted-foreground">{profile.email}</p>}
        </div>
        <Button variant="outline" asChild>
          <a href={LOGOUT_URL}>Sign out</a>
        </Button>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Order history</h2>

      {orders.length === 0 ? (
        <p className="mt-2 text-muted-foreground">No past orders yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{order.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.processedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {formatMoney(order.totalPrice.amount, order.totalPrice.currencyCode)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleReorder(order)}
                    disabled={reorderingId === order.id}
                  >
                    {reorderingId === order.id ? 'Adding…' : 'Reorder'}
                  </Button>
                </div>
              </div>
              <ul className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
                {order.lineItems.map((item, index) => (
                  <li key={index}>
                    {item.quantity}× {item.title}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
