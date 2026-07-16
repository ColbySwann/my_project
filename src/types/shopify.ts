export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface ShopifyImage {
  url: string
  altText: string | null
  width: number
  height: number
}

export interface ShopifyProductVariant {
  id: string
  title: string
  availableForSale: boolean
  price: ShopifyMoney
  selectedOptions: { name: string; value: string }[]
  image: ShopifyImage | null
}

export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  featuredImage: ShopifyImage | null
  images: ShopifyImage[]
  priceRange: {
    minVariantPrice: ShopifyMoney
    maxVariantPrice: ShopifyMoney
  }
  variants: ShopifyProductVariant[]
  tags: string[]
}

export interface CartLine {
  id: string
  quantity: number
  cost: {
    totalAmount: ShopifyMoney
  }
  merchandise: {
    id: string
    title: string
    product: {
      handle: string
      title: string
      featuredImage: ShopifyImage | null
    }
  }
}

export interface Cart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    subtotalAmount: ShopifyMoney
    totalAmount: ShopifyMoney
  }
  lines: CartLine[]
}
