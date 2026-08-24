import { useEffect } from 'react'
import { AppRouter } from '@/routes'
import { useAuthStore } from '@/stores/auth'

/**
 * Application root — initializes auth state, renders the router.
 * Keep this file thin. All route logic lives in src/routes/.
 */
export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <AppRouter />
}
