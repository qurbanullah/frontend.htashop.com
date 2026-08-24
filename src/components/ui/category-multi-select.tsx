import { Check, ChevronDown, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Category } from '@/types/academic'

interface CategoryMultiSelectProps {
  selectedCategories: number[]
  onChange: (categoryIds: number[]) => void
  categories: Category[]
  loading?: boolean
  error?: string
  placeholder?: string
  label?: string
  required?: boolean
  helpText?: string
  disabled?: boolean
  maxSelection?: number
}

export function CategoryMultiSelect({
  selectedCategories,
  onChange,
  categories,
  loading = false,
  error,
  placeholder = 'Select categories...',
  label = 'Categories',
  required = false,
  helpText,
  disabled = false,
  maxSelection,
}: CategoryMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Flatten the category tree to get all categories (including nested children)
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = []
    const flatten = (items: Category[]) => {
      items.forEach((item) => {
        result.push(item)
        if (item.children && item.children.length > 0) {
          flatten(item.children)
        }
      })
    }
    flatten(cats)
    return result
  }

  const allCategories = flattenCategories(categories)

  // Get selected category objects from flattened list
  const selectedCategoryObjects = allCategories.filter((cat) => selectedCategories.includes(cat.id))

  // Filter categories based on search (use flattened list)
  const filteredCategories = allCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // When searching, show flat list of matching categories
  // When not searching, show hierarchical tree
  const displayCategories = searchQuery.trim()
    ? filteredCategories.map((cat) => ({ ...cat, children: [] })) // Flat list for search results
    : categories // Hierarchical tree when not searching

  const toggleCategory = (categoryId: number) => {
    if (disabled) return

    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter((id) => id !== categoryId))
    } else {
      if (maxSelection && selectedCategories.length >= maxSelection) {
        return // Don't allow more selections
      }
      onChange([...selectedCategories, categoryId])
    }
  }

  const removeCategory = (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedCategories.filter((id) => id !== categoryId))
  }

  const handleToggleDropdown = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Render category item recursively
  const renderCategoryItem = (category: Category, depth: number = 0) => {
    const isSelected = selectedCategories.includes(category.id)
    const hasChildren = category.children && category.children.length > 0
    const indentClass = depth > 0 ? `pl-${depth * 4}` : ''

    return (
      <div key={category.id}>
        <button
          type="button"
          onClick={() => toggleCategory(category.id)}
          className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-150 ${indentClass}
            ${
              isSelected
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                : 'text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
          disabled={disabled}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{category.name}</div>
              {category.description && (
                <div className="truncate text-gray-500 text-xs dark:text-gray-400">
                  {category.description}
                </div>
              )}
            </div>
          </div>
        </button>
        {hasChildren && (
          <div className="ml-4 border-gray-200 border-l-2 dark:border-gray-700">
            {category.children?.map((child) => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && (
        // biome-ignore lint/a11y/noLabelWithoutControl: custom multi-select dropdown — the control is the combobox trigger below
        <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Selected Categories Display */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: custom combobox — removable chips inside force a div (buttons cannot nest) */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: custom combobox — the search input inside takes keyboard focus */}
        <div
          onClick={handleToggleDropdown}
          className={`min-h-[42px] cursor-pointer rounded-lg border bg-white px-3 py-2 transition-colors duration-150 dark:bg-gray-800 ${
            error
              ? 'border-red-500 dark:border-red-500'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          }
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : ''}
          `}
        >
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategoryObjects.length > 0 ? (
              selectedCategoryObjects.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-blue-700 text-sm dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={(e) => removeCategory(cat.id, e)}
                    className="rounded-full p-0.5 transition-colors hover:bg-blue-200 dark:hover:bg-blue-800"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
            <div className="flex-1" />
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <ChevronDown
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  isOpen ? 'rotate-180 transform' : ''
                }`}
              />
            )}
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !loading && (
          <div className="absolute z-50 mt-1 flex max-h-80 w-full flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
            {/* Search Input */}
            <div className="border-gray-200 border-b p-2 dark:border-gray-700">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
              />
            </div>

            {/* Category List */}
            <div className="flex-1 overflow-y-auto">
              {displayCategories.length > 0 ? (
                displayCategories.map((cat) => renderCategoryItem(cat))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm dark:text-gray-400">
                  No categories found
                </div>
              )}
            </div>

            {/* Footer Info */}
            {maxSelection && (
              <div className="border-gray-200 border-t bg-gray-50 px-3 py-2 text-gray-500 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                {selectedCategories.length} / {maxSelection} selected
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && !error && <p className="text-gray-500 text-xs dark:text-gray-400">{helpText}</p>}

      {/* Error Message */}
      {error && <p className="text-red-500 text-xs dark:text-red-400">{error}</p>}
    </div>
  )
}
