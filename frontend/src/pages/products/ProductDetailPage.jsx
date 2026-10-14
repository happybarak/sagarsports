import { useEffect, useState } from "react";
import { FiHeart, FiShoppingBag, FiStar, FiZap } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import ProductCard from "../../components/product/ProductCard";
import ImageGallery from "../../components/product/ImageGallery";
import { RecentlyViewed, saveRecentlyViewed } from "../../components/product/RecentlyViewed";
import VariantSelector from "../../components/product/VariantSelector";
import ReviewForm from "../../components/reviews/ReviewForm";
import ReviewList from "../../components/reviews/ReviewList";
import { addToCart } from "../../redux/slices/cartSlice";
import {
  clearProductDetail,
  fetchFrequentlyBoughtTogether,
  fetchProductDetail,
  fetchRelatedProducts,
} from "../../redux/slices/productSlice";
import {
  clearReviews,
  createReview,
  deleteReview,
  fetchProductReviews,
  updateReview,
} from "../../redux/slices/reviewSlice";
import { addToWishlist, removeFromWishlist } from "../../redux/slices/wishlistSlice";

function ProductDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const { detail, related, frequentlyBoughtTogether } = useSelector((state) => state.products);
  const { product, status } = detail;
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { list: reviewList, mutationStatus } = useSelector((state) => state.reviews);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [actionNote, setActionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [showWriteReviewForm, setShowWriteReviewForm] = useState(false);

  useEffect(() => {
    dispatch(fetchProductDetail(slug));
    dispatch(fetchRelatedProducts(slug));
    dispatch(fetchFrequentlyBoughtTogether(slug));
    dispatch(fetchProductReviews({ slug, page: 1 }));
    setSelectedVariants({});
    setQuantity(1);
    setActionNote("");
    setEditingReviewId(null);
    setShowWriteReviewForm(false);
    window.scrollTo({ top: 0 });

    return () => {
      dispatch(clearProductDetail());
      dispatch(clearReviews());
    };
  }, [dispatch, slug]);

  // Record this product once it has loaded. Declared before the early
  // returns below on purpose (React requires hooks to run in the same order
  // on every render).
  useEffect(() => {
    if (status === "succeeded" && product) saveRecentlyViewed(product);
  }, [status, product]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-lg bg-gray-100" />
          <div className="flex flex-col gap-3">
            <div className="h-6 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-24 w-full animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed" || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-gray-500">Couldn't find this product.</p>
      </div>
    );
  }

  const handleSelectVariant = (variantType, option) => {
    setSelectedVariants((prev) => ({ ...prev, [variantType]: option.id }));
  };

  const variantTypesRequired = [...new Set(product.variants.map((v) => v.variant_type))];
  const hasSelectedAllVariants = variantTypesRequired.every(
    (type) => selectedVariants[type]
  );

  const selectedVariantObjects = Object.values(selectedVariants)
    .map((id) => product.variants.find((v) => v.id === id))
    .filter(Boolean);

  const variantPriceDelta = selectedVariantObjects.reduce(
    (sum, variant) => sum + Number(variant.price_delta),
    0
  );
  const displayPrice = Number(product.effective_price) + variantPriceDelta;

  const canAddToCart = product.in_stock && (variantTypesRequired.length === 0 || hasSelectedAllVariants);

  // A cart line item supports at most one variant (see CartItem model) — if
  // a product ever has more than one variant *type* (e.g. Color and Size
  // together), only the first selected one would actually be recorded.
  // Current seed data only uses one variant type per product, so this
  // isn't hit in practice, but it's a real constraint of the Phase 3 data
  // model worth knowing about if that assumption changes later.
  const cartVariant = selectedVariantObjects[0] || null;

  const handleAddToCart = async () => {
    if (!canAddToCart || isSubmitting) return;
    setIsSubmitting(true);
    await dispatch(addToCart({ product, variant: cartVariant, quantity }));
    setIsSubmitting(false);
    setActionNote("Added to cart.");
  };

  const handleBuyNow = async () => {
    if (!canAddToCart || isSubmitting) return;
    setIsSubmitting(true);
    await dispatch(addToCart({ product, variant: cartVariant, quantity }));
    setIsSubmitting(false);
    // Checkout itself doesn't exist until Phase 10 — the cart page is the
    // most useful real destination available right now.
    navigate("/cart");
  };

  const wishlistItem = wishlistItems.find((item) => item.product.id === product.id);
  const isWishlisted = Boolean(wishlistItem);

  const handleToggleWishlist = async () => {
    if (isTogglingWishlist) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setIsTogglingWishlist(true);
    if (isWishlisted) {
      await dispatch(removeFromWishlist(wishlistItem.id));
    } else {
      await dispatch(addToWishlist(product.id));
    }
    setIsTogglingWishlist(false);
  };

  // Own-review lookup only covers the currently fetched review page — if a
  // shopper's review got pushed to a later page by newer reviews, the UI
  // may offer "Write a review" again; submitting would still correctly
  // fail with the backend's duplicate-review error rather than creating
  // a second one.
  const myReview = reviewList.items.find((review) => review.is_own);

  const refreshAfterReviewChange = () => {
    // Rating/review_count on the product itself are recalculated
    // server-side via a signal — refetch to reflect the new average here.
    dispatch(fetchProductDetail(slug));
  };

  const handleCreateReview = async (payload) => {
    const result = await dispatch(createReview({ productId: product.id, ...payload }));
    if (createReview.fulfilled.match(result)) {
      setShowWriteReviewForm(false);
      refreshAfterReviewChange();
    }
  };

  const handleSubmitEditReview = async (reviewId, payload) => {
    const result = await dispatch(updateReview({ id: reviewId, payload }));
    if (updateReview.fulfilled.match(result)) {
      setEditingReviewId(null);
      refreshAfterReviewChange();
    }
  };

  const handleDeleteReview = async (reviewId) => {
    await dispatch(deleteReview(reviewId));
    refreshAfterReviewChange();
  };

  const handleReviewPageChange = (page) => {
    dispatch(fetchProductReviews({ slug, page }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Breadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: product.category.name, to: `/category/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-4">
          <span className="text-sm text-gray-400">{product.brand}</span>
          <h1 className="text-2xl font-bold text-brand md:text-3xl">{product.name}</h1>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiStar className="text-yellow-400" size={16} />
            <span>{Number(product.rating).toFixed(1)}</span>
            <span className="text-gray-300">·</span>
            <span>{product.review_count} reviews</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
            {product.discount_percent > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
                <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-xs font-semibold text-brand-accent">
                  -{product.discount_percent}%
                </span>
              </>
            )}
          </div>

          <p className="text-sm">
            {product.in_stock ? (
              product.low_stock ? (
                <span className="font-medium text-amber-600">
                  Only {product.stock} left in stock
                </span>
              ) : (
                <span className="font-medium text-green-600">In stock</span>
              )
            ) : (
              <span className="font-medium text-red-500">Out of stock</span>
            )}
          </p>

          <div className="grid grid-cols-1 gap-2 rounded-lg bg-brand-surface p-3 text-xs text-gray-600 sm:grid-cols-3">
            <span>🚚 Delivery across India</span>
            <span>🔄 7-day return &amp; exchange</span>
            <span>💵 Cash on Delivery (+₹100)</span>
          </div>

          <VariantSelector
            variants={product.variants}
            selected={selectedVariants}
            onSelect={handleSelectVariant}
          />

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Quantity</span>
            <div className="flex items-center rounded-md border border-gray-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 text-gray-500 hover:text-brand-accent"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-1.5 text-gray-500 hover:text-brand-accent"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {variantTypesRequired.length > 0 && !hasSelectedAllVariants && (
            <p className="text-xs text-amber-600">
              Select an option for each of: {variantTypesRequired.join(", ")}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart || isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiShoppingBag size={18} />
              {isSubmitting ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!canAddToCart || isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-brand py-3 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiZap size={18} />
              Buy Now
            </button>
            <button
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="flex items-center justify-center rounded-md border border-gray-200 px-4 text-gray-500 hover:text-brand-accent disabled:opacity-60"
            >
              <FiHeart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>

          {actionNote && <p className="text-xs text-gray-500">{actionNote}</p>}

          <div className="mt-4 border-t border-gray-100 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-800">Description</h2>
            <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-800">Specifications</h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-gray-500">Brand</dt>
              <dd className="text-gray-700">{product.brand}</dd>
              <dt className="text-gray-500">SKU</dt>
              <dd className="text-gray-700">{product.sku}</dd>
              <dt className="text-gray-500">Category</dt>
              <dd className="text-gray-700">{product.category.name}</dd>
            </dl>
          </div>
        </div>
      </div>

      <section className="mt-14 border-t border-gray-100 pt-10">
        <h2 className="mb-5 text-xl font-bold text-brand">
          Reviews {product.review_count > 0 && `(${product.review_count})`}
        </h2>

        <div className="mb-6">
          {!isAuthenticated && (
            <p className="text-sm text-gray-500">
              <button
                onClick={() => navigate("/login", { state: { from: location } })}
                className="font-medium text-brand-accent hover:underline"
              >
                Log in
              </button>{" "}
              to write a review.
            </p>
          )}

          {isAuthenticated && myReview && editingReviewId !== myReview.id && (
            <p className="text-sm text-gray-500">
              You've already reviewed this product.{" "}
              <button
                onClick={() => setEditingReviewId(myReview.id)}
                className="font-medium text-brand-accent hover:underline"
              >
                Edit your review
              </button>
            </p>
          )}

          {isAuthenticated && !myReview && !showWriteReviewForm && (
            <button
              onClick={() => setShowWriteReviewForm(true)}
              className="rounded-md border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
            >
              Write a Review
            </button>
          )}

          {isAuthenticated && !myReview && showWriteReviewForm && (
            <ReviewForm
              isSubmitting={mutationStatus === "loading"}
              onCancel={() => setShowWriteReviewForm(false)}
              onSubmit={handleCreateReview}
            />
          )}
        </div>

        {reviewList.status === "loading" && reviewList.items.length === 0 && (
          <p className="text-sm text-gray-500">Loading reviews...</p>
        )}

        {reviewList.status !== "loading" && (
          <ReviewList
            reviews={reviewList.items}
            currentPage={reviewList.currentPage}
            totalPages={reviewList.totalPages}
            onPageChange={handleReviewPageChange}
            editingId={editingReviewId}
            onStartEdit={setEditingReviewId}
            onSubmitEdit={handleSubmitEditReview}
            onCancelEdit={() => setEditingReviewId(null)}
            onDelete={handleDeleteReview}
            isMutating={mutationStatus === "loading"}
          />
        )}
      </section>

      {frequentlyBoughtTogether.items.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-1 text-xl font-bold text-brand">
            {frequentlyBoughtTogether.isFallback ? "You Might Also Like" : "Customers Also Bought"}
          </h2>
          {!frequentlyBoughtTogether.isFallback && (
            <p className="mb-5 text-sm text-gray-500">
              Based on what other customers purchased together
            </p>
          )}
          {frequentlyBoughtTogether.isFallback && <div className="mb-5" />}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {frequentlyBoughtTogether.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {related.items.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold text-brand">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {related.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed currentProductId={product.id} />
    </div>
  );
}

export default ProductDetailPage;
