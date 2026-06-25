import apiClient from "@/lib/apiClient";

const categoriesApi = {
  list: (params) => apiClient.get("/categories/", { params }),
  create: (data) => apiClient.post("/categories/", data),
  update: (id, data) => apiClient.put(`/categories/${id}/`, data),
  remove: (id) => apiClient.delete(`/categories/${id}/`),
};

export default categoriesApi;
