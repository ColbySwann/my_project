import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { addCartLines, createCart, getCart, removeCartLines, updateCartLines } from '@/lib/shopify'
import type { Cart } from '@/types/shopify'

const CART_ID_STORAGE_KEY = 'socktical:cartId'

interface CartContextValue {
  cart: Cart | null
  isLoading: boolean
  addItem: (merchandiseId: string, quantity?: number) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const cartId = localStorage.getItem(CART_ID_STORAGE_KEY)

    if (!cartId) {
      setIsLoading(false)
      return
    }

    getCart(cartId)
      .then((existingCart) => {
        if (existingCart) {
          setCart(existingCart)
        } else {
          localStorage.removeItem(CART_ID_STORAGE_KEY)
        }
      })
      .catch((error) => console.error('Failed to load cart', error))
      .finally(() => setIsLoading(false))
  }, [])

  const addItem = useCallback(
    async (merchandiseId: string, quantity = 1) => {
      setIsLoading(true)
      try {
        const nextCart = cart
          ? await addCartLines(cart.id, [{ merchandiseId, quantity }])
          : await createCart([{ merchandiseId, quantity }])

        localStorage.setItem(CART_ID_STORAGE_KEY, nextCart.id)
        setCart(nextCart)
      } finally {
        setIsLoading(false)
      }
    },
    [cart],
  )

  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return
      setIsLoading(true)
      try {
        setCart(await updateCartLines(cart.id, [{ id: lineId, quantity }]))
      } finally {
        setIsLoading(false)
      }
    },
    [cart],
  )

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cart) return
      setIsLoading(true)
      try {
        setCart(await removeCartLines(cart.id, [lineId]))
      } finally {
        setIsLoading(false)
      }
    },
    [cart],
  )

  return (
    <CartContext.Provider value={{ cart, isLoading, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
