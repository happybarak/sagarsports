import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import productService from "../../services/productService";

const extractErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Failed to load products.";

export const fetchFeaturedProducts = createAsyncThunk(
  "products/fetchFeatured",
  async (_, { rejectWithValue }) => {
    try {
      const data = await productService.fetchProducts({ featured: true, page_size: 8 });
      return data.results;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchBestSellers = createAsyncThunk(
  "products/fetchBestSellers",
  async (_, { rejectWithValue }) => {
    try {
      const data = await productService.fetchProducts({ best_seller: true, page_size: 8 });
      return data.results;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchNewArrivals = createAsyncThunk(
  "products/fetchNewArrivals",
  async (_, { rejectWithValue }) => {
    try {
      const data = await productService.fetchProducts({ new_arrival: true, page_size: 8 });
      return data.results;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// General-purpose listing thunk for the product listing / category pages
// (Phase 7) — accepts any combination of the ProductFilter query params
// (category, brand, min_price, max_price, min_rating, in_stock, search,
// ordering, page, page_size) and stores the full paginated response.
export const fetchProductList = createAsyncThunk(
  "products/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      return await productService.fetchProducts(params);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchBrands = createAsyncThunk(
  "products/fetchBrands",
  async (_, { rejectWithValue }) => {
    try {
      return await productService.fetchBrands();
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchProductDetail = createAsyncThunk(
  "products/fetchDetail",
  async (slug, { rejectWithValue }) => {
    try {
      return await productService.fetchProductDetail(slug);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk(
  "products/fetchRelated",
  async (slug, { rejectWithValue }) => {
    try {
      return await productService.fetchRelatedProducts(slug);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchFrequentlyBoughtTogether = createAsyncThunk(
  "products/fetchFrequentlyBoughtTogether",
  async (slug, { rejectWithValue }) => {
    try {
      return await productService.fetchFrequentlyBoughtTogether(slug);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const sectionInitialState = { items: [], status: "idle", error: null };

const listingInitialState = {
  items: [],
  count: 0,
  totalPages: 1,
  currentPage: 1,
  status: "idle",
  error: null,
};

const productSlice = createSlice({
  name: "products",
  initialState: {
    featured: { ...sectionInitialState },
    bestSellers: { ...sectionInitialState },
    newArrivals: { ...sectionInitialState },
    listing: { ...listingInitialState },
    brands: { items: [], status: "idle" },
    detail: { product: null, status: "idle", error: null },
    related: { items: [], status: "idle" },
    frequentlyBoughtTogether: { items: [], isFallback: false, status: "idle" },
  },
  reducers: {
    clearProductDetail: (state) => {
      // Called on unmount so switching from one product page to another
      // doesn't briefly show the previous product while the new one loads.
      state.detail = { product: null, status: "idle", error: null };
      state.related = { items: [], status: "idle" };
      state.frequentlyBoughtTogether = { items: [], isFallback: false, status: "idle" };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.featured.status = "loading";
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featured.status = "succeeded";
        state.featured.items = action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.featured.status = "failed";
        state.featured.error = action.payload;
      })
      .addCase(fetchBestSellers.pending, (state) => {
        state.bestSellers.status = "loading";
      })
      .addCase(fetchBestSellers.fulfilled, (state, action) => {
        state.bestSellers.status = "succeeded";
        state.bestSellers.items = action.payload;
      })
      .addCase(fetchBestSellers.rejected, (state, action) => {
        state.bestSellers.status = "failed";
        state.bestSellers.error = action.payload;
      })
      .addCase(fetchNewArrivals.pending, (state) => {
        state.newArrivals.status = "loading";
      })
      .addCase(fetchNewArrivals.fulfilled, (state, action) => {
        state.newArrivals.status = "succeeded";
        state.newArrivals.items = action.payload;
      })
      .addCase(fetchNewArrivals.rejected, (state, action) => {
        state.newArrivals.status = "failed";
        state.newArrivals.error = action.payload;
      })
      .addCase(fetchProductList.pending, (state) => {
        state.listing.status = "loading";
        state.listing.error = null;
      })
      .addCase(fetchProductList.fulfilled, (state, action) => {
        state.listing.status = "succeeded";
        state.listing.items = action.payload.results;
        state.listing.count = action.payload.count;
        state.listing.totalPages = action.payload.total_pages;
        state.listing.currentPage = action.payload.current_page;
      })
      .addCase(fetchProductList.rejected, (state, action) => {
        state.listing.status = "failed";
        state.listing.error = action.payload;
      })
      .addCase(fetchBrands.pending, (state) => {
        state.brands.status = "loading";
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands.status = "succeeded";
        state.brands.items = action.payload;
      })
      .addCase(fetchBrands.rejected, (state) => {
        state.brands.status = "failed";
      })
      .addCase(fetchProductDetail.pending, (state) => {
        state.detail.status = "loading";
        state.detail.error = null;
      })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.detail.status = "succeeded";
        state.detail.product = action.payload;
      })
      .addCase(fetchProductDetail.rejected, (state, action) => {
        state.detail.status = "failed";
        state.detail.error = action.payload;
      })
      .addCase(fetchRelatedProducts.pending, (state) => {
        state.related.status = "loading";
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.related.status = "succeeded";
        state.related.items = action.payload;
      })
      .addCase(fetchRelatedProducts.rejected, (state) => {
        state.related.status = "failed";
      })
      .addCase(fetchFrequentlyBoughtTogether.pending, (state) => {
        state.frequentlyBoughtTogether.status = "loading";
      })
      .addCase(fetchFrequentlyBoughtTogether.fulfilled, (state, action) => {
        state.frequentlyBoughtTogether.status = "succeeded";
        state.frequentlyBoughtTogether.items = action.payload.results;
        state.frequentlyBoughtTogether.isFallback = action.payload.is_fallback;
      })
      .addCase(fetchFrequentlyBoughtTogether.rejected, (state) => {
        state.frequentlyBoughtTogether.status = "failed";
      });
  },
});

export const { clearProductDetail } = productSlice.actions;
export default productSlice.reducer;
