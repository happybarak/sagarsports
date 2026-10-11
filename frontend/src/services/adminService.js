import api from "./api";

export const adminService = {
  fetchDashboardSummary: async () => {
    const { data } = await api.get("/admin/analytics/summary/");
    return data;
  },

  fetchAnalyticsDetail: async (days = 30) => {
    const { data } = await api.get("/admin/analytics/detailed/", { params: { days } });
    return data;
  },

  fetchProducts: async (params = {}) => {
    const { data } = await api.get("/admin/products/", { params });
    return data;
  },

  fetchProduct: async (id) => {
    const { data } = await api.get(`/admin/products/${id}/`);
    return data;
  },

  createProduct: async (formData) => {
    const { data } = await api.post("/admin/products/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  updateProduct: async (id, formData) => {
    const { data } = await api.patch(`/admin/products/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteProduct: async (id) => {
    await api.delete(`/admin/products/${id}/`);
  },

  fetchCategories: async () => {
    const { data } = await api.get("/admin/categories/", { params: { page_size: 100 } });
    return data.results;
  },

  createCategory: async (payload) => {
    const { data } = await api.post("/admin/categories/", payload);
    return data;
  },

  updateCategory: async (id, payload) => {
    const { data } = await api.patch(`/admin/categories/${id}/`, payload);
    return data;
  },

  deleteCategory: async (id) => {
    await api.delete(`/admin/categories/${id}/`);
  },

  fetchOrders: async (params = {}) => {
    const { data } = await api.get("/admin/orders/", { params });
    return data;
  },

  fetchOrder: async (id) => {
    const { data } = await api.get(`/admin/orders/${id}/`);
    return data;
  },

  updateOrderStatus: async (id, statusValue) => {
    const { data } = await api.patch(`/admin/orders/${id}/`, { status: statusValue });
    return data;
  },

  fetchUsers: async (params = {}) => {
    const { data } = await api.get("/admin/users/", { params });
    return data;
  },

  generateDescription: async ({ name, brand, category }) => {
    const { data } = await api.post("/admin/products/generate-description/", {
      name,
      brand,
      category,
    });
    return data.description;
  },
};

export default adminService;
