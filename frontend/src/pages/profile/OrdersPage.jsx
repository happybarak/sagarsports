import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import Pagination from "../../components/common/Pagination";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import { fetchOrderList } from "../../redux/slices/orderSlice";

function OrdersPage() {
  const dispatch = useDispatch();
  const { items, count, totalPages, currentPage, status } = useSelector(
    (state) => state.orders.list
  );

  useEffect(() => {
    dispatch(fetchOrderList(1));
  }, [dispatch]);

  const goToPage = (page) => {
    dispatch(fetchOrderList(page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "My Orders" }]} />
      <h1 className="mb-6 text-2xl font-bold text-brand">My Orders</h1>

      {status === "loading" && items.length === 0 && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {status === "failed" && (
        <p className="text-sm text-gray-500">Couldn't load your orders right now.</p>
      )}

      {status === "succeeded" && count === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-gray-500">You haven't placed any orders yet.</p>
          <Link
            to="/products"
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
          >
            Browse products
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {items.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4 transition hover:border-gray-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      #{order.order_number}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-brand">
                    ₹{Number(order.total).toLocaleString("en-IN")}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </>
      )}
    </div>
  );
}

export default OrdersPage;
