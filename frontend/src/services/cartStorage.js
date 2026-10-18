const GUEST_CART_KEY = "sagarsports_guest_cart";

export const cartStorage = {
  getItems: () => {
    try {
      const raw =
        localStorage.getItem(GUEST_CART_KEY) || localStorage.getItem("novaris_guest_cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  setItems: (items) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    localStorage.removeItem("novaris_guest_cart");
  },
  clear: () => {
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem("novaris_guest_cart");
  },
};

export default cartStorage;
