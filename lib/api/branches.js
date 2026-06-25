import apiClient from "@/lib/apiClient";

const branches = {
  list:         (params)     => apiClient.get("/branches/", { params }),
  create:       (data)       => apiClient.post("/branches/", data),
  get:          (id)         => apiClient.get(`/branches/${id}/`),
  update:       (id, data)   => apiClient.put(`/branches/${id}/`, data),
  remove:       (id)         => apiClient.delete(`/branches/${id}/`),
  stockSummary: (id)         => apiClient.get(`/branches/${id}/stock-summary/`),
};

export default branches;
