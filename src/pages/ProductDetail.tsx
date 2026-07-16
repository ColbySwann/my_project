import { useParams } from 'react-router-dom'

export function ProductDetail() {
  const { handle } = useParams<{ handle: string }>()

  return (
    <div>
      <p className="p-8 text-muted-foreground">Product detail for "{handle}" — coming soon.</p>
    </div>
  )
}
