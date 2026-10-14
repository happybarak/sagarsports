import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import reviewService from "../../services/reviewService";

const extractErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong.";

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async ({ slug, page = 1 }, { rejectWithValue }) => {
    try {
      const data = await reviewService.fetchProductReviews(slug, page);
      return { ...data, slug };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const createReview = createAsyncThunk(
  "reviews/createReview",
  async (payload, { rejectWithValue }) => {
    try {
      return await reviewService.createReview(payload);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const updateReview = createAsyncThunk(
  "reviews/updateReview",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await reviewService.updateReview(id, payload);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",
  async (id, { rejectWithValue }) => {
    try {
      return await reviewService.deleteReview(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const initialListState = {
  slug: null,
  items: [],
  count: 0,
  totalPages: 1,
  currentPage: 1,
  status: "idle",
  error: null,
};

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    list: { ...initialListState },
    mutationStatus: "idle", // covers create/update/delete in flight
    mutationError: null,
  },
  reducers: {
    clearReviews: (state) => {
      state.list = { ...initialListState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.list.status = "loading";
        state.list.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.list.status = "succeeded";
        state.list.slug = action.payload.slug;
        state.list.items = action.payload.results;
        state.list.count = action.payload.count;
        state.list.totalPages = action.payload.total_pages;
        state.list.currentPage = action.payload.current_page;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.list.status = "failed";
        state.list.error = action.payload;
      })
      .addCase(createReview.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.list.items = [action.payload, ...state.list.items];
        state.list.count += 1;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(updateReview.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.list.items = state.list.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.list.items = state.list.items.filter((item) => item.id !== action.payload);
        state.list.count = Math.max(0, state.list.count - 1);
      });
  },
});

export const { clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
