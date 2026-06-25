import apiClient from "@/lib/apiClient";

const suppliersApi = {
  list: (params) => apiClient.get("/suppliers/", { params }),
  create: (data) => apiClient.post("/suppliers/", data),
  get: (id) => apiClient.get(`/suppliers/${id}/`),
  update: (id, data) => apiClient.put(`/suppliers/${id}/`, data),
  remove: (id) => apiClient.delete(`/suppliers/${id}/`),
};

export default suppliersApi;
