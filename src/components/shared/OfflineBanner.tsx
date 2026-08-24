import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div
      role="alert"
      className="fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 font-medium text-sm text-white shadow-lg"
    >
      <WifiOff className="h-4 w-4" />
      <span>You are currently offline. Some features may be unavailable.</span>
    </div>
  )
}
