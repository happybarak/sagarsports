import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Pagination from "../../components/common/Pagination";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import adminService from "../../services/adminService";

const STATUS_OPTIONS = [
  "",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function OrdersAdminPage() {
  const [orders, setOrders] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [status, setStatus] = useState("loading");

  const loadOrders = (page = 1, filter = statusFilter) => {
    setStatus("loading");
    adminService
      .fetchOrders({ page, status: filter || undefined })
      .then((data) => {
        setOrders(data.results);
        setCount(data.count);
        setTotalPages(data.total_pages);
        setCurrentPage(data.current_page);
        setStatus("succeeded");
      })
      .catch(() => setStatus("failed"));
  };

  useEffect(() => {
    loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setStatusFilter(value);
    loadOrders(1, value);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-brand">Orders ({count})</h1>

      <select
        value={statusFilter}
        onChange={handleFilterChange}
        className="max-w-xs rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === "" ? "All statuses" : option.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {status === "succeeded" && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50">
                <td className="px-4 py-3">
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="font-medium text-brand-accent hover:underline"
                  >
                    #{order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{order.user_email}</td>
                <td className="px-4 py-3 text-gray-600">{order.item_count}</td>
                <td className="px-4 py-3 text-gray-600">
                  {order.payment_method === "cod" ? "COD" : "Online"}
                  <span className="ml-1 text-xs capitalize text-gray-400">
                    ({order.payment_status})
                  </span>
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 font-medium text-brand">
                  ₹{Number(order.total).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(order.created_at).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => loadOrders(page)}
      />
    </div>
  );
}

export default OrdersAdminPage;
