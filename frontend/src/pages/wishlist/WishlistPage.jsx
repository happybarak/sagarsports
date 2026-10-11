import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import ProductCard from "../../components/product/ProductCard";
import { fetchWishlist } from "../../redux/slices/wishlistSlice";

function WishlistPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Wishlist" }]} />
      <h1 className="mb-6 text-2xl font-bold text-brand">My Wishlist</h1>

      {status === "loading" && items.length === 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {status === "succeeded" && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-gray-500">Your wishlist is empty.</p>
          <Link
            to="/products"
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
          >
            Browse products
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
