import { useQuery } from '@tanstack/react-query'
import { Camera, Loader2, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { accountApi } from '@/api/account'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/Toaster'
import { isApiError } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'
import { createAvatarVariants, uploadAvatarVariants } from '@/lib/avatar-upload'
import { cdnUrl } from '@/lib/cdn'
import { useAuthStore } from '@/stores/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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
  const { t } = useTranslation()
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
      showError(t('account.profile_name_required'))
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
      showSuccess(t('account.profile_updated'))
    } catch (e) {
      showProfileError(showError, e, t('account.profile_update_failed'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError(t('account.profile_photo_types'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showError(t('account.profile_photo_size'))
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
      if (!body.success) throw new Error(body.message || t('account.profile_avatar_failed'))

      updateUser({ avatar_urls: body.data?.avatar_urls as never })
      showSuccess(t('account.profile_photo_updated'))
    } catch (e) {
      showError(e instanceof Error ? e.message : t('account.profile_photo_failed'))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
          {t('account.profile_title')}
        </h1>
        <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
          {t('account.profile_subtitle')}
        </p>
      </div>

      {/* Personal info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t('account.profile_personal_info')}
          </h2>
        </div>

        <div className="mt-5 flex flex-col gap-6 sm:flex-row">
          {/* Avatar */}
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                {avatarUrl ? (
                  <img
                    src={cdnUrl(avatarUrl)}
                    alt={profile?.name ?? t('account.profile_avatar_alt')}
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
                className="absolute -end-1 -bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow transition-colors hover:bg-blue-700"
                aria-label={t('account.profile_upload_photo')}
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
            <p className="text-gray-400 text-xs">{t('account.profile_photo_hint')}</p>
          </div>

          {/* Form */}
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
                {t('account.profile_full_name')} <span className="text-red-500">*</span>
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
                {t('account.profile_email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={profile?.email ?? user?.email ?? ''}
                disabled
                className="h-10 cursor-not-allowed opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
                {t('account.profile_first_optional')}
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
                {t('account.profile_last_optional')}
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
            {t('account.profile_save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
