import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Badge } from './badge'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Running</Badge>)

    expect(screen.getByText('Running')).toBeInTheDocument()
  })
})
