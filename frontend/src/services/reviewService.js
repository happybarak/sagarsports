import api from "./api";

export const reviewService = {
  fetchProductReviews: async (slug, page = 1) => {
    const { data } = await api.get(`/products/${slug}/reviews/`, { params: { page } });
    return data; // paginated: { count, total_pages, current_page, results }
  },

  createReview: async ({ productId, rating, title, comment }) => {
    const { data } = await api.post("/reviews/", {
      product_id: productId,
      rating,
      title,
      comment,
    });
    return data.data;
  },

  updateReview: async (id, { rating, title, comment }) => {
    const { data } = await api.patch(`/reviews/${id}/`, { rating, title, comment });
    return data.data;
  },

  deleteReview: async (id) => {
    await api.delete(`/reviews/${id}/`);
    return id;
  },
};

export default reviewService;
