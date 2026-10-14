import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import addressService from "../../services/addressService";

const extractErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong.";

export const fetchAddresses = createAsyncThunk(
  "addresses/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      return await addressService.fetchAddresses();
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const createAddress = createAsyncThunk(
  "addresses/createAddress",
  async (payload, { rejectWithValue }) => {
    try {
      return await addressService.createAddress(payload);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateAddress = createAsyncThunk(
  "addresses/updateAddress",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await addressService.updateAddress(id, payload);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deleteAddress = createAsyncThunk(
  "addresses/deleteAddress",
  async (id, { rejectWithValue }) => {
    try {
      return await addressService.deleteAddress(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const addressSlice = createSlice({
  name: "addresses",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        // A new default address means every other address just lost that
        // flag server-side (Address.save() handles it) — refetching would
        // be the safe way to reflect that, but for the common case (first
        // address, or a non-default add) this optimistic update is
        // instant. The checkout flow re-fetches addresses on mount anyway.
        if (action.payload.is_default) {
          state.items = state.items.map((item) => ({ ...item, is_default: false }));
        }
        state.items.push(action.payload);
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        if (action.payload.is_default) {
          state.items = state.items.map((item) => ({ ...item, is_default: false }));
        }
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default addressSlice.reducer;
