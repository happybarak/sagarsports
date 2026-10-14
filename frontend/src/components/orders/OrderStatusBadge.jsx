const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  out_for_delivery: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function OrderStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-600";
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

export default OrderStatusBadge;
export { STATUS_LABELS };
