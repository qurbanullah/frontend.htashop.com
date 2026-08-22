import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toaster";
import { isApiError } from "@/lib/api-response";
import { addressesApi, type AddressData } from "@/api/addresses";
import { AddressModal } from "@/components/account/AddressModal";
import { EmptyState } from "@/components/ui/empty-state";

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AddressData | null>(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["account-addresses"],
    queryFn: () => addressesApi.list(),
    staleTime: 30 * 1000,
  });

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (address: AddressData) => { setEditing(address); setModalOpen(true); };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["account-addresses"] });

  const handleDelete = async (address: AddressData) => {
    if (!confirm(`Delete address "${address.label || address.address_line_1 || "this address"}"?`)) return;
    try {
      await addressesApi.remove(address.uuid);
      showSuccess("Address deleted");
      invalidate();
    } catch (e) {
      showError(isApiError(e) ? e.message : "Failed to delete address");
    }
  };

  const handleSetPrimary = async (address: AddressData) => {
    try {
      await addressesApi.setPrimary(address.uuid);
      showSuccess("Primary address updated");
      invalidate();
    } catch (e) {
      showError(isApiError(e) ? e.message : "Failed to update primary address");
    }
  };

  const countryName = (address: AddressData) => address.country?.name ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Addresses</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage the addresses you use for shipping and billing.
          </p>
        </div>
        <Button onClick={openAdd} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Address
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses yet"
          description="Add an address to speed up checkout."
          action={{ label: "Add your first address", onClick: openAdd }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {addresses.map((address) => (
            <div key={address.uuid} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {address.label || "Address"}
                  </p>
                  {address.is_primary && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Star className="h-3 w-3" /> Primary
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(address)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800" aria-label="Edit address">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(address)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800" aria-label="Delete address">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <address className="mt-3 flex-1 space-y-0.5 text-sm not-italic leading-relaxed text-gray-600 dark:text-gray-300">
                {address.contact_name && <p className="font-medium text-gray-900 dark:text-white">{address.contact_name}</p>}
                {address.address_line_1 && <p>{address.address_line_1}</p>}
                {address.address_line_2 && <p>{address.address_line_2}</p>}
                <p>
                  {[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}
                </p>
                {countryName(address) && <p>{countryName(address)}</p>}
                {address.phone && <p className="pt-1">📞 {address.phone}</p>}
              </address>

              {!address.is_primary && (
                <button
                  onClick={() => handleSetPrimary(address)}
                  className="mt-4 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Set as primary
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
  );
}
