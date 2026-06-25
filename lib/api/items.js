import apiClient from "@/lib/apiClient";

const itemsApi = {
  list: (params) => apiClient.get("/items/", { params }),
  create: (data) => apiClient.post("/items/", data),
  get: (id) => apiClient.get(`/items/${id}/`),
  update: (id, data) => apiClient.put(`/items/${id}/`, data),
  remove: (id) => apiClient.delete(`/items/${id}/`),
  // Variants
  listVariants: (itemId) => apiClient.get(`/items/${itemId}/variants/`),
  createVariant: (itemId, data) => apiClient.post(`/items/${itemId}/variants/`, data),
  updateVariant: (itemId, variantId, data) => apiClient.patch(`/items/${itemId}/variants/${variantId}/`, data),
  deleteVariant: (itemId, variantId) => apiClient.delete(`/items/${itemId}/variants/${variantId}/`),
  // Images
  uploadImage: (itemId, formData, options = {}) => apiClient.post(`/items/${itemId}/images/`, formData, { headers: { "Content-Type": "multipart/form-data" }, ...options }),
  deleteImage: (itemId, imageId) => apiClient.delete(`/items/${itemId}/images/${imageId}/`),
};

export default itemsApi;
