import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type AddressData, addressesApi } from '@/api/addresses'
import { AddressModal } from '@/components/account/AddressModal'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryErrorState } from '@/components/ui/query-error'
import { useToast } from '@/components/ui/Toaster'
import { isApiError } from '@/lib/api-response'

export default function AddressesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { success: showSuccess, error: showError } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AddressData | null>(null)

  const {
    data: addresses = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['account-addresses'],
    queryFn: () => addressesApi.list(),
    staleTime: 30 * 1000,
  })

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (address: AddressData) => {
    setEditing(address)
    setModalOpen(true)
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['account-addresses'] })

  const handleDelete = async (address: AddressData) => {
    const name =
      address.label || address.address_line_1 || t('account.addresses_delete_confirm_fallback')
    if (!confirm(t('account.addresses_delete_confirm', { name }))) return
    try {
      await addressesApi.remove(address.uuid)
      showSuccess(t('account.addresses_deleted'))
      invalidate()
    } catch (e) {
      showError(isApiError(e) ? e.message : t('account.addresses_delete_failed'))
    }
  }

  const handleSetPrimary = async (address: AddressData) => {
    try {
      await addressesApi.setPrimary(address.uuid)
      showSuccess(t('account.addresses_primary_updated'))
      invalidate()
    } catch (e) {
      showError(isApiError(e) ? e.message : t('account.addresses_primary_failed'))
    }
  }

  const countryName = (address: AddressData) => address.country?.name ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
            {t('account.addresses_title')}
          </h1>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            {t('account.addresses_subtitle')}
          </p>
        </div>
        <Button onClick={openAdd} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> {t('account.addresses_add')}
        </Button>
      </div>

      {isError ? (
        <QueryErrorState title={t('account.addresses_error')} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t('account.addresses_empty_title')}
          description={t('account.addresses_empty_body')}
          action={{ label: t('account.addresses_empty_cta'), onClick: openAdd }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {addresses.map((address) => (
            <div
              key={address.uuid}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {address.label || t('account.addresses_fallback_label')}
                  </p>
                  {address.is_primary && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-[11px] text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Star className="h-3 w-3" /> {t('account.addresses_primary')}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800"
                    aria-label={t('account.addresses_edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(address)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                    aria-label={t('account.addresses_delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <address className="mt-3 flex-1 space-y-0.5 text-gray-600 text-sm not-italic leading-relaxed dark:text-gray-300">
                {address.contact_name && (
                  <p className="font-medium text-gray-900 dark:text-white">
                    {address.contact_name}
                  </p>
                )}
                {address.address_line_1 && <p>{address.address_line_1}</p>}
                {address.address_line_2 && <p>{address.address_line_2}</p>}
                <p>
                  {[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}
                </p>
                {countryName(address) && <p>{countryName(address)}</p>}
                {address.phone && <p className="pt-1">📞 {address.phone}</p>}
              </address>

              {!address.is_primary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(address)}
                  className="mt-4 font-medium text-blue-600 text-sm hover:underline dark:text-blue-400"
                >
                  {t('account.addresses_set_primary')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        address={editing}
        onSaved={invalidate}
      />
    </div>
  )
}
