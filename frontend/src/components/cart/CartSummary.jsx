import { Link } from "react-router-dom";

function CartSummary({ subtotal, itemCount, onClearCart }) {
  return (
    <div className="rounded-lg border border-gray-100 p-5">
      <h2 className="mb-4 text-lg font-bold text-brand">Order Summary</h2>

      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"})</span>
        <span>₹{Number(subtotal).toLocaleString("en-IN")}</span>
      </div>
      <div className="mt-1 flex justify-between text-sm text-gray-400">
        <span>Shipping</span>
        <span>Calculated at checkout</span>
      </div>

      <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 text-base font-bold text-brand">
        <span>Total</span>
        <span>₹{Number(subtotal).toLocaleString("en-IN")}</span>
      </div>

      <Link
        to="/checkout"
        // Checkout itself lands in Phase 10 — this link is real, the
        // destination page isn't built yet.
        className="mt-5 block rounded-md bg-brand py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-light"
      >
        Proceed to Checkout
      </Link>

      <button
        onClick={onClearCart}
        className="mt-2 w-full rounded-md border border-gray-200 py-2 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500"
      >
        Clear cart
      </button>
    </div>
  );
}

export default CartSummary;
