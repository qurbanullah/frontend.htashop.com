import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, setTheme, isDarkMode } = useTheme()

  const label = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(isDarkMode ? 'light' : 'dark')
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
      title={label}
    >
      {isDarkMode ? (
        <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )}
    </button>
  )
}
