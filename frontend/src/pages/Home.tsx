import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard'
import { getProducts } from '@/lib/shopify'
import type { ShopifyProduct } from '@/types/shopify'

const FALLBACK_PRODUCTS: ProductCardData[] = [
  {
    handle: 'aloha-runner',
    title: 'Aloha Runner',
    category: 'Running',
    subtitle: 'Merino / Nylon Blend',
    price: '$34',
  },
  {
    handle: 'alpine-series',
    title: 'Alpine Series',
    category: 'Hiking',
    subtitle: '100% Merino Wool',
    price: '$36',
  },
  {
    handle: 'trail-trainer',
    title: 'Trail Trainer',
    category: 'Training',
    subtitle: 'Cushioned Compression Knit',
    price: '$32',
  },
  {
    handle: 'ruck-ready',
    title: 'Ruck Ready',
    category: 'Military PT',
    subtitle: 'Reinforced Heel & Toe',
    price: '$38',
  },
]

function toCardData(product: ShopifyProduct): ProductCardData {
  return {
    handle: product.handle,
    title: product.title,
    category: product.tags[0] ?? 'Shop',
    subtitle: product.description.split('\n')[0] ?? '',
    price: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.priceRange.minVariantPrice.currencyCode,
    }).format(Number(product.priceRange.minVariantPrice.amount)),
    imageUrl: product.featuredImage?.url,
  }
}

export function Home() {
  const [products, setProducts] = useState<ProductCardData[]>(FALLBACK_PRODUCTS)

  useEffect(() => {
    let cancelled = false

    getProducts({ first: 4 })
      .then((fetched) => {
        if (!cancelled && fetched.length > 0) {
          setProducts(fetched.map(toCardData))
        }
      })
      .catch(() => {
        // Storefront API not configured yet — keep showing fallback products.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden bg-zinc-950 text-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <p className="text-sm font-medium tracking-widest text-amber-400 uppercase">
            Est. 2024 — Built for endurance
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-extrabold tracking-tight uppercase sm:text-6xl">
            Built from the ground up.
          </h1>
          <p className="mt-6 max-w-xl text-zinc-400">
            Premium performance socks engineered for running, training, hiking, military PT, and
            every long day on your feet.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200" asChild>
              <Link to="/products">
                Shop Socks
                <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 bg-transparent text-zinc-50 hover:bg-zinc-900 hover:text-zinc-50"
              asChild
            >
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium tracking-widest text-amber-600 uppercase">
              The Range
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight uppercase">
              Performance every style.
            </h2>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:flex"
          >
            View All
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.handle} {...product} />
          ))}
        </div>
      </section>
    </div>
  )
}
