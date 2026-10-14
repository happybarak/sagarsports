import api from "./api";

export const paymentService = {
  initiatePayment: async (orderId, claimToken) => {
    const { data } = await api.post("/payments/initiate/", {
      order_id: orderId,
      claim_token: claimToken || undefined,
    });
    return data.data;
  },

  confirmPayment: async (orderId, claimToken) => {
    const { data } = await api.post("/payments/confirm/", {
      order_id: orderId,
      claim_token: claimToken || undefined,
    });
    return data.data;
  },
};

export default paymentService;
