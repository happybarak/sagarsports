import { useEffect, useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import OrderTimeline from "../../components/orders/OrderTimeline";
import { cancelOrder, clearCurrentOrder, fetchOrderDetail } from "../../redux/slices/orderSlice";

const CANCELLABLE_STATUSES = ["pending", "confirmed"];

function OrderConfirmationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const claimToken = searchParams.get("claim_token");

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { order, status } = useSelector((state) => state.orders.current);

  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    dispatch(fetchOrderDetail({ id, claimToken }));
    return () => dispatch(clearCurrentOrder());
  }, [dispatch, id, claimToken]);

  const handleCancel = async () => {
    setIsCancelling(true);
    await dispatch(cancelOrder(id));
    setIsCancelling(false);
    setShowCancelConfirm(false);
  };

  const handleCreateAccount = () => {
    navigate("/register", { state: { claimOrderId: id, claimToken } });
  };

  if (status === "loading" || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">
        Loading order...
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">
        Couldn't find this order.
      </div>
    );
  }

  const isPaid = order.payment_status === "paid";
  const isCod = order.payment_method === "cod";
  const isGuestOrder = Boolean(claimToken) && !isAuthenticated;
  const canCancel = isAuthenticated && CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Breadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "My Orders", to: "/profile/orders" },
          { label: `#${order.order_number}` },
        ]}
      />

      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <FiCheckCircle className="text-green-500" size={48} />
        <h1 className="text-2xl font-bold text-brand">
          {isPaid ? "Thank you — your order is confirmed!" : "Order placed"}
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Order #{order.order_number}</span>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {isGuestOrder && (
        <div className="mb-6 flex flex-col items-center gap-2 rounded-lg border border-brand-accent/20 bg-brand-accent/5 p-5 text-center">
          <p className="text-sm text-gray-700">
            Create an account to save this order to your history and track it later.
          </p>
          <button
            onClick={handleCreateAccount}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-light"
          >
            Create Account
          </button>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-gray-100 p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">Order Tracking</h2>
        <OrderTimeline status={order.status} />
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

      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-gray-100 p-5">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-brand-surface">
              {item.product_image && (
                <img
                  src={item.product_image}
                  alt={item.product_name_snapshot}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 text-sm">
              {item.product_slug ? (
                <Link
                  to={`/products/${item.product_slug}`}
                  className="font-medium text-gray-800 hover:text-brand-accent"
                >
                  {item.product_name_snapshot}
                </Link>
              ) : (
                <span className="font-medium text-gray-800">{item.product_name_snapshot}</span>
              )}
              {item.variant_label_snapshot && (
                <p className="text-xs text-gray-500">{item.variant_label_snapshot}</p>
              )}
              <p className="text-xs text-gray-500">Qty {item.quantity}</p>
            </div>
            <div className="text-sm font-semibold text-brand">
              ₹{Number(item.line_total).toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-1 rounded-lg border border-gray-100 p-5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>
            {Number(order.shipping_cost) === 0
              ? "Free"
              : `₹${Number(order.shipping_cost).toLocaleString("en-IN")}`}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>₹{Number(order.tax).toLocaleString("en-IN")}</span>
        </div>
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
            {isCod ? "Cash on Delivery" : "Online Payment"}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Payment status</span>
          <span className={`font-medium ${isPaid ? "text-green-600" : "text-amber-600"}`}>
            {isPaid ? "Paid" : isCod ? "Pay on delivery" : order.payment_status === "failed" ? "Failed" : "Pending"}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          to="/products"
          className="rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
        >
          Continue Shopping
        </Link>

        {canCancel && (
          <>
            {showCancelConfirm ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600">Cancel this order?</span>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="font-medium text-red-500 hover:underline disabled:opacity-60"
                >
                  {isCancelling ? "Cancelling..." : "Yes, cancel it"}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="font-medium text-gray-400 hover:underline"
                >
                  Never mind
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-sm font-medium text-gray-400 hover:text-red-500 hover:underline"
              >
                Cancel this order
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
