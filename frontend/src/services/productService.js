import api from "./api";

export const productService = {
  fetchProducts: async (params = {}) => {
    const { data } = await api.get("/products/", { params });
    return data; // { count, total_pages, current_page, page_size, next, previous, results }
  },

  fetchBrands: async () => {
    const { data } = await api.get("/products/brands/");
    return data; // string[]
  },

  fetchProductDetail: async (slug) => {
    const { data } = await api.get(`/products/${slug}/`);
    return data;
  },

  fetchRelatedProducts: async (slug) => {
    const { data } = await api.get(`/products/${slug}/related/`);
    return data;
  },

  fetchFrequentlyBoughtTogether: async (slug) => {
    const { data } = await api.get(`/products/${slug}/frequently-bought-together/`);
    return data; // { results, is_fallback }
  },

  fetchSuggestions: async (query) => {
    const { data } = await api.get("/products/suggestions/", { params: { q: query } });
    return data; // array
  },
};

export default productService;
