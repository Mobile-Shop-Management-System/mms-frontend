import apiClient from "@/lib/apiClient";

const usedPhonesApi = {
  list: (params) => apiClient.get("/used-phones/", { params }),
  create: (data) => apiClient.post("/used-phones/", data),
  update: (id, data) => apiClient.put(`/used-phones/${id}/`, data),
  remove: (id) => apiClient.delete(`/used-phones/${id}/`),
};

export default usedPhonesApi;
