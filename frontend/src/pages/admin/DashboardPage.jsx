import { useEffect, useState } from "react";
import { FiAlertTriangle, FiBox, FiShoppingBag, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import StatCard from "../../components/admin/StatCard";
import adminService from "../../services/adminService";

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    adminService
      .fetchDashboardSummary()
      .then((data) => {
        setSummary(data);
        setStatus("succeeded");
      })
      .catch(() => setStatus("failed"));
  }, []);

  if (status === "loading") {
    return <p className="text-sm text-gray-500">Loading dashboard...</p>;
  }

  if (status === "failed" || !summary) {
    return <p className="text-sm text-gray-500">Couldn't load the dashboard.</p>;
  }

  const chartData = summary.top_products.map((p) => ({
    name: p.name.length > 14 ? `${p.name.slice(0, 14)}…` : p.name,
    revenue: Number(p.revenue),
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-brand">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`₹${Number(summary.total_revenue).toLocaleString("en-IN")}`}
          icon={FiShoppingBag}
        />
        <StatCard label="Total Orders" value={summary.total_orders} icon={FiShoppingBag} />
        <StatCard label="Total Customers" value={summary.total_customers} icon={FiUsers} />
        <StatCard label="Total Products" value={summary.total_products} icon={FiBox} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Top Products by Revenue</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500">No paid orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                <Bar dataKey="revenue" fill="#1E6FD9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-amber-500" size={16} />
            <h2 className="text-sm font-semibold text-gray-800">Low Stock Products</h2>
          </div>
          {summary.low_stock_products.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing is running low.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {summary.low_stock_products.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="font-medium text-amber-600">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">Recent Orders</h2>
        {summary.recent_orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {summary.recent_orders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-brand-surface"
              >
                <span className="text-gray-700">
                  #{order.order_number} · {order.user_email}
                </span>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-medium text-brand">
                    ₹{Number(order.total).toLocaleString("en-IN")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
