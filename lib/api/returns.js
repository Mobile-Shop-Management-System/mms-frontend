import apiClient from "@/lib/apiClient";

const returnsApi = {
  list:   (params) => apiClient.get("/returns/", { params }),
  get:    (id)     => apiClient.get(`/returns/${id}/`),
  create: (data)   => apiClient.post("/returns/", data),
};

export default returnsApi;
