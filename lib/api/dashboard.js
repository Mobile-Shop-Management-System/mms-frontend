import apiClient from "@/lib/apiClient";

const dashboardApi = {
  get: () => apiClient.get("/dashboard/"),
};

export default dashboardApi;
