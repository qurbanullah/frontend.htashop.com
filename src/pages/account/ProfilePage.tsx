import { useQuery } from '@tanstack/react-query'
import { Camera, Loader2, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { accountApi } from '@/api/account'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/Toaster'
import { isApiError } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'
import { createAvatarVariants, uploadAvatarVariants } from '@/lib/avatar-upload'
import { useAuthStore } from '@/stores/auth'

const CDN_BASE = 'https://cdn.htashop.com'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function cdnUrl(key?: string | null): string {
  if (!key) return ''
  return key.startsWith('http') ? key : `${CDN_BASE}/${key}`
}

function showProfileError(
  showError: (message: string) => void,
  error: unknown,
  fallback: string
): void {
  if (isApiError(error) && error.errors) {
    showError(Object.values(error.errors).flat()[0] || error.message)
  } else {
    showError(isApiError(error) ? error.message : fallback)
  }
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const { success: showSuccess, error: showError } = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['account-profile'],
    queryFn: () => accountApi.profile(),
    staleTime: 30 * 1000,
  })

  const avatarUrl =
    profile?.avatar_urls?.medium ||
    profile?.avatar_url ||
    user?.avatar_urls?.medium ||
    user?.avatar_url ||
    null

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showError('Name is required')
      return
    }
    setSavingProfile(true)
    try {
      const updated = await accountApi.updateProfile({
        name: name.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      })
      updateUser({
        name: updated.name,
        first_name: updated.first_name ?? undefined,
        last_name: updated.last_name ?? undefined,
      })
      showSuccess('Profile updated')
    } catch (e) {
      showProfileError(showError, e, 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('JPEG, PNG, or WebP images only')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('Image must be 10MB or smaller')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const blobs = await createAvatarVariants(file)
      const avatarVariants = await uploadAvatarVariants(file, blobs, user?.id)

      const res = await api.post('user/avatar', {
        json: {
          avatar_variants: avatarVariants,
          filename: `avatar-${user?.id}.jpg`,
          mime_type: 'image/jpeg',
        },
        headers: authHeaders(),
        throwHttpErrors: false,
      })

      const body = (await res.json()) as {
        success: boolean
        data?: { avatar_urls?: Record<string, string> }
        message?: string
      }
      if (!body.success) throw new Error(body.message || 'Failed to save avatar')

      updateUser({ avatar_urls: body.data?.avatar_urls as never })
      showSuccess('Profile photo updated')
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to upload photo')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Profile & Security</h1>
        <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
          Manage your personal information, photo, and password.
        </p>
      </div>

      {/* Personal info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Personal information</h2>
        </div>

        <div className="mt-5 flex flex-col gap-6 sm:flex-row">
          {/* Avatar */}
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                {avatarUrl ? (
                  <img
                    src={cdnUrl(avatarUrl)}
                    alt={profile?.name ?? 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute -right-1 -bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow transition-colors hover:bg-blue-700"
                aria-label="Upload profile photo"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarFile(file)
                  e.target.value = ''
                }}
              />
            </div>
            <p className="text-gray-400 text-xs">JPG, PNG or WebP · Max 10MB</p>
          </div>

          {/* Form */}
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
                Full name <span className="text-red-500">*</span>
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                value={profile?.email ?? user?.email ?? ''}
                disabled
                className="h-10 cursor-not-allowed opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
                First name (optional)
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
                Last name (optional)
              </Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="inline-flex items-center gap-2"
          >
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}
