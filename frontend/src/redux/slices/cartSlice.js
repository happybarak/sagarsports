import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import cartService from "../../services/cartService";
import cartStorage from "../../services/cartStorage";

const extractErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong with your cart.";

// Server cart items and guest (localStorage) items are shaped slightly
// differently, so every thunk below normalizes to one common shape:
// { key, id, product, variant, quantity, unit_price, line_total }
// `id` is the server CartItem pk (null for guest items — they're keyed by
// product+variant instead, since there's no server row yet).
const normalizeServerItems = (items) =>
  items.map((item) => ({
    key: `server-${item.id}`,
    id: item.id,
    product: item.product,
    variant: item.variant,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
  }));

const guestItemKey = (productId, variantId) => `guest-${productId}-${variantId || "base"}`;

const buildGuestItem = (product, variant, quantity) => {
  const unitPrice = Number(product.effective_price) + (variant ? Number(variant.price_delta) : 0);
  return {
    key: guestItemKey(product.id, variant?.id),
    id: null,
    product,
    variant: variant || null,
    quantity,
    unit_price: unitPrice,
    line_total: unitPrice * quantity,
  };
};

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.isAuthenticated) {
      return { items: cartStorage.getItems() };
    }
    try {
      const cart = await cartService.fetchCart();
      return { items: normalizeServerItems(cart.items) };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ product, variant, quantity }, { getState, rejectWithValue }) => {
    const { auth } = getState();

    if (auth.isAuthenticated) {
      try {
        const cart = await cartService.addItem({
          productId: product.id,
          variantId: variant?.id,
          quantity,
        });
        return { items: normalizeServerItems(cart.items) };
      } catch (error) {
        return rejectWithValue(extractErrorMessage(error));
      }
    }

    const items = cartStorage.getItems();
    const key = guestItemKey(product.id, variant?.id);
    const existingIndex = items.findIndex((item) => item.key === key);
    const availableStock = variant ? variant.stock : product.stock;

    if (existingIndex >= 0) {
      const newQuantity = Math.min(items[existingIndex].quantity + quantity, availableStock);
      items[existingIndex] = buildGuestItem(product, variant, newQuantity);
    } else {
      items.push(buildGuestItem(product, variant, Math.min(quantity, availableStock)));
    }

    cartStorage.setItems(items);
    return { items };
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async ({ key, itemId, quantity }, { getState, rejectWithValue }) => {
    const { auth } = getState();

    if (auth.isAuthenticated && itemId) {
      try {
        const cart = await cartService.updateItem(itemId, { quantity });
        return { items: normalizeServerItems(cart.items) };
      } catch (error) {
        return rejectWithValue(extractErrorMessage(error));
      }
    }

    const items = cartStorage.getItems();
    const index = items.findIndex((item) => item.key === key);
    if (index >= 0) {
      items[index] = buildGuestItem(items[index].product, items[index].variant, quantity);
      cartStorage.setItems(items);
    }
    return { items };
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeItem",
  async ({ key, itemId }, { getState, rejectWithValue }) => {
    const { auth } = getState();

    if (auth.isAuthenticated && itemId) {
      try {
        const cart = await cartService.removeItem(itemId);
        return { items: normalizeServerItems(cart.items) };
      } catch (error) {
        return rejectWithValue(extractErrorMessage(error));
      }
    }

    const items = cartStorage.getItems().filter((item) => item.key !== key);
    cartStorage.setItems(items);
    return { items };
  }
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();

    if (auth.isAuthenticated) {
      try {
        const cart = await cartService.clearCart();
        return { items: normalizeServerItems(cart.items) };
      } catch (error) {
        return rejectWithValue(extractErrorMessage(error));
      }
    }

    cartStorage.clear();
    return { items: [] };
  }
);

// Called once, right after a successful login/register — pushes whatever
// was in the guest's localStorage cart to the server, merges it with
// anything already there, then clears localStorage so it isn't synced
// again on a future login.
export const syncGuestCartToServer = createAsyncThunk(
  "cart/syncGuestCartToServer",
  async (_, { rejectWithValue }) => {
    const guestItems = cartStorage.getItems();
    try {
      if (guestItems.length === 0) {
        const cart = await cartService.fetchCart();
        return { items: normalizeServerItems(cart.items) };
      }
      const payload = guestItems.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant?.id,
        quantity: item.quantity,
      }));
      const cart = await cartService.syncCart(payload);
      cartStorage.clear();
      return { items: normalizeServerItems(cart.items) };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const setLoading = (state) => {
      state.status = "loading";
      state.error = null;
    };
    const setSucceeded = (state, action) => {
      state.status = "succeeded";
      state.items = action.payload.items;
    };
    const setFailed = (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    };

    builder
      .addCase(fetchCart.pending, setLoading)
      .addCase(fetchCart.fulfilled, setSucceeded)
      .addCase(fetchCart.rejected, setFailed)
      .addCase(addToCart.pending, setLoading)
      .addCase(addToCart.fulfilled, setSucceeded)
      .addCase(addToCart.rejected, setFailed)
      .addCase(updateCartItemQuantity.fulfilled, setSucceeded)
      .addCase(updateCartItemQuantity.rejected, setFailed)
      .addCase(removeCartItem.fulfilled, setSucceeded)
      .addCase(removeCartItem.rejected, setFailed)
      .addCase(clearCart.fulfilled, setSucceeded)
      .addCase(clearCart.rejected, setFailed)
      .addCase(syncGuestCartToServer.fulfilled, setSucceeded)
      .addCase(syncGuestCartToServer.rejected, setFailed);
  },
});

export default cartSlice.reducer;
