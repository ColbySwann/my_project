import { Link } from 'react-router-dom'
import { Footprints } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export interface ProductCardData {
  handle: string
  title: string
  category: string
  subtitle: string
  price: string
  imageUrl?: string | null
}

export function ProductCard({ handle, title, category, subtitle, price, imageUrl }: ProductCardData) {
  return (
    <Link
      to={`/products/${handle}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-colors hover:border-foreground/30"
    >
      <div className="relative flex aspect-square items-center justify-center bg-muted">
        <Badge className="absolute top-3 left-3 uppercase tracking-wide" variant="secondary">
          {category}
        </Badge>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <Footprints className="size-16 text-muted-foreground/40" strokeWidth={1} />
        )}
      </div>

      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{title}</h3>
          <span className="shrink-0 font-semibold">{price}</span>
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  )
}
