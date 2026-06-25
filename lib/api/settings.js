import apiClient from "@/lib/apiClient";

const settings = {
  getShopSettings: () =>
    apiClient.get("/shop/").then(response => {
      if (response.data?.logo_url && !response.data.logo_url.startsWith('http')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const baseUrl = apiUrl.replace('/api/v1', '');
        response.data.logo_url = `${baseUrl}${response.data.logo_url}`;
      }
      return response;
    }),

  updateShopSettings: (data) =>
    apiClient.post("/shop/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default settings;
