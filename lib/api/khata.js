import apiClient from "@/lib/apiClient";

const khataApi = {
  list: (params) => apiClient.get("/khata/", { params }),
  get: (id) => apiClient.get(`/khata/${id}/`),
  getPending: () => apiClient.get("/khata/pending/"),
  getPaid: () => apiClient.get("/khata/paid/"),
  addPayment: (id, data) => apiClient.post(`/khata/${id}/add_payment/`, data),
};

export default khataApi;
