import api from "@/api/client";
import { parseApiResponse } from "@/lib/api-response";

export interface City {
  id: number;
  name: string;
  country_id: number;
}

export const citiesApi = {
  async list(countryId: number): Promise<City[]> {
    const res = await api.get("cities", { searchParams: { country_id: String(countryId) } });
    const body = await parseApiResponse<City[]>(res);
    return (body.data as City[]) ?? [];
  },
};
