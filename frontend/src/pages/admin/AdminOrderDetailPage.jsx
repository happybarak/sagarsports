import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import adminService from "../../services/adminService";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrder = () => {
    adminService
      .fetchOrder(id)
      .then((data) => {
        setOrder(data);
        setStatus("succeeded");
      })
      .catch(() => setStatus("failed"));
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (event) => {
    setIsUpdating(true);
    const updated = await adminService.updateOrderStatus(id, event.target.value);
    setOrder(updated);
    setIsUpdating(false);
  };

  if (status === "loading" || !order) {
    return <p className="text-sm text-gray-500">Loading order...</p>;
  }

  return (
    <div className="max-w-3xl">
      <Breadcrumb
        items={[
          { label: "Admin", to: "/admin" },
          { label: "Orders", to: "/admin/orders" },
          { label: `#${order.order_number}` },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">#{order.order_number}</h1>
          <p className="text-sm text-gray-500">{order.user_email}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <select
            value={order.status}
            onChange={handleStatusChange}
            disabled={isUpdating}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-100 p-5">
        <h2 className="mb-2 text-sm font-semibold text-gray-800">Shipping to</h2>
        <p className="text-sm text-gray-600">
          {order.shipping_full_name} · {order.shipping_phone}
        </p>
        <p className="text-sm text-gray-600">
          {order.shipping_address_line_1}
          {order.shipping_address_line_2 && `, ${order.shipping_address_line_2}`},{" "}
          {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-100 p-5">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.product_name_snapshot}
              {item.variant_label_snapshot && ` (${item.variant_label_snapshot})`} × {item.quantity}
            </span>
            <span className="font-medium text-gray-800">
              ₹{Number(item.line_total).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-gray-100 p-5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>₹{Number(order.shipping_cost).toLocaleString("en-IN")}</span>
        </div>
        {Number(order.tax) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{Number(order.tax).toLocaleString("en-IN")}</span>
          </div>
        )}
        {Number(order.cod_fee) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Cash on Delivery charge</span>
            <span>₹{Number(order.cod_fee).toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-brand">
          <span>Total</span>
          <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-gray-600">
          <span>Payment method</span>
          <span className="font-medium text-gray-800">
            {order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Payment status</span>
          <span className="font-medium capitalize text-gray-800">{order.payment_status}</span>
        </div>
      </div>
    </div>
  );
}

export default AdminOrderDetailPage;
