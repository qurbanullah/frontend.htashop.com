import { Camera, Trash2, Upload, User as UserIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { storageApi } from '@/api/storage'
import { useToast } from '@/components/ui/Toaster'
import api from '@/lib/api'
import { authHeaders } from '@/lib/auth-header'
import { useAuthStore } from '@/stores/auth'

const CDN_BASE = 'https://cdn.htashop.com'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_SIZES = [
  { suffix: 'original', width: 0 },
  { suffix: 'thumb', width: 100 },
  { suffix: 'small', width: 200 },
  { suffix: 'medium', width: 500 },
]

// ── Helpers ──

async function resizeImage(file: File, targetWidth: number): Promise<Blob> {
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

function cdnUrl(key: string): string {
  if (!key) return ''
  return key.startsWith('http') ? key : `${CDN_BASE}/${key}`
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'JPEG, PNG, or WebP only'
  if (file.size > 10 * 1024 * 1024) return 'Max 10MB'
  return null
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

async function createAvatarVariants(file: File): Promise<Record<string, Blob>> {
  const [thumb, small, medium] = await Promise.all([
    resizeImage(file, 100),
    resizeImage(file, 200),
    resizeImage(file, 500),
  ])
  return { original: file, thumb, small, medium }
}

async function uploadAvatarVariants(
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

async function saveAvatarVariants(
  avatarVariants: Record<string, string>,
  filename: string,
  mimeType: string
): Promise<Record<string, unknown> | null> {
  const res = await api
    .post('user/avatar', {
      json: { avatar_variants: avatarVariants, filename, mime_type: mimeType },
      headers: authHeaders(),
    })
    .json<{ success: boolean; data: Record<string, unknown> }>()

  return res.success && res.data ? res.data : null
}

// ── Component ──

export function AvatarUpload() {
  const { user, updateUser } = useAuthStore()
  const { success: showSuccess, error: showError } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const err = validateFile(file)
    if (err) return showError(err)
    uploadAvatar(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true)

      const blobs = await createAvatarVariants(file)
      const avatarVariants = await uploadAvatarVariants(file, blobs, user?.id)

      // Save to backend
      const data = await saveAvatarVariants(avatarVariants, file.name, file.type || 'image/jpeg')
      if (data) {
        updateUser(data as Parameters<typeof updateUser>[0])
        showSuccess('Profile picture updated!')
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!user?.avatar_url) return
    try {
      setIsDeleting(true)
      const res = await api
        .delete('user/avatar', { headers: authHeaders() })
        .json<{ success: boolean; data: Record<string, unknown> }>()
      if (res.success) {
        updateUser(res.data as Parameters<typeof updateUser>[0])
        showSuccess('Picture removed')
      }
    } catch {
      showError('Failed to remove picture')
    } finally {
      setIsDeleting(false)
    }
  }

  const avatarKey = user?.avatar_urls?.medium || user?.avatar_medium || user?.avatar_url || ''
  const avatarUrl = cdnUrl(avatarKey)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {/* Avatar circle with drag-drop — keyboard alternative is the Upload button below */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag & drop is a pointer-only enhancement; the Upload button is the accessible path */}
      <div
        className={`group relative flex-shrink-0 ${isDragging ? 'rounded-full ring-2 ring-blue-500 ring-offset-2' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-600">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
              <UserIcon className="h-10 w-10 text-gray-400" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Camera className="h-6 w-6 text-white" />
          </button>
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-blue-500/30">
              <Upload className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm dark:text-white">Profile Picture</h3>
          <p className="text-gray-500 text-xs dark:text-gray-400">
            Drag &amp; drop onto avatar, or click to upload.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white text-xs hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {avatarUrl ? 'Change' : 'Upload'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-600 text-xs hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
