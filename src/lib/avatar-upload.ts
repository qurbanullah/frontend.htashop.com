import { storageApi } from '@/api/storage'

/**
 * Shared avatar upload pipeline (resize → direct-to-S3 upload → keys).
 * Used by AvatarUpload and ProfilePage.
 */

export const AVATAR_SIZES = [
  { suffix: 'original', width: 0 },
  { suffix: 'thumb', width: 100 },
  { suffix: 'small', width: 200 },
  { suffix: 'medium', width: 500 },
]

export async function resizeImage(file: File, targetWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const h = Math.round(targetWidth * (img.height / img.width))
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = h
      canvas.getContext('2d')?.drawImage(img, 0, 0, targetWidth, h)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob failed'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(file)
  })
}

async function uploadVariant(key: string, blob: Blob): Promise<{ key: string; url: string }> {
  const presigned = await storageApi.getPresignedUrl(key, 'image/jpeg', 'avatars', blob.size)
  if (!presigned.success || !presigned.data?.url) throw new Error('Failed to get upload URL')

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
