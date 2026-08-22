import api from "@/api/client";
import { parseApiResponse } from "@/lib/api-response";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  level?: number;
  sort_order?: number;
  children?: Category[];
}

export const categoriesApi = {
  async tree(): Promise<Category[]> {
    const res = await api.get("categories/tree");
    const body = await parseApiResponse<Category[]>(res);
    return (body.data as Category[]) ?? [];
  },

  async topNav(): Promise<Category[]> {
    const res = await api.get("catalog/top-nav");
    const body = await parseApiResponse<Category[]>(res);
    return (body.data as Category[]) ?? [];
  },
};
