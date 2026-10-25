import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import CartLineItem from "../../components/cart/CartLineItem";
import CartSummary from "../../components/cart/CartSummary";
import {
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../../redux/slices/cartSlice";

function CartPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.cart);
  const [updatingKey, setUpdatingKey] = useState(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.line_total), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = async (item, quantity) => {
    setUpdatingKey(item.key);
    await dispatch(updateCartItemQuantity({ key: item.key, itemId: item.id, quantity }));
    setUpdatingKey(null);
  };

  const handleRemove = async (item) => {
    setUpdatingKey(item.key);
    await dispatch(removeCartItem({ key: item.key, itemId: item.id }));
    setUpdatingKey(null);
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Cart" }]} />
      <h1 className="mb-6 text-2xl font-bold text-brand">Your Cart</h1>

      {status === "loading" && items.length === 0 && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      )}

      {status !== "loading" && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-gray-500">Your cart is empty.</p>
          <Link
            to="/products"
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
          >
            Browse products
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex-1">
            {items.map((item) => (
              <CartLineItem
                key={item.key}
                item={item}
                isUpdating={updatingKey === item.key}
                onQuantityChange={(quantity) => handleQuantityChange(item, quantity)}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </div>

          <div className="w-full md:w-80">
            <CartSummary
              subtotal={subtotal}
              itemCount={itemCount}
              onClearCart={() => dispatch(clearCart())}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
