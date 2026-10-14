import { Link, Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";

function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3">
          <span className="text-sm text-gray-500">Sagar Sports Admin</span>
          <Link to="/" className="text-sm font-medium text-brand-accent hover:underline">
            ← Back to store
          </Link>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
