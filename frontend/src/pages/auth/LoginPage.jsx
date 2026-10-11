import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { clearAuthError, loginUser } from "../../redux/slices/authSlice";
import { syncGuestCartToServer } from "../../redux/slices/cartSlice";
import { fetchWishlist } from "../../redux/slices/wishlistSlice";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      await dispatch(syncGuestCartToServer());
      dispatch(fetchWishlist());
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <main className="flex items-center justify-center bg-brand-surface px-4 py-16">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand">Welcome back</h1>
        <p className="mb-6 text-sm text-gray-500">Log in to your SagarSports account</p>

        {location.state?.passwordResetSuccess && (
          <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Your password has been reset. Log in with your new password.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            <span className="flex items-center justify-between">
              Password
              <Link to="/forgot-password" className="text-xs font-normal text-brand-accent hover:underline">
                Forgot password?
              </Link>
            </span>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-light disabled:opacity-60"
          >
            {status === "loading" ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-brand-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
