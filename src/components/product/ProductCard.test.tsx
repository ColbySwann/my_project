import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ProductCard } from './ProductCard'

function renderCard(props: Partial<Parameters<typeof ProductCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ProductCard
        handle="aloha-runner"
        title="Aloha Runner"
        category="Running"
        subtitle="Merino / Nylon Blend"
        price="$34"
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('ProductCard', () => {
  it('renders the product title, price, category, and subtitle', () => {
    renderCard()

    expect(screen.getByText('Aloha Runner')).toBeInTheDocument()
    expect(screen.getByText('$34')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Merino / Nylon Blend')).toBeInTheDocument()
  })

  it('links to the product detail page for its handle', () => {
    renderCard()

    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/aloha-runner')
  })

  it('renders a placeholder icon when no image is provided', () => {
    const { container } = renderCard({ imageUrl: undefined })

    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders the product image when an image url is provided', () => {
    renderCard({ imageUrl: 'https://cdn/aloha.jpg' })

    expect(screen.getByRole('img', { name: 'Aloha Runner' })).toHaveAttribute(
      'src',
      'https://cdn/aloha.jpg',
    )
  })
})
