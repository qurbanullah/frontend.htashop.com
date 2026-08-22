import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme, isDarkMode } = useTheme();

  const label = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(isDarkMode ? "light" : "dark");
    } else {
      setTheme(theme === "light" ? "dark" : "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      title={label}
    >
      {isDarkMode ? (
        <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      ) : (
        <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
      )}
    </button>
  );
}
