import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, X, Loader2 } from 'lucide-react';
import type { Category } from '@/types/academic';

interface CategoryMultiSelectProps {
  selectedCategories: number[];
  onChange: (categoryIds: number[]) => void;
  categories: Category[];
  loading?: boolean;
  error?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  helpText?: string;
  disabled?: boolean;
  maxSelection?: number;
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Flatten the category tree to get all categories (including nested children)
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const flatten = (items: Category[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      });
    };
    flatten(cats);
    return result;
  };

  const allCategories = flattenCategories(categories);

  // Get selected category objects from flattened list
  const selectedCategoryObjects = allCategories.filter(cat =>
    selectedCategories.includes(cat.id)
  );

  // Filter categories based on search (use flattened list)
  const filteredCategories = allCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // When searching, show flat list of matching categories
  // When not searching, show hierarchical tree
  const displayCategories = searchQuery.trim()
    ? filteredCategories.map(cat => ({ ...cat, children: [] })) // Flat list for search results
    : categories; // Hierarchical tree when not searching

  const toggleCategory = (categoryId: number) => {
    if (disabled) return;

    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      if (maxSelection && selectedCategories.length >= maxSelection) {
        return; // Don't allow more selections
      }
      onChange([...selectedCategories, categoryId]);
    }
  };

  const removeCategory = (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedCategories.filter(id => id !== categoryId));
  };

  const handleToggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Render category item recursively
  const renderCategoryItem = (category: Category, depth: number = 0) => {
    const isSelected = selectedCategories.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const indentClass = depth > 0 ? `pl-${depth * 4}` : '';

    return (
      <div key={category.id}>
        <button
          type="button"
          onClick={() => toggleCategory(category.id)}
          className={`
            w-full flex items-center justify-between px-3 py-2 text-left
            transition-colors duration-150
            ${indentClass}
            ${isSelected
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          disabled={disabled}
        >
          <div className="flex items-center flex-1 min-w-0 gap-2">
            <div className={`flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center ${
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 dark:border-gray-600'
            }`}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{category.name}</div>
              {category.description && (
                <div className="text-xs text-gray-500 truncate dark:text-gray-400">
                  {category.description}
                </div>
              )}
            </div>
          </div>
        </button>
        {hasChildren && (
          <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700">
            {category.children!.map(child => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Selected Categories Display */}
        <div
          onClick={handleToggleDropdown}
          className={`
            min-h-[42px] px-3 py-2 bg-white dark:bg-gray-800 
            border rounded-lg cursor-pointer
            transition-colors duration-150
            ${error
              ? 'border-red-500 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
        >
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategoryObjects.length > 0 ? (
              selectedCategoryObjects.map(cat => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-700 bg-blue-100 rounded dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={(e) => removeCategory(cat.id, e)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                    disabled={disabled}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {placeholder}
              </span>
            )}
            <div className="flex-1" />
            {loading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            )}
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !loading && (
          <div className="absolute z-50 flex flex-col w-full mt-1 overflow-hidden bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600 max-h-80">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category List */}
            <div className="flex-1 overflow-y-auto">
              {displayCategories.length > 0 ? (
                displayCategories.map(cat => renderCategoryItem(cat))
              ) : (
                <div className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                  No categories found
                </div>
              )}
            </div>

            {/* Footer Info */}
            {maxSelection && (
              <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400">
                {selectedCategories.length} / {maxSelection} selected
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
