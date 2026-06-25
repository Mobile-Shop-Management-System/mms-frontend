import apiClient from "@/lib/apiClient";

const products = {
  list:             (params)     => apiClient.get("/products/", { params }),
  create:           (data)       => apiClient.post("/products/", data),
  get:              (id)         => apiClient.get(`/products/${id}/`),
  update:           (id, data)   => apiClient.put(`/products/${id}/`, data),
  remove:           (id)         => apiClient.delete(`/products/${id}/`),

  listVariants:     (params)           => apiClient.get("/products/variants/", { params }),
  createVariant:    (productId, data)  => apiClient.post(`/products/${productId}/variants/`, data),
  getVariant:       (id)               => apiClient.get(`/products/variants/${id}/`),
  updateVariant:    (id, data)         => apiClient.put(`/products/variants/${id}/`, data),
  removeVariant:    (id)               => apiClient.delete(`/products/variants/${id}/`),

  listBrands:       (params)     => apiClient.get("/products/brands/", { params }),
  createBrand:      (data)       => apiClient.post("/products/brands/", data),
  updateBrand:      (id, data)   => apiClient.put(`/products/brands/${id}/`, data),
  removeBrand:      (id)         => apiClient.delete(`/products/brands/${id}/`),

  listCategories:   (params)     => apiClient.get("/products/categories/", { params }),
  createCategory:   (data)       => apiClient.post("/products/categories/", data),
  updateCategory:   (id, data)   => apiClient.put(`/products/categories/${id}/`, data),
  removeCategory:   (id)         => apiClient.delete(`/products/categories/${id}/`),
};

export default products;
