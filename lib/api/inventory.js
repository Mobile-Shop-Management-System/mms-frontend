import apiClient from "@/lib/apiClient";

const inventory = {
  listImei: (params) => apiClient.get("/inventory/imei/", { params }),
  createImei: (data) => apiClient.post("/inventory/imei/", data),
  updateImei: (pk, data) => apiClient.put(`/inventory/imei/${pk}/`, data),
  removeImei: (pk) => apiClient.delete(`/inventory/imei/${pk}/`),
  checkImei: (imei) => apiClient.get(`/inventory/imei/check/${imei}/`),
  listAccessoryStock: (params) => apiClient.get("/inventory/accessory-stock/", { params }),
  adjustStock: (data) => apiClient.post("/inventory/accessory-stock/adjust/", data),
  listTransfers: (params) => apiClient.get("/inventory/transfers/", { params }),
  createTransfer: (data) => apiClient.post("/inventory/transfers/", data),
  approveTransfer: (pk) => apiClient.get(`/inventory/transfers/${pk}/approve/`),
  receiveTransfer: (pk) => apiClient.get(`/inventory/transfers/${pk}/receive/`),
  getLowStock: () => apiClient.get("/inventory/low-stock/"),
};

export default inventory;
