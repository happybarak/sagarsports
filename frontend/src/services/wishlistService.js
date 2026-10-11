import api from "./api";

export const wishlistService = {
  fetchWishlist: async () => {
    const { data } = await api.get("/wishlist/");
    return data; // { id, items }
  },

  addItem: async (productId) => {
    const { data } = await api.post("/wishlist/items/", { product_id: productId });
    return data.data;
  },

  removeItem: async (itemId) => {
    const { data } = await api.delete(`/wishlist/items/${itemId}/`);
    return data.data;
  },
};

export default wishlistService;
