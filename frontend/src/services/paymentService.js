import api from "./api";

export const paymentService = {
  initiatePayment: async (orderId, claimToken) => {
    const { data } = await api.post("/payments/initiate/", {
      order_id: orderId,
      claim_token: claimToken || undefined,
    });
    return data.data;
  },

  confirmPayment: async (params) => {
    // Accepts either object { orderId, claimToken, razorpayPaymentId, ... } or positional arguments
    let payload = {};
    if (typeof params === "object" && params !== null && "orderId" in params) {
      payload = {
        order_id: params.orderId,
        claim_token: params.claimToken || undefined,
        razorpay_payment_id: params.razorpayPaymentId || undefined,
        razorpay_order_id: params.razorpayOrderId || undefined,
        razorpay_signature: params.razorpaySignature || undefined,
      };
    } else {
      payload = {
        order_id: arguments[0],
        claim_token: arguments[1] || undefined,
      };
    }

    const { data } = await api.post("/payments/confirm/", payload);
    return data.data;
  },
};

export default paymentService;
