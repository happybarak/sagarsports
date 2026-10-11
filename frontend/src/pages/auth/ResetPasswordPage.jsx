import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import authService from "../../services/authService";

function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await authService.confirmPasswordReset({ uid, token, newPassword, newPassword2 });
      navigate("/login", { state: { passwordResetSuccess: true } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "This reset link is invalid or has expired. Request a new one."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex items-center justify-center bg-brand-surface px-4 py-16">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand">Set a new password</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}{" "}
            <Link to="/forgot-password" className="font-medium underline">
              Request a new link
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            New password
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Confirm new password
            <input
              type="password"
              required
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Reset Password"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default ResetPasswordPage;
