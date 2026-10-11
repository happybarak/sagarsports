import api from "./api";

export const categoryService = {
  fetchCategories: async () => {
    const { data } = await api.get("/categories/");
    return data; // array of root categories, each with nested children
  },

  fetchCategoryDetail: async (slug) => {
    const { data } = await api.get(`/categories/${slug}/`);
    return data; // { id, name, slug, image, children }
  },
};

export default categoryService;
