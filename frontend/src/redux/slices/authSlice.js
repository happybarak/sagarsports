import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import authService from "../../services/authService";
import { tokenStorage } from "../../services/api";

const extractErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong.";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      const result = await authService.register(payload);
      tokenStorage.setTokens(result.access, result.refresh);
      return result.user;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      const result = await authService.login(payload);
      tokenStorage.setTokens(result.access, result.refresh);
      return result.user;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  try {
    await authService.logout();
  } finally {
    tokenStorage.clearTokens();
  }
});

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.fetchCurrentUser();
    } catch (error) {
      tokenStorage.clearTokens();
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  status: "idle", // idle | loading | succeeded | failed
  // "checkingSession" covers the app-load rehydration window (fetchCurrentUser)
  // so routes can show a loading state instead of bouncing to /login too early.
  isCheckingSession: Boolean(tokenStorage.getAccessToken()),
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "idle";
      })
      // Fetch current user (app-load rehydration)
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isCheckingSession = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isCheckingSession = false;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isCheckingSession = false;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
