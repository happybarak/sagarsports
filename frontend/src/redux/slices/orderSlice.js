import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import orderService from "../../services/orderService";
import paymentService from "../../services/paymentService";

const extractErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong.";

// payload: { addressId } for authenticated checkout, or the full guest
// shape (see orderService.createOrder) for guest checkout.
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (payload, { rejectWithValue }) => {
    try {
      return await orderService.createOrder(payload);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const initiatePayment = createAsyncThunk(
  "payments/initiate",
  async ({ orderId, claimToken }, { rejectWithValue }) => {
    try {
      return await paymentService.initiatePayment(orderId, claimToken);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const confirmPayment = createAsyncThunk(
  "payments/confirm",
  async (payload, { rejectWithValue }) => {
    try {
      return await paymentService.confirmPayment(payload);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchOrderDetail = createAsyncThunk(
  "orders/fetchDetail",
  async ({ id, claimToken }, { rejectWithValue }) => {
    try {
      return await orderService.fetchOrderDetail(id, claimToken);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchOrderList = createAsyncThunk(
  "orders/fetchList",
  async (page = 1, { rejectWithValue }) => {
    try {
      return await orderService.fetchOrders(page);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (id, { rejectWithValue }) => {
    try {
      return await orderService.cancelOrder(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    current: { order: null, status: "idle", error: null },
    list: {
      items: [],
      count: 0,
      totalPages: 1,
      currentPage: 1,
      status: "idle",
      error: null,
    },
  },
  reducers: {
    clearCurrentOrder: (state) => {
      state.current = { order: null, status: "idle", error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.current.status = "loading";
        state.current.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.current.order = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.current.status = "failed";
        state.current.error = action.payload;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.current.status = "succeeded";
        state.current.order = action.payload;
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.current.status = "failed";
        state.current.error = action.payload;
      })
      .addCase(fetchOrderDetail.pending, (state) => {
        state.current.status = "loading";
        state.current.error = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.current.status = "succeeded";
        state.current.order = action.payload;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.current.status = "failed";
        state.current.error = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.current.order = action.payload;
      })
      .addCase(fetchOrderList.pending, (state) => {
        state.list.status = "loading";
        state.list.error = null;
      })
      .addCase(fetchOrderList.fulfilled, (state, action) => {
        state.list.status = "succeeded";
        state.list.items = action.payload.results;
        state.list.count = action.payload.count;
        state.list.totalPages = action.payload.total_pages;
        state.list.currentPage = action.payload.current_page;
      })
      .addCase(fetchOrderList.rejected, (state, action) => {
        state.list.status = "failed";
        state.list.error = action.payload;
      });
  },
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
