import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import categoryService from "../../services/categoryService";

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await categoryService.fetchCategories();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load categories."
      );
    }
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default categorySlice.reducer;
