const GUEST_CART_KEY = "novaris_guest_cart";

export const cartStorage = {
  getItems: () => {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  setItems: (items) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  },
  clear: () => {
    localStorage.removeItem(GUEST_CART_KEY);
  },
};

export default cartStorage;
