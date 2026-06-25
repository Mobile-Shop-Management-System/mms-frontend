import apiClient from "@/lib/apiClient";

const brandsApi = {
  list: (params) => apiClient.get("/brands/", { params }),
  create: (data) => apiClient.post("/brands/", data),
  update: (id, data) => apiClient.patch(`/brands/${id}/`, data),
  remove: (id) => apiClient.delete(`/brands/${id}/`),
};

export default brandsApi;
