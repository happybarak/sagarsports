import api from "./api";

export const orderService = {
  // payload is either { addressId } (authenticated — pulls from server
  // cart) or the full guest shape: { guestEmail, items, shippingFullName,
  // shippingPhone, shippingAddressLine1, shippingAddressLine2?,
  // shippingCity, shippingState, shippingPostalCode, shippingCountry? }
  createOrder: async (payload) => {
    const body = payload.addressId
      ? { address_id: payload.addressId, payment_method: payload.paymentMethod || "online" }
      : {
          guest_email: payload.guestEmail,
          items: payload.items,
          shipping_full_name: payload.shippingFullName,
          shipping_phone: payload.shippingPhone,
          shipping_address_line_1: payload.shippingAddressLine1,
          shipping_address_line_2: payload.shippingAddressLine2 || "",
          shipping_city: payload.shippingCity,
          shipping_state: payload.shippingState,
          shipping_postal_code: payload.shippingPostalCode,
          shipping_country: payload.shippingCountry || "India",
          payment_method: payload.paymentMethod || "online",
        };
    const { data } = await api.post("/orders/", body);
    return data.data; // includes claim_token for guest orders
  },

  fetchOrders: async (page = 1) => {
    const { data } = await api.get("/orders/", { params: { page } });
    return data; // paginated: { count, total_pages, current_page, results }
  },

  fetchOrderDetail: async (id, claimToken) => {
    const params = claimToken ? { claim_token: claimToken } : {};
    const { data } = await api.get(`/orders/${id}/`, { params });
    return data;
  },

  cancelOrder: async (id) => {
    const { data } = await api.post(`/orders/${id}/cancel/`);
    return data.data;
  },
};

export default orderService;
