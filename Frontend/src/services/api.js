import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export function extractErrorMessage(error, fallback = "An unexpected error occurred") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
  }
  return error?.message || fallback;
}

export const dashboardApi = {
  getStats: () => apiClient.get("/dashboard/stats").then((r) => r.data),
  getMovementTrends: (days = 14) =>
    apiClient.get("/dashboard/movements", { params: { days } }).then((r) => r.data),
  getInventoryDistribution: () =>
    apiClient.get("/dashboard/inventory-distribution").then((r) => r.data),
};

export const productsApi = {
  list: (params) => apiClient.get("/products", { params }).then((r) => r.data),
  create: (data) => apiClient.post("/products", data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/products/${id}`),
};

export const warehousesApi = {
  list: (params) => apiClient.get("/warehouses", { params }).then((r) => r.data),
  create: (data) => apiClient.post("/warehouses", data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/warehouses/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/warehouses/${id}`),
};

export const inventoryApi = {
  list: (params) => apiClient.get("/inventory", { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/inventory/${id}`).then((r) => r.data),
};

export const movementsApi = {
  list: (params) => apiClient.get("/movements", { params }).then((r) => r.data),
  create: (data) => apiClient.post("/movements", data).then((r) => r.data),
};

export const alertsApi = {
  list: (params) => apiClient.get("/alerts", { params }).then((r) => r.data),
  resolve: (id) => apiClient.patch(`/alerts/${id}/resolve`).then((r) => r.data),
};
