import { Outlet } from 'react-router-dom'

/**
 * Centered layout for auth pages.
 * flex-1 fills the parent's height, justify-center centers vertically.
 */
export function AuthLayout() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <main className="w-full max-w-md">
        <Outlet />
      </main>
    </div>
  )
}
