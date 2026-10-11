import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="text-6xl font-bold text-brand">404</div>
      <h1 className="mt-4 text-2xl font-bold text-gray-800">Page not found</h1>
      <p className="mt-2 text-gray-500">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
      >
        Back to Sagar Sports
      </Link>
    </main>
  );
}

export default NotFoundPage;
