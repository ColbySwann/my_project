export interface Money {
  amount: string
  currencyCode: string
}

export interface CustomerProfile {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
}

export interface OrderLineItem {
  title: string
  quantity: number
  variantId: string | null
  imageUrl: string | null
  price: Money
}

export interface OrderSummary {
  id: string
  name: string
  processedAt: string
  totalPrice: Money
  lineItems: OrderLineItem[]
}
