import { storageApi } from '@/api/storage'
import i18n from '@/i18n/config'

/**
 * Shared avatar upload pipeline (resize → direct-to-S3 upload → keys).
 * Used by ProfilePage.
 *
 * Failures are surfaced verbatim by the caller, so they are localised here
 * through the i18n instance rather than hardcoded in English.
 */
function uploadFailed(): Error {
  return new Error(i18n.t('account.profile_photo_failed'))
}

export const AVATAR_SIZES = [
  { suffix: 'original', width: 0 },
  { suffix: 'thumb', width: 100 },
  { suffix: 'small', width: 200 },
  { suffix: 'medium', width: 500 },
]

const JPEG_QUALITY = 0.85

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(uploadFailed())
    img.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(uploadFailed())),
      'image/jpeg',
      JPEG_QUALITY
    )
  })
}

export async function resizeImage(file: File, targetWidth: number): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)

  try {
    const img = await loadImage(objectUrl)
    // A broken or zero-sized image would make the height NaN/Infinity and the
    // canvas dimensions invalid, so bail out before touching the canvas.
    if (!img.width || !img.height) throw uploadFailed()

    // Never upscale — a small source is kept at its native size.
    const width = Math.min(targetWidth, img.width)
    const height = Math.max(1, Math.round(width * (img.height / img.width)))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw uploadFailed()
    ctx.drawImage(img, 0, 0, width, height)

    return await canvasToBlob(canvas)
  } finally {
    // Always release the blob handle, including on the error paths above.
    URL.revokeObjectURL(objectUrl)
  }
}

async function uploadVariant(key: string, blob: Blob): Promise<{ key: string; url: string }> {
  const presigned = await storageApi.getPresignedUrl(key, 'image/jpeg', 'avatars', blob.size)
  if (!presigned.success || !presigned.data?.url) throw uploadFailed()

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presigned.data.url, true)
    xhr.setRequestHeader('Content-Type', 'image/jpeg')
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed: ${xhr.status}`))
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(blob)
  })

  return { key: presigned.data.key, url: presigned.data.url }
}

export async function createAvatarVariants(file: File): Promise<Record<string, Blob>> {
  const [thumb, small, medium] = await Promise.all([
    resizeImage(file, 100),
    resizeImage(file, 200),
    resizeImage(file, 500),
  ])
  return { original: file, thumb, small, medium }
}

export async function uploadAvatarVariants(
  file: File,
  blobs: Record<string, Blob>,
  userId: number | undefined
): Promise<Record<string, string>> {
  const avatarVariants: Record<string, string> = {}
  for (const { suffix, width } of AVATAR_SIZES) {
    const blob = width === 0 ? file : blobs[suffix]
    if (!blob) continue
    const { key } = await uploadVariant(`avatars/${userId}_${suffix}.jpg`, blob)
    avatarVariants[suffix] = key
  }
  return avatarVariants
}
