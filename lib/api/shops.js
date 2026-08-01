import apiClient from "@/lib/apiClient";

const shopsApi = {
  list: () => apiClient.get("/shop/manage/"),
  create: (data) => apiClient.post("/shop/manage/", data),
  update: (id, data) => apiClient.put(`/shop/manage/${id}/`, data),
};

export default shopsApi;
