import ky from "ky";

const API_URL =
  import.meta.env.VITE_API_URL || "https://api.htashop.com/api/v1";

export const getApiUrl = () => API_URL;

const api = ky.create({
  prefix: API_URL,
  timeout: 15000,
  credentials: "include",
  headers: { Accept: "application/json" },
  retry: { limit: 0 },
});

export { api };
export default api;
