import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProductThumbnailRail } from './ProductThumbnailRail'

const IMAGES = Array.from({ length: 8 }, (_, i) => `https://cdn.htashop.com/${i + 1}.jpg`)

function renderRail(index = 0) {
  const onSelect = vi.fn()

  render(<ProductThumbnailRail images={IMAGES} index={index} onSelect={onSelect} alt="Drill" />)

  return { onSelect }
}

describe('ProductThumbnailRail', () => {
  it('renders one thumbnail per image in a single track', () => {
    renderRail()

    expect(screen.getAllByRole('button', { name: /Show image/ })).toHaveLength(8)
  })

  it('pages the window with the arrows instead of scrolling', () => {
    renderRail()

    const track = screen.getByTestId('thumbnail-track')

    expect(track.style.transform).toBe('translateY(-0px)')

    fireEvent.click(screen.getByRole('button', { name: 'Next thumbnails' }))
    expect(track.style.transform).toBe('translateY(-88px)')

    fireEvent.click(screen.getByRole('button', { name: 'Previous thumbnails' }))
    expect(track.style.transform).toBe('translateY(-0px)')
  })

  it('keeps the selected image inside the visible window', () => {
    renderRail(7)

    // Eight images with four visible by default: the last window starts at index 4.
    expect(screen.getByTestId('thumbnail-track').style.transform).toBe('translateY(-352px)')
    expect(screen.getByRole('button', { name: 'Show image 8' })).toHaveAttribute(
      'aria-current',
      'true'
    )
  })

  it('selects a thumbnail when it is clicked', () => {
    const { onSelect } = renderRail()

    fireEvent.click(screen.getByRole('button', { name: 'Show image 3' }))

    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('renders nothing for a single image', () => {
    const { container } = render(
      <ProductThumbnailRail images={[IMAGES[0] as string]} index={0} onSelect={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
