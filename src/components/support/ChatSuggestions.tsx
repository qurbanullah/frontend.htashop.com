interface ChatSuggestionsProps {
  suggestions: string[]
  onSelect: (text: string) => void
}

export function ChatSuggestions({ suggestions, onSelect }: ChatSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-gray-300 px-3 py-1.5 text-gray-700 text-xs transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
