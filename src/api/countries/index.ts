import api from "@/api/client";
import { parseApiResponse } from "@/lib/api-response";

export interface Country {
  id: number;
  name: string;
  code: string;
  code_alpha3: string;
}

export const countriesApi = {
  async list(): Promise<Country[]> {
    const res = await api.get("countries");
    const body = await parseApiResponse<Country[]>(res);
    return (body.data as Country[]) ?? [];
  },
};
