import { AlertTriangle, Box, Package, Ruler, Scale, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CatalogProductPackaging } from '@/api/catalog'

interface Props {
  packaging: CatalogProductPackaging
}

function formatWeight(packaging: CatalogProductPackaging): string | null {
  if (packaging.gross_weight != null) {
    return `${packaging.gross_weight}${packaging.weight_unit ? ` ${packaging.weight_unit}` : ''}`
  }
  if (packaging.gross_weight_kg != null) {
    return `${packaging.gross_weight_kg} kg`
  }
  return null
}

function formatDimensions(packaging: CatalogProductPackaging): string | null {
  if (packaging.length == null || packaging.width == null || packaging.height == null) {
    return null
  }

  const unit = packaging.dimension_unit ? ` ${packaging.dimension_unit}` : ''
  return `${packaging.length} × ${packaging.width} × ${packaging.height}${unit}`
}

function hasAnyFacts(packaging: CatalogProductPackaging): boolean {
  return Boolean(
    formatWeight(packaging) ||
      formatDimensions(packaging) ||
      packaging.packaging_type ||
      packaging.contents.length > 0 ||
      packaging.handling_notes
  )
}

/**
 * Public packaging facts on the product detail page. Renders nothing until the
 * seller has supplied something worth showing.
 */
export function ProductPackaging({ packaging }: Props) {
  const { t } = useTranslation()

  if (!hasAnyFacts(packaging)) return null

  const weight = formatWeight(packaging)
  const dimensions = formatDimensions(packaging)

  const flags = [
    packaging.ships_alone
      ? { key: 'alone', label: t('product.ships_separately'), tone: 'blue' }
      : null,
    packaging.is_fragile ? { key: 'fragile', label: t('product.fragile'), tone: 'amber' } : null,
    !packaging.is_stackable
      ? { key: 'stack', label: t('product.do_not_stack'), tone: 'amber' }
      : null,
    packaging.is_hazmat ? { key: 'hazmat', label: t('product.hazmat'), tone: 'red' } : null,
  ].filter((flag): flag is { key: string; label: string; tone: string } => flag !== null)

  return (
    <section className="mt-12" aria-label={t('product.packaging')}>
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 className="font-bold text-gray-900 text-xl dark:text-white">
          {t('product.packaging')}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {weight && (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-1 flex items-center gap-2 text-gray-400">
              <Scale className="h-4 w-4" />
              <span className="font-medium text-xs uppercase tracking-wide">
                {t('product.package_weight')}
              </span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">{weight}</p>
          </div>
        )}

        {dimensions && (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-1 flex items-center gap-2 text-gray-400">
              <Ruler className="h-4 w-4" />
              <span className="font-medium text-xs uppercase tracking-wide">
                {t('product.package_dimensions')}
              </span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">{dimensions}</p>
          </div>
        )}

        {packaging.packaging_type && (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-1 flex items-center gap-2 text-gray-400">
              <Box className="h-4 w-4" />
              <span className="font-medium text-xs uppercase tracking-wide">
                {t('product.packaging_type')}
              </span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {packaging.packaging_type.name}
            </p>
            {packaging.units_per_case > 1 && (
              <p className="mt-0.5 text-gray-500 text-xs dark:text-gray-400">
                {t('product.case_pack', { count: packaging.units_per_case })}
              </p>
            )}
          </div>
        )}
      </div>

      {flags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {flags.map((flag) => (
            <span
              key={flag.key}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-xs ${
                flag.tone === 'red'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : flag.tone === 'amber'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {(flag.tone === 'red' || flag.tone === 'amber') && (
                <AlertTriangle className="h-3 w-3" />
              )}
              {flag.label}
            </span>
          ))}
        </div>
      )}

      {packaging.handling_notes && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-900/60">
          <h3 className="mb-1 font-semibold text-gray-900 text-sm dark:text-white">
            {t('product.handling')}
          </h3>
          <p className="whitespace-pre-line text-gray-600 text-sm dark:text-gray-300">
            {packaging.handling_notes}
          </p>
        </div>
      )}

      {packaging.contents.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 className="mb-3 font-semibold text-gray-900 text-sm dark:text-white">
            {t('product.in_the_box')}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {packaging.contents.map((item) => (
              <li
                key={`${item.name}-${item.qty ?? 0}`}
                className="flex items-center gap-2 text-gray-600 text-sm dark:text-gray-300"
              >
                <Box className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{item.name}</span>
                {(item.qty ?? 1) > 1 && <span className="text-gray-400">×{item.qty}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-gray-400 text-xs">
        <Truck className="h-3.5 w-3.5" />
        {t('product.delivery_note')}
      </p>
    </section>
  )
}
