export interface Category {
  id: number
  name: string
  description?: string | null
  children?: Category[]
}
