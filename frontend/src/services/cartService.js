import api from "./api";

export const cartService = {
  fetchCart: async () => {
    const { data } = await api.get("/cart/");
    return data; // { id, items, subtotal, total_items }
  },

  addItem: async ({ productId, variantId, quantity }) => {
    const { data } = await api.post("/cart/items/", {
      product_id: productId,
      variant_id: variantId || undefined,
      quantity,
    });
    return data.data; // full cart
  },

  updateItem: async (itemId, { quantity }) => {
    const { data } = await api.patch(`/cart/items/${itemId}/`, { quantity });
    return data.data;
  },

  removeItem: async (itemId) => {
    const { data } = await api.delete(`/cart/items/${itemId}/`);
    return data.data;
  },

  syncCart: async (items) => {
    const { data } = await api.post("/cart/sync/", { items });
    return data.data;
  },

  clearCart: async () => {
    const { data } = await api.delete("/cart/clear/");
    return data.data;
  },
};

export default cartService;
