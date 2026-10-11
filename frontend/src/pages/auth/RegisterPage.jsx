import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { clearAuthError, registerUser } from "../../redux/slices/authSlice";
import { syncGuestCartToServer } from "../../redux/slices/cartSlice";
import { fetchWishlist } from "../../redux/slices/wishlistSlice";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  password2: "",
};

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);

  // Present when arriving from a guest order's "Create Account" prompt —
  // included in the register payload so the backend can attach that
  // specific order to the new account (see RegisterView._maybe_claim_guest_order).
  const claimOrderId = location.state?.claimOrderId;
  const claimToken = location.state?.claimToken;

  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());
    const payload = claimOrderId
      ? { ...form, claim_order_id: claimOrderId, claim_token: claimToken }
      : form;
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      await dispatch(syncGuestCartToServer());
      dispatch(fetchWishlist());
      navigate(claimOrderId ? `/orders/${claimOrderId}` : "/", { replace: true });
    }
  };

  return (
    <main className="flex items-center justify-center bg-brand-surface px-4 py-10">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand">Create your account</h1>
        <p className="mb-6 text-sm text-gray-500">
          {claimOrderId
            ? "Create an account to save your order to your history."
            : "Join SagarSports to start shopping"}
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              First name
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Last name
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
            </label>
          </div>

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
            Phone
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              placeholder="9999999999"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Confirm password
            <input
              type="password"
              name="password2"
              required
              value={form.password2}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-light disabled:opacity-60"
          >
            {status === "loading" ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;
