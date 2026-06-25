import apiClient from "@/lib/apiClient";

const salesApi = {
  list: (params) => apiClient.get("/sales/", { params }),
  create: (data) => apiClient.post("/sales/", data),
  get: (id) => apiClient.get(`/sales/${id}/`),
};

export default salesApi;
