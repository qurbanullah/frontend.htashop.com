/**
 * Client-side image resizing utilities.
 * Generates multiple sizes for a single uploaded file (original + thumbnails).
 */

export interface ImageVariant {
  suffix: string
  width: number
}

// Standard e-commerce image sizes
export const PRODUCT_IMAGE_SIZES: ImageVariant[] = [
  { suffix: 'original', width: 0 },
  { suffix: 'large', width: 1500 },
  { suffix: 'medium', width: 800 },
  { suffix: 'small', width: 300 },
  { suffix: 'thumb', width: 100 },
]

/**
 * Resize an image file to the given width, maintaining aspect ratio.
 */
export async function resizeImage(file: File, targetWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const h = Math.round(targetWidth * (img.height / img.width))
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = h
      canvas.getContext('2d')?.drawImage(img, 0, 0, targetWidth, h)
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Blob conversion failed'))),
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generate all resized variants for an image file.
 * Returns a map of suffix → Blob (original + thumbnails).
 */
export async function generateImageVariants(file: File): Promise<Record<string, Blob>> {
  const variants: Record<string, Blob> = { original: file }

  const resized = await Promise.all(
    PRODUCT_IMAGE_SIZES.filter((v) => v.width > 0).map(async (variant) => {
      const blob = await resizeImage(file, variant.width)
      return { suffix: variant.suffix, blob }
    })
  )

  for (const { suffix, blob } of resized) {
    variants[suffix] = blob
  }

  return variants
}
