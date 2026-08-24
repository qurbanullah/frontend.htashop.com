import { ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

const FILTER_PREVIEW_COUNT = 4

/** Preset price buckets used in place of free min/max inputs. */
const PRICE_RANGES: Array<{ label: string; min: string; max: string }> = [
  { label: 'Up to 500', min: '', max: '500' },
  { label: '500 – 1,000', min: '500', max: '1000' },
  { label: '1,000 – 2,000', min: '1000', max: '2000' },
  { label: '2,000 – 5,000', min: '2000', max: '5000' },
  { label: '5,000 – 10,000', min: '5000', max: '10000' },
  { label: 'Above 10,000', min: '10000', max: '' },
]

export interface CatalogSelection {
  brandIds: number[]
  featureIds: number[]
  minPrice: string
  maxPrice: string
}

interface FilterSidebarProps {
  brands: Array<{ id: number; name: string }>
  features: Array<{ id: number; name: string }>
  selection: CatalogSelection
  onChange: (patch: Partial<CatalogSelection>) => void
  onClear: () => void
}

function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

export function FilterSidebar({
  brands,
  features,
  selection,
  onChange,
  onClear,
}: FilterSidebarProps) {
  const [brandSearch, setBrandSearch] = useState('')
  const [featureSearch, setFeatureSearch] = useState('')
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [showAllFeatures, setShowAllFeatures] = useState(false)

  const filteredBrands = brandSearch.trim()
    ? brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands

  const filteredFeatures = featureSearch.trim()
    ? features.filter((f) => f.name.toLowerCase().includes(featureSearch.toLowerCase()))
    : features

  const visibleBrands = showAllBrands
    ? filteredBrands
    : filteredBrands.slice(0, FILTER_PREVIEW_COUNT)
  const visibleFeatures = showAllFeatures
    ? filteredFeatures
    : filteredFeatures.slice(0, FILTER_PREVIEW_COUNT)

  const hasSelection =
    selection.brandIds.length > 0 ||
    selection.featureIds.length > 0 ||
    selection.minPrice !== '' ||
    selection.maxPrice !== ''

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm dark:text-white">Filters</h2>
        {hasSelection && (
          <button
            type="button"
            onClick={onClear}
            className="font-medium text-blue-600 text-xs hover:underline dark:text-blue-400"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Brands */}
      <div>
        <h3 className="mb-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
          Brands
        </h3>
        <div className="relative mb-2">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder="Search brands"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          {visibleBrands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`brand-${brand.id}`}
                checked={selection.brandIds.includes(brand.id)}
                onChange={() => onChange({ brandIds: toggleId(selection.brandIds, brand.id) })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor={`brand-${brand.id}`}
                className="cursor-pointer text-gray-700 text-sm dark:text-gray-300"
              >
                {brand.name}
              </label>
            </div>
          ))}
        </div>

        {filteredBrands.length > FILTER_PREVIEW_COUNT && (
          <button
            type="button"
            onClick={() => setShowAllBrands((value) => !value)}
            className="mt-1 flex items-center gap-1 font-medium text-blue-600 text-xs hover:underline dark:text-blue-400"
          >
            {showAllBrands ? 'Show less' : 'Show all'}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${showAllBrands ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
          Price range
        </h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const active = selection.minPrice === range.min && selection.maxPrice === range.max
            return (
              <button
                key={range.label}
                type="button"
                onClick={() =>
                  onChange(
                    active
                      ? { minPrice: '', maxPrice: '' }
                      : { minPrice: range.min, maxPrice: range.max }
                  )
                }
                className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {range.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="mb-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
          Features
        </h3>
        <div className="relative mb-2">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={featureSearch}
            onChange={(e) => setFeatureSearch(e.target.value)}
            placeholder="Search features"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          {visibleFeatures.map((feature) => (
            <div key={feature.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`feature-${feature.id}`}
                checked={selection.featureIds.includes(feature.id)}
                onChange={() =>
                  onChange({ featureIds: toggleId(selection.featureIds, feature.id) })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor={`feature-${feature.id}`}
                className="cursor-pointer text-gray-700 text-sm dark:text-gray-300"
              >
                {feature.name}
              </label>
            </div>
          ))}
        </div>

        {filteredFeatures.length > FILTER_PREVIEW_COUNT && (
          <button
            type="button"
            onClick={() => setShowAllFeatures((value) => !value)}
            className="mt-1 flex items-center gap-1 font-medium text-blue-600 text-xs hover:underline dark:text-blue-400"
          >
            {showAllFeatures ? 'Show less' : 'Show all'}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${showAllFeatures ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
    </aside>
  )
}
