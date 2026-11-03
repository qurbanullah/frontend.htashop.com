import {
  Armchair,
  Bot,
  Car,
  Coffee,
  Cpu,
  Droplets,
  Dumbbell,
  FlaskConical,
  Folder,
  GraduationCap,
  Hammer,
  HardHat,
  Laptop,
  Leaf,
  type LucideIcon,
  Package,
  Paperclip,
  Printer,
  Shield,
  Shirt,
  SprayCan,
  Sprout,
  Stethoscope,
  Tag,
  TestTube,
  Wrench,
  Zap,
} from 'lucide-react'
import type { Category } from '@/api/categories'
import { cdnUrl } from '@/lib/cdn'
import { cn } from '@/lib/utils'

/**
 * Curated icon set for category merchandising.
 *
 * Importing lucide's full `icons` map would pull ~1,500 components into the
 * storefront bundle; the admin icon field is therefore limited to this set.
 * Unknown keys fall back to the category's initial.
 */
const ICONS: Record<string, LucideIcon> = {
  armchair: Armchair,
  bot: Bot,
  car: Car,
  coffee: Coffee,
  cpu: Cpu,
  droplets: Droplets,
  dumbbell: Dumbbell,
  'flask-conical': FlaskConical,
  folder: Folder,
  'graduation-cap': GraduationCap,
  hammer: Hammer,
  'hard-hat': HardHat,
  laptop: Laptop,
  leaf: Leaf,
  package: Package,
  paperclip: Paperclip,
  printer: Printer,
  shield: Shield,
  shirt: Shirt,
  'spray-can': SprayCan,
  sprout: Sprout,
  stethoscope: Stethoscope,
  tag: Tag,
  'test-tube': TestTube,
  wrench: Wrench,
  zap: Zap,
}

/** Colours for categories that have not been given an explicit brand colour. */
const FALLBACK_COLORS = [
  '#2563EB',
  '#0EA5E9',
  '#0D9488',
  '#16A34A',
  '#CA8A04',
  '#EA580C',
  '#DC2626',
  '#DB2777',
  '#7C3AED',
  '#4F46E5',
]

type VisualSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<VisualSize, string> = {
  xs: 'h-4 w-4 rounded',
  sm: 'h-5 w-5 rounded-md',
  md: 'h-8 w-8 rounded-lg',
  lg: 'h-10 w-10 rounded-xl',
}

const ICON_SIZES: Record<VisualSize, string> = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

const TEXT_SIZES: Record<VisualSize, string> = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
}

/** `Cpu`, `hard hat`, `hard_hat` and `hard-hat` all resolve to the same key. */
function iconKey(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
}

function isHexColor(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function fallbackColor(name: string): string {
  let hash = 0

  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  }

  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? '#2563EB'
}

export interface CategoryVisualProps {
  category: Pick<Category, 'name' | 'icon' | 'color' | 'image'>
  size?: VisualSize
  className?: string
}

/**
 * The visual identity of a category: image, curated icon, or initial.
 *
 * Colour is applied to the tile background and the icon/initial. If the admin
 * has not chosen a colour, a deterministic palette entry keeps sibling rows
 * distinguishable instead of rendering a wall of grey folders.
 */
export function CategoryVisual({ category, size = 'md', className }: CategoryVisualProps) {
  const image = cdnUrl(category.image)
  const Icon = category.icon ? ICONS[iconKey(category.icon)] : undefined
  const color = isHexColor(category.color) ? category.color : fallbackColor(category.name)
  const initial = category.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden',
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : Icon ? (
        <Icon className={ICON_SIZES[size]} strokeWidth={1.8} aria-hidden="true" />
      ) : (
        <span className={cn('font-semibold uppercase', TEXT_SIZES[size])}>{initial}</span>
      )}
    </span>
  )
}
