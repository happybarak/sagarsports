import { configureStore } from "@reduxjs/toolkit";

import addressReducer from "./slices/addressSlice";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import categoryReducer from "./slices/categorySlice";
import orderReducer from "./slices/orderSlice";
import productReducer from "./slices/productSlice";
import reviewReducer from "./slices/reviewSlice";
import wishlistReducer from "./slices/wishlistSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoryReducer,
    products: productReducer,
    cart: cartReducer,
    addresses: addressReducer,
    orders: orderReducer,
    wishlist: wishlistReducer,
    reviews: reviewReducer,
  },
});
