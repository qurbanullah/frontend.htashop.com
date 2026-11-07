import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductGallerySlider } from './ProductGallerySlider'

const IMAGES = [
  'https://cdn.htashop.com/a.jpg',
  'https://cdn.htashop.com/b.jpg',
  'https://cdn.htashop.com/c.jpg',
]

function renderSlider(overrides: Partial<Parameters<typeof ProductGallerySlider>[0]> = {}) {
  const onOpen = vi.fn()
  const onIndexChange = vi.fn()

  render(
    <ProductGallerySlider
      images={IMAGES}
      alt="Cordless drill"
      index={0}
      onIndexChange={onIndexChange}
      onOpen={onOpen}
      openLabel="View larger image"
      {...overrides}
    />
  )

  return { onOpen, onIndexChange }
}

describe('ProductGallerySlider', () => {
  it('renders one slide per image', () => {
    renderSlider()

    expect(screen.getAllByRole('button', { name: /View larger image/ })).toHaveLength(3)
    expect(screen.getByAltText('Cordless drill')).toBeInTheDocument()
  })

  it('opens the tapped slide', async () => {
    const { onOpen } = renderSlider()

    const slides = screen.getAllByRole('button', { name: /View larger image/ })
    await userEvent.click(slides[1] as HTMLElement)

    expect(onOpen).toHaveBeenCalledWith(1)
  })

  it('steps forwards and wraps backwards with the arrow buttons', async () => {
    const { onIndexChange } = renderSlider({ showArrows: true })

    await userEvent.click(screen.getByRole('button', { name: 'Next image' }))
    expect(onIndexChange).toHaveBeenCalledWith(1)

    await userEvent.click(screen.getByRole('button', { name: 'Previous image' }))
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it('hides the arrows for a single image', () => {
    renderSlider({ images: [IMAGES[0] as string], showArrows: true })

    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument()
  })

  it('renders no slides when the product has no images', () => {
    renderSlider({ images: [] })

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
