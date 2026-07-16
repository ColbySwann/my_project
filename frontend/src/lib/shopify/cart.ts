import { shopifyFetch } from './client'
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  GET_CART_QUERY,
} from './mutations'
import type { Cart, CartLine } from '@/types/shopify'

interface RawEdge<T> {
  node: T
}

interface RawCart extends Omit<Cart, 'lines'> {
  lines: { edges: RawEdge<CartLine>[] }
}

interface UserError {
  field: string[] | null
  message: string
}

function normalizeCart(raw: RawCart): Cart {
  return {
    ...raw,
    lines: raw.lines.edges.map((edge) => edge.node),
  }
}

function assertNoErrors(userErrors: UserError[]) {
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).join('\n'))
  }
}

export interface CartLineInput {
  merchandiseId: string
  quantity: number
}

export async function createCart(lines: CartLineInput[] = []): Promise<Cart> {
  const data = await shopifyFetch<{
    cartCreate: { cart: RawCart; userErrors: UserError[] }
  }>(CART_CREATE_MUTATION, { lines })

  assertNoErrors(data.cartCreate.userErrors)
  return normalizeCart(data.cartCreate.cart)
}

export async function addCartLines(cartId: string, lines: CartLineInput[]): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: RawCart; userErrors: UserError[] }
  }>(CART_LINES_ADD_MUTATION, { cartId, lines })

  assertNoErrors(data.cartLinesAdd.userErrors)
  return normalizeCart(data.cartLinesAdd.cart)
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: RawCart; userErrors: UserError[] }
  }>(CART_LINES_UPDATE_MUTATION, { cartId, lines })

  assertNoErrors(data.cartLinesUpdate.userErrors)
  return normalizeCart(data.cartLinesUpdate.cart)
}

export async function removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesRemove: { cart: RawCart; userErrors: UserError[] }
  }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds })

  assertNoErrors(data.cartLinesRemove.userErrors)
  return normalizeCart(data.cartLinesRemove.cart)
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<{ cart: RawCart | null }>(GET_CART_QUERY, { cartId })
  return data.cart ? normalizeCart(data.cart) : null
}
