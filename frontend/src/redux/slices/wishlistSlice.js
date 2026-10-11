import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import wishlistService from "../../services/wishlistService";

const extractErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong with your wishlist.";

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const wishlist = await wishlistService.fetchWishlist();
      return wishlist.items;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const wishlist = await wishlistService.addItem(productId);
      return wishlist.items;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (itemId, { rejectWithValue }) => {
    try {
      const wishlist = await wishlistService.removeItem(itemId);
      return wishlist.items;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    clearWishlist: (state) => {
      // Called on logout so the header badge/heart states don't keep
      // showing the previous user's wishlist.
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => {
      state.status = "loading";
      state.error = null;
    };
    const setSucceeded = (state, action) => {
      state.status = "succeeded";
      state.items = action.payload;
    };
    const setFailed = (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    };

    builder
      .addCase(fetchWishlist.pending, setLoading)
      .addCase(fetchWishlist.fulfilled, setSucceeded)
      .addCase(fetchWishlist.rejected, setFailed)
      .addCase(addToWishlist.fulfilled, setSucceeded)
      .addCase(addToWishlist.rejected, setFailed)
      .addCase(removeFromWishlist.fulfilled, setSucceeded)
      .addCase(removeFromWishlist.rejected, setFailed);
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
