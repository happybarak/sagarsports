import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { STATUS_LABELS } from "../../components/orders/OrderStatusBadge";
import adminService from "../../services/adminService";

const DAY_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    adminService
      .fetchAnalyticsDetail(days)
      .then((result) => {
        setData(result);
        setStatus("succeeded");
      })
      .catch(() => setStatus("failed"));
  }, [days]);

  if (status === "loading" && !data) {
    return <p className="text-sm text-gray-500">Loading analytics...</p>;
  }

  if (status === "failed" || !data) {
    return <p className="text-sm text-gray-500">Couldn't load analytics.</p>;
  }

  const revenueChartData = data.revenue_trend.map((row) => ({
    date: new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    revenue: Number(row.revenue),
    orders: row.order_count,
  }));

  const statusChartData = data.order_status_breakdown.map((row) => ({
    status: STATUS_LABELS[row.status] || row.status,
    count: row.count,
  }));

  const categoryChartData = data.category_breakdown.map((row) => ({
    category: row.category || "Uncategorized",
    revenue: Number(row.revenue),
  }));

  const totalRevenueInRange = revenueChartData.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Analytics</h1>
        <div className="flex gap-2">
          {DAY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDays(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                days === option.value
                  ? "bg-brand text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-brand-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Revenue Trend</h2>
          <span className="text-sm text-gray-500">
            ₹{totalRevenueInRange.toLocaleString("en-IN")} total in range
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value, name) =>
                name === "revenue" ? `₹${Number(value).toLocaleString("en-IN")}` : value
              }
            />
            <Line type="monotone" dataKey="revenue" stroke="#1E6FD9" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Orders by Status</h2>
          {statusChartData.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0B2545" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Revenue by Category</h2>
          {categoryChartData.length === 0 ? (
            <p className="text-sm text-gray-500">No paid orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                <Bar dataKey="revenue" fill="#1E6FD9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
