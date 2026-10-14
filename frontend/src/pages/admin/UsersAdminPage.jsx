import { useEffect, useState } from "react";

import Pagination from "../../components/common/Pagination";
import adminService from "../../services/adminService";

function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("loading");

  const loadUsers = (page = 1, searchTerm = search) => {
    setStatus("loading");
    adminService
      .fetchUsers({ page, search: searchTerm || undefined })
      .then((data) => {
        setUsers(data.results);
        setCount(data.count);
        setTotalPages(data.total_pages);
        setCurrentPage(data.current_page);
        setStatus("succeeded");
      })
      .catch(() => setStatus("failed"));
  };

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadUsers(1, search);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-brand">Users ({count})</h1>

      <form onSubmit={handleSearchSubmit} className="max-w-sm">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {user.first_name || user.last_name
                    ? `${user.first_name} ${user.last_name}`.trim()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.date_joined).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3 text-gray-600">{user.order_count}</td>
                <td className="px-4 py-3 text-gray-600">
                  ₹{Number(user.total_spent).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.is_staff
                        ? "bg-brand-accent/10 text-brand-accent"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {user.is_staff ? "Staff" : "Customer"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => loadUsers(page)}
      />
    </div>
  );
}

export default UsersAdminPage;
