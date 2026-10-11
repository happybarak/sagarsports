import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const { isAuthenticated, isCheckingSession } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isCheckingSession) {
    // Still verifying a stored token against /api/auth/me/ on app load —
    // render nothing rather than bouncing straight to /login and back.
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
