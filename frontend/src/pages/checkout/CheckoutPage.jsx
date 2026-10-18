import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import AddressCard from "../../components/checkout/AddressCard";
import AddressForm from "../../components/checkout/AddressForm";
import { createAddress, fetchAddresses } from "../../redux/slices/addressSlice";
import { fetchCart } from "../../redux/slices/cartSlice";
import { confirmPayment, createOrder, initiatePayment } from "../../redux/slices/orderSlice";
import cartStorage from "../../services/cartStorage";

// Mirrors backend calculate_order_totals() in apps/orders/views.py — this
// is a preview only; the server always recalculates authoritatively when
// the order is actually created.
const FREE_SHIPPING_THRESHOLD = 5000;
const FLAT_SHIPPING_COST = 99;
const TAX_RATE = 0.18;
const COD_FEE = 100; // must match backend COD_FEE (apps/orders/views.py)

function calculateTotals(subtotal, paymentMethod = "online") {
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  const total = subtotal + shippingCost + tax + codFee;
  return { shippingCost, tax, codFee, total };
}

const STEPS = ["address", "summary", "payment"];

const emptyGuestForm = {
  email: "",
  full_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
};

const GUEST_REQUIRED_FIELDS = [
  "email",
  "full_name",
  "phone",
  "address_line_1",
  "city",
  "state",
  "postal_code",
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items: cartItems, status: cartStatus } = useSelector((state) => state.cart);
  const { items: addresses, status: addressStatus } = useSelector((state) => state.addresses);

  const [step, setStep] = useState("address");
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [guestForm, setGuestForm] = useState(emptyGuestForm);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchAddresses());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (cartStatus === "succeeded" && cartItems.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cartStatus, cartItems, navigate]);

  useEffect(() => {
    const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.line_total), 0);
  const { shippingCost, tax, codFee, total } = calculateTotals(subtotal, paymentMethod);

  const handleGuestFormChange = (event) => {
    const { name, value } = event.target;
    setGuestForm((prev) => ({ ...prev, [name]: value }));
  };

  const isGuestFormValid = GUEST_REQUIRED_FIELDS.every((field) => guestForm[field].trim());

  const handleSaveAddress = async (formData) => {
    setIsSavingAddress(true);
    const result = await dispatch(createAddress(formData));
    setIsSavingAddress(false);
    if (createAddress.fulfilled.match(result)) {
      setSelectedAddressId(result.payload.id);
      setIsAddingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setPlaceOrderError("");

    const orderPayload = isAuthenticated
      ? { addressId: selectedAddressId, paymentMethod }
      : {
          guestEmail: guestForm.email,
          items: cartItems.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant?.id,
            quantity: item.quantity,
          })),
          shippingFullName: guestForm.full_name,
          shippingPhone: guestForm.phone,
          shippingAddressLine1: guestForm.address_line_1,
          shippingAddressLine2: guestForm.address_line_2,
          shippingCity: guestForm.city,
          shippingState: guestForm.state,
          shippingPostalCode: guestForm.postal_code,
          shippingCountry: guestForm.country,
          paymentMethod,
        };

    const orderResult = await dispatch(createOrder(orderPayload));
    if (!createOrder.fulfilled.match(orderResult)) {
      setPlaceOrderError(orderResult.payload || "Couldn't place your order.");
      setIsPlacingOrder(false);
      return;
    }
    const order = orderResult.payload;
    const claimToken = order.claim_token; // present only for guest orders

    const initiateResult = await dispatch(initiatePayment({ orderId: order.id, claimToken }));
    if (!initiatePayment.fulfilled.match(initiateResult)) {
      setPlaceOrderError(initiateResult.payload || "Payment could not be initiated.");
      setIsPlacingOrder(false);
      return;
    }

    const initiateData = initiateResult.payload;

    const finalizeOrder = async () => {
      if (isAuthenticated) {
        await dispatch(fetchCart());
        navigate(`/orders/${order.id}`);
      } else {
        // Guest cart lived only in localStorage — clear it directly and
        // carry the claim_token in the URL so the confirmation page can
        // access this specific order without an account.
        cartStorage.clear();
        await dispatch(fetchCart());
        navigate(`/orders/${order.id}?claim_token=${claimToken}`);
      }
    };

    // If Cash on Delivery or local mock testing mode
    if (initiateData.method === "cod" || initiateData.is_mock) {
      const confirmResult = await dispatch(confirmPayment({ orderId: order.id, claimToken }));
      if (!confirmPayment.fulfilled.match(confirmResult)) {
        setPlaceOrderError(confirmResult.payload || "Order could not be confirmed.");
        setIsPlacingOrder(false);
        return;
      }
      await finalizeOrder();
      return;
    }

    // Live Razorpay payment modal
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      setPlaceOrderError("Payment gateway could not be loaded. Please check your internet connection.");
      setIsPlacingOrder(false);
      return;
    }

    const customerName =
      initiateData.customer_name ||
      (isAuthenticated ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() : guestForm.full_name);
    const customerEmail =
      initiateData.customer_email || (isAuthenticated ? user?.email : guestForm.email);
    const customerPhone =
      initiateData.customer_phone || (isAuthenticated ? "" : guestForm.phone);

    const options = {
      key: initiateData.razorpay_key_id,
      amount: initiateData.amount,
      currency: initiateData.currency || "INR",
      name: "Sagar Sports",
      description: `Order #${initiateData.order_number}`,
      image: "/sagar-sports-icon.png",
      order_id: initiateData.razorpay_order_id,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      theme: {
        color: "#111827",
      },
      handler: async function (response) {
        const confirmResult = await dispatch(
          confirmPayment({
            orderId: order.id,
            claimToken,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          })
        );
        if (!confirmPayment.fulfilled.match(confirmResult)) {
          setPlaceOrderError(confirmResult.payload || "Payment verification failed.");
          setIsPlacingOrder(false);
          return;
        }
        await finalizeOrder();
      },
      modal: {
        ondismiss: function () {
          setIsPlacingOrder(false);
          setPlaceOrderError("Payment was cancelled. You can retry placing your order anytime.");
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setPlaceOrderError(response.error?.description || "Payment failed. Please try again.");
        setIsPlacingOrder(false);
      });
      rzp.open();
    } catch (err) {
      setPlaceOrderError("Failed to open Razorpay payment window. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);
  const canContinueFromAddress = isAuthenticated ? Boolean(selectedAddressId) : isGuestFormValid;

  const guestInputClass =
    "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Cart", to: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mb-6 text-2xl font-bold text-brand">Checkout</h1>

      <div className="mb-8 flex items-center gap-2 text-sm">
        {["Address", "Order Summary", "Payment"].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                index <= stepIndex ? "bg-brand text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {index + 1}
            </span>
            <span className={index <= stepIndex ? "text-gray-800" : "text-gray-400"}>{label}</span>
            {index < 2 && <span className="mx-2 text-gray-300">—</span>}
          </div>
        ))}
      </div>

      {step === "address" && (
        <div className="flex flex-col gap-4">
          {!isAuthenticated && (
            <p className="rounded-md bg-brand-surface px-3 py-2 text-sm text-gray-600">
              Checking out as a guest.{" "}
              <a href="/login" className="font-medium text-brand-accent hover:underline">
                Log in
              </a>{" "}
              if you have an account.
            </p>
          )}

          {isAuthenticated ? (
            <>
              {addressStatus === "loading" && addresses.length === 0 && (
                <p className="text-sm text-gray-500">Loading addresses...</p>
              )}

              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isSelected={selectedAddressId === address.id}
                  onSelect={() => setSelectedAddressId(address.id)}
                />
              ))}

              {isAddingAddress ? (
                <AddressForm
                  onSave={handleSaveAddress}
                  onCancel={() => setIsAddingAddress(false)}
                  isSaving={isSavingAddress}
                />
              ) : (
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="rounded-md border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-brand-accent hover:text-brand-accent"
                >
                  + Add a new address
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
              <input
                name="email"
                type="email"
                placeholder="Email (for order updates)"
                required
                value={guestForm.email}
                onChange={handleGuestFormChange}
                className={guestInputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="full_name"
                  placeholder="Full name"
                  required
                  value={guestForm.full_name}
                  onChange={handleGuestFormChange}
                  className={guestInputClass}
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  required
                  value={guestForm.phone}
                  onChange={handleGuestFormChange}
                  className={guestInputClass}
                />
              </div>
              <input
                name="address_line_1"
                placeholder="Address line 1"
                required
                value={guestForm.address_line_1}
                onChange={handleGuestFormChange}
                className={guestInputClass}
              />
              <input
                name="address_line_2"
                placeholder="Address line 2 (optional)"
                value={guestForm.address_line_2}
                onChange={handleGuestFormChange}
                className={guestInputClass}
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  name="city"
                  placeholder="City"
                  required
                  value={guestForm.city}
                  onChange={handleGuestFormChange}
                  className={guestInputClass}
                />
                <input
                  name="state"
                  placeholder="State"
                  required
                  value={guestForm.state}
                  onChange={handleGuestFormChange}
                  className={guestInputClass}
                />
                <input
                  name="postal_code"
                  placeholder="Postal code"
                  required
                  value={guestForm.postal_code}
                  onChange={handleGuestFormChange}
                  className={guestInputClass}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => setStep("summary")}
            disabled={!canContinueFromAddress}
            className="mt-4 self-end rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to Order Summary
          </button>
        </div>
      )}

      {step === "summary" && (
        <div className="flex flex-col gap-4">
          {cartItems.map((item) => (
            <div key={item.key} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.product.name}
                {item.variant && ` (${item.variant.value})`} × {item.quantity}
              </span>
              <span className="font-medium text-gray-800">
                ₹{Number(item.line_total).toLocaleString("en-IN")}
              </span>
            </div>
          ))}

          <div className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "Free" : `₹${shippingCost}`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (18% GST)</span>
              <span>₹{tax.toLocaleString("en-IN")}</span>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Cash on Delivery charge</span>
                <span>₹{codFee.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-brand">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setStep("address")}
              className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep("payment")}
              className="rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {step === "payment" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-gray-200 p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Payment Method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-lg border p-4 ${
                  paymentMethod === "online" ? "border-brand bg-brand-surface" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  disabled={isPlacingOrder}
                  className="mr-2"
                />
                <span className="font-medium text-gray-800">Online Payment (UPI, Cards, Netbanking)</span>
                <p className="mt-1 text-xs text-gray-500">
                  Instant secure payment via Razorpay. Supports UPI (Google Pay, PhonePe, Paytm),
                  Credit/Debit Cards, and Netbanking.
                </p>
              </label>
              <label
                className={`cursor-pointer rounded-lg border p-4 ${
                  paymentMethod === "cod" ? "border-brand bg-brand-surface" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  disabled={isPlacingOrder}
                  className="mr-2"
                />
                <span className="font-medium text-gray-800">Cash on Delivery</span>
                <p className="mt-1 text-xs text-gray-500">
                  Pay in cash when your order arrives. Additional COD charge: ₹{COD_FEE}.
                </p>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-brand-surface p-4 text-sm text-brand">
            <div className="flex justify-between">
              <span>Subtotal + shipping + tax</span>
              <span>₹{(total - codFee).toLocaleString("en-IN")}</span>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between">
                <span>Cash on Delivery charge</span>
                <span>₹{codFee.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-brand/10 pt-2 font-semibold">
              <span>{paymentMethod === "cod" ? "Amount to pay on delivery" : "Amount to pay"}</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {placeOrderError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {placeOrderError}
            </p>
          )}

          <div className="mt-2 flex justify-between">
            <button
              onClick={() => setStep("summary")}
              disabled={isPlacingOrder}
              className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
            >
              {isPlacingOrder ? "Placing order..." : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
