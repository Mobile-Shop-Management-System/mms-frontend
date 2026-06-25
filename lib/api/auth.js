import apiClient from "@/lib/apiClient";

const auth = {
  login: (credentials) =>
    apiClient.post("/auth/login/", credentials),

  register: (data) =>
    apiClient.post("/auth/register/", data),

  logout: (refreshToken) =>
    apiClient.post("/auth/logout/", { refresh: refreshToken }),

  me: () =>
    apiClient.get("/auth/me/"),

  updateProfile: (data) =>
    apiClient.put("/auth/me/", data),

  changePassword: (data) =>
    apiClient.post("/auth/me/change-password/", data),

  uploadAvatar: (formData) =>
    apiClient.post("/auth/me/avatar/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  removeAvatar: () =>
    apiClient.delete("/auth/me/avatar/"),

  refreshToken: (refresh) =>
    apiClient.post("/auth/token/refresh/", { refresh }),

  // User management (superuser only)
  listUsers: (params = {}) =>
    apiClient.get("/auth/users/", { params }),

  getUser: (id) =>
    apiClient.get(`/auth/users/${id}/`),

  createUser: (data) =>
    apiClient.post("/auth/users/", data),

  updateUser: (id, data) =>
    apiClient.put(`/auth/users/${id}/`, data),

  deleteUser: (id) =>
    apiClient.delete(`/auth/users/${id}/`),
};

export default auth;
