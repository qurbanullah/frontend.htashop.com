import {
  type QueryKey,
  useQueryClient,
  useMutation as useReactQueryMutation,
} from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toaster'

interface UseMutationOptions<TData> {
  onSuccessMessage?: string | ((data: TData) => string)
  invalidateQueries?: QueryKey[]
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}

export function useMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData> = {}
) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  return useReactQueryMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options.onSuccessMessage) {
        const msg =
          typeof options.onSuccessMessage === 'function'
            ? options.onSuccessMessage(data)
            : options.onSuccessMessage
        success(msg)
      }
      if (options.invalidateQueries) {
        for (const key of options.invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }
      options.onSuccess?.(data)
    },
    onError: (error: Error) => {
      showError(error.message || 'An unexpected error occurred')
      options.onError?.(error)
    },
  })
}
