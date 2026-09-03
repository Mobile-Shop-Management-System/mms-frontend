import apiClient from "@/lib/apiClient";

const customersApi = {
  list: (params) => apiClient.get("/customers/", { params }),
  create: (data) => apiClient.post("/customers/", data),
  get: (id) => apiClient.get(`/customers/${id}/`),
  update: (id, data) => apiClient.put(`/customers/${id}/`, data),
  remove: (id) => apiClient.delete(`/customers/${id}/`),
};

export default customersApi;
