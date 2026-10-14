import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { logoutUser } from "../../redux/slices/authSlice";

function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <main className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <span className="rounded-full bg-brand-accent/10 px-4 py-1 text-sm font-medium text-brand-accent">
        Protected route
      </span>
      <h1 className="text-2xl font-bold text-brand">
        Welcome, {user?.first_name || user?.email}
      </h1>
      <p className="max-w-md text-gray-600">
        You only see this page because ProtectedRoute confirmed you're
        authenticated.
      </p>

      <div className="mt-2 flex gap-3">
        <Link
          to="/profile/orders"
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-light"
        >
          My Orders
        </Link>
        <Link
          to="/profile/addresses"
          className="rounded-md border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
        >
          My Addresses
        </Link>
        <button
          onClick={() => dispatch(logoutUser())}
          className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          Log out
        </button>
      </div>
    </main>
  );
}

export default ProfilePage;
