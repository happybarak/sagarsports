import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

function AdminRoute() {
  const { isAuthenticated, isCheckingSession, user } = useSelector((state) => state.auth);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_staff) {
    // Not an admin — send them back to the storefront rather than a
    // dead-end 403 page.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
