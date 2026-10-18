import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route, Routes } from "react-router-dom";

import AdminLayout from "./components/admin/AdminLayout";
import Layout from "./components/layout/Layout";
import ScrollToTop from "./components/common/ScrollToTop";
import { fetchCurrentUser } from "./redux/slices/authSlice";
import { fetchCart } from "./redux/slices/cartSlice";
import { fetchWishlist } from "./redux/slices/wishlistSlice";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ReturnExchangePage from "./pages/ReturnExchangePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import CartPage from "./pages/checkout/CartPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import OrderConfirmationPage from "./pages/checkout/OrderConfirmationPage";
import ProductDetailPage from "./pages/products/ProductDetailPage";
import ProductListingPage from "./pages/products/ProductListingPage";
import AddressesPage from "./pages/profile/AddressesPage";
import OrdersPage from "./pages/profile/OrdersPage";
import ProfilePage from "./pages/profile/ProfilePage";
import WishlistPage from "./pages/wishlist/WishlistPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsAdminPage from "./pages/admin/ProductsAdminPage";
import ProductFormPage from "./pages/admin/ProductFormPage";
import CategoriesAdminPage from "./pages/admin/CategoriesAdminPage";
import OrdersAdminPage from "./pages/admin/OrdersAdminPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import UsersAdminPage from "./pages/admin/UsersAdminPage";
import InventoryAdminPage from "./pages/admin/InventoryAdminPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import AdminRoute from "./routes/AdminRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import { tokenStorage } from "./services/api";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Rehydrate auth state from a stored access token on full page load /
    // refresh, so the user isn't logged out just by reloading the tab.
    // fetchCart/fetchWishlist are deliberately sequenced *after* auth
    // resolves — otherwise they could read stale isAuthenticated=false
    // (cart would load the guest cart, wishlist would just 401 needlessly).
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      dispatch(fetchCurrentUser()).finally(() => {
        dispatch(fetchCart());
        dispatch(fetchWishlist());
      });
    } else {
      dispatch(fetchCart());
    }
  }, [dispatch]);

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/returns-exchanges" element={<ReturnExchangePage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/products" element={<ProductListingPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/category/:slug" element={<ProductListingPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

        {/* Checkout and order confirmation are deliberately public — guest
            checkout doesn't require an account. Access to a *specific*
            order without an account is still gated server-side by
            claim_token, not by this route being open. */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:id" element={<OrderConfirmationPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/orders" element={<OrdersPage />} />
          <Route path="/profile/addresses" element={<AddressesPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>

        {/* Anything unmatched above falls through to the 404 page, which
            keeps the normal storefront header/footer. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin area — its own AdminLayout (sidebar, no storefront chrome),
          gated behind AdminRoute (isAuthenticated AND is_staff). */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/products" element={<ProductsAdminPage />} />
          <Route path="/admin/products/create" element={<ProductFormPage />} />
          <Route path="/admin/products/:id/edit" element={<ProductFormPage />} />
          <Route path="/admin/categories" element={<CategoriesAdminPage />} />
          <Route path="/admin/orders" element={<OrdersAdminPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="/admin/users" element={<UsersAdminPage />} />
          <Route path="/admin/inventory" element={<InventoryAdminPage />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>
    </Routes>
    </>
  );
}

export default App;
