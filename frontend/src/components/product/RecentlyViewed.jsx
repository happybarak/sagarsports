import { useMemo } from "react";
import { Link } from "react-router-dom";

import ProductCard from "./ProductCard";

const RECENT_KEY = "sagar_recently_viewed";
const MAX_ITEMS = 6;

function readRecentlyViewed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // localStorage unavailable or corrupt — behave as "nothing viewed yet"
  }
}

// Records a product at the front of the list. Re-viewing a product moves it
// to the front instead of adding a duplicate (de-duped by id).
export function saveRecentlyViewed(product) {
  try {
    const snapshot = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      effective_price: product.effective_price,
      discount_percent: product.discount_percent,
      rating: product.rating,
      review_count: product.review_count,
      stock: product.stock,
      in_stock: product.in_stock,
      low_stock: product.low_stock,
      primary_image:
        product.primary_image ||
        (product.images?.find((img) => img.is_primary) || product.images?.[0])?.image ||
        null,
    };
    const next = [snapshot, ...readRecentlyViewed().filter((p) => p.id !== product.id)].slice(
      0,
      MAX_ITEMS
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage full/blocked — recently viewed is a nicety, never break the page */
  }
}

// `currentProductId` is left out of the row: showing the product you're
// already looking at as "recently viewed" is just noise.
export function RecentlyViewed({ currentProductId }) {
  const items = useMemo(
    () => readRecentlyViewed().filter((p) => p.id !== currentProductId),
    [currentProductId]
  );

  if (items.length === 0) return null;

  return (
    <section className="mt-14 border-t border-gray-100 pt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand">Recently Viewed</h2>
        <Link to="/products" className="text-sm font-medium text-brand-accent hover:underline">
          Shop all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
