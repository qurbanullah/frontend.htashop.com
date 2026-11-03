import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryVisual } from './CategoryVisual'

describe('CategoryVisual', () => {
  it('renders the category image when one is set', () => {
    const { container } = render(
      <CategoryVisual
        category={{
          name: 'Electronics',
          image: 'https://cdn.htashop.com/categories/electronics.png',
        }}
      />
    )

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn.htashop.com/categories/electronics.png'
    )
  })

  it('renders a curated icon and applies the brand colour', () => {
    const { container } = render(
      <CategoryVisual category={{ name: 'Electronics', icon: 'cpu', color: '#2563EB' }} />
    )

    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.firstElementChild).toHaveStyle({ color: '#2563EB' })
  })

  it('falls back to the initial when the icon key is unknown', () => {
    const { getByText } = render(
      <CategoryVisual category={{ name: 'Electronics', icon: 'not-a-real-icon' }} />
    )

    expect(getByText('E')).toBeInTheDocument()
  })
})
