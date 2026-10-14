import { FiCheck, FiPackage, FiTruck, FiXCircle } from "react-icons/fi";

// Mirrors Phase 16's Order.Status values, in the order an order moves through them.
const STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

const STEP_ICONS = { shipped: FiTruck, out_for_delivery: FiTruck, delivered: FiPackage };

function OrderTimeline({ status }) {
  // A cancelled order never progressed along the happy path, so showing
  // "Order Placed" as the current step would be misleading.
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-red-500">
        <FiXCircle size={18} />
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = Math.max(
    STEPS.findIndex((step) => step.key === status),
    0
  );

  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-[620px] items-start py-2">
        {STEPS.map((step, index) => {
          const isDone = index <= currentIndex;
          const Icon = STEP_ICONS[step.key] || FiCheck;
          return (
            <li key={step.key} className="relative flex-1 text-center">
              <div
                className={`relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                  isDone
                    ? "border-brand bg-brand text-white"
                    : "border-gray-200 bg-white text-gray-300"
                }`}
              >
                <Icon size={16} />
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-[17px] h-0.5 ${
                    index < currentIndex ? "bg-brand" : "bg-gray-200"
                  }`}
                />
              )}
              <p
                className={`relative mt-2 text-xs font-medium ${
                  isDone ? "text-brand" : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default OrderTimeline;
