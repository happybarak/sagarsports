import { useState } from "react";
import { FiCheck, FiHeart, FiShoppingCart, FiStar } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { addToCart } from "../../redux/slices/cartSlice";
import { addToWishlist, removeFromWishlist } from "../../redux/slices/wishlistSlice";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const {
    id,
    name,
    slug,
    brand,
    price,
    effective_price: effectivePrice,
    discount_percent: discountPercent,
    rating,
    review_count: reviewCount,
    in_stock: inStock,
    low_stock: lowStock,
    stock,
    primary_image: primaryImage,
  } = product;

  const wishlistItem = wishlistItems.find((item) => item.product.id === id);
  const isWishlisted = Boolean(wishlistItem);

  const handleAddToCart = async (event) => {
    event.preventDefault();
    if (!inStock || isAdding) return;
    setIsAdding(true);
    // No variant selection at the grid level by design — a product with
    // required variants (color/size) still adds fine here (variant is
    // optional on a cart line); shoppers who want a specific variant go to
    // the detail page (Phase 8), which enforces a full selection there.
    await dispatch(addToCart({ product, variant: null, quantity: 1 }));
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleToggleWishlist = async (event) => {
    event.preventDefault();
    if (isTogglingWishlist) return;

    if (!isAuthenticated) {
      // Wishlist requires an account (unlike cart, it has no guest/
      // localStorage mode) — send the shopper to log in and back.
      navigate("/login", { state: { from: location } });
      return;
    }

    setIsTogglingWishlist(true);
    if (isWishlisted) {
      await dispatch(removeFromWishlist(wishlistItem.id));
    } else {
      await dispatch(addToWishlist(id));
    }
    setIsTogglingWishlist(false);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition hover:shadow-md">
      <Link to={`/products/${slug}`} className="relative block aspect-square bg-brand-surface">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}

        {discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-accent px-2 py-0.5 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}

        {!inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-xs font-medium text-white">
            Out of stock
          </span>
        )}

        {inStock && lowStock && (
          <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 py-1 text-center text-xs font-semibold text-white">
            Only {stock} left
          </span>
        )}
      </Link>

      <button
        onClick={handleToggleWishlist}
        disabled={isTogglingWishlist}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm transition hover:text-brand-accent disabled:opacity-60"
      >
        <FiHeart
          size={16}
          className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"}
        />
      </button>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs text-gray-400">{brand}</span>
        <Link to={`/products/${slug}`} className="line-clamp-2 text-sm font-medium text-gray-800 hover:text-brand-accent">
          {name}
        </Link>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <FiStar className="text-yellow-400" size={14} />
          <span>{Number(rating).toFixed(1)}</span>
          <span className="text-gray-300">·</span>
          <span>{reviewCount} reviews</span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-bold text-brand">
            ₹{Number(effectivePrice).toLocaleString("en-IN")}
          </span>
          {discountPercent > 0 && (
            <span className="text-sm text-gray-400 line-through">
              ₹{Number(price).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!inStock || isAdding}
          className="mt-2 flex items-center justify-center gap-2 rounded-md bg-brand py-2 text-sm font-semibold text-white transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {justAdded ? (
            <>
              <FiCheck size={16} />
              Added
            </>
          ) : (
            <>
              <FiShoppingCart size={16} />
              {isAdding ? "Adding..." : "Add to Cart"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
