import { useState } from "react";
import { Link } from "react-router-dom";

import authService from "../../services/authService";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    try {
      await authService.requestPasswordReset(email);
    } finally {
      // Same outcome shown whether or not the email has an account, and
      // whether or not the request technically succeeded — the backend
      // itself never reveals account existence, and neither should this.
      setStatus("done");
    }
  };

  return (
    <main className="flex items-center justify-center bg-brand-surface px-4 py-16">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand">Forgot your password?</h1>
        <p className="mb-6 text-sm text-gray-500">
          Enter your email and we'll send you a reset link.
        </p>

        {status === "done" ? (
          <p className="rounded-md bg-brand-surface px-3 py-2 text-sm text-gray-600">
            If that email has an account, we've sent a password reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
            >
              {status === "loading" ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-medium text-brand-accent hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;
