import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useSearchParams } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import Pagination from "../../components/common/Pagination";
import FilterDrawer from "../../components/product/FilterDrawer";
import ProductCard from "../../components/product/ProductCard";
import { fetchBrands, fetchProductList } from "../../redux/slices/productSlice";

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-rating", label: "Highest Rated" },
];

function findCategoryBySlug(categories, slug) {
  if (!slug) return null;
  const target = slug.toLowerCase();
  for (const category of categories) {
    if (category.slug?.toLowerCase() === target || category.name?.toLowerCase() === target) {
      return category;
    }
    if (category.children?.length) {
      const found = findCategoryBySlug(category.children, slug);
      if (found) return found;
    }
  }
  return null;
}

function findParentCategory(categories, childSlug) {
  if (!childSlug) return null;
  const target = childSlug.toLowerCase();
  for (const cat of categories) {
    if (
      cat.children?.some(
        (child) => child.slug?.toLowerCase() === target || child.name?.toLowerCase() === target
      )
    ) {
      return cat;
    }
  }
  return null;
}

function ProductListingPage() {
  const dispatch = useDispatch();
  const { slug: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { items: categoryTree } = useSelector((state) => state.categories);
  const { listing, brands } = useSelector((state) => state.products);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef(null);

  const activeCategorySlug = categorySlug || "";
  const activeCategory = categorySlug ? findCategoryBySlug(categoryTree, categorySlug) : null;
  const parentCategory = categorySlug ? findParentCategory(categoryTree, categorySlug) : null;
  const searchQuery = searchParams.get("search") || "";

  const filters = useMemo(
    () => ({
      min_price: searchParams.get("min_price") || "",
      max_price: searchParams.get("max_price") || "",
      min_rating: searchParams.get("min_rating") || "",
      in_stock: searchParams.get("in_stock") || "",
      brand: searchParams.get("brand") || "",
      ordering: searchParams.get("ordering") || "-created_at",
      page: Number(searchParams.get("page")) || 1,
    }),
    [searchParams]
  );

  // Close sort menu on click outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    const params = {
      page: filters.page,
      page_size: 16,
      ordering: filters.ordering,
    };
    if (categorySlug) params.category = categorySlug;
    if (searchQuery) params.search = searchQuery;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.min_rating) params.min_rating = filters.min_rating;
    if (filters.in_stock) params.in_stock = filters.in_stock;
    if (filters.brand) params.brand = filters.brand;

    dispatch(fetchProductList(params));
  }, [dispatch, categorySlug, searchQuery, filters]);

  const updateFilters = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    next.delete("page");
    setSearchParams(next);
  };

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", page);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilterCount = [
    filters.min_price || filters.max_price ? 1 : 0,
    filters.min_rating ? 1 : 0,
    filters.in_stock ? 1 : 0,
    filters.brand ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const currentSortOption =
    SORT_OPTIONS.find((opt) => opt.value === filters.ordering) || SORT_OPTIONS[0];

  const formatCategoryName = (slug) =>
    slug ? slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : activeCategory?.name || (categorySlug ? formatCategoryName(categorySlug) : "All Products");

  const breadcrumbItems = [
    { label: "Home", to: "/" },
    ...(parentCategory
      ? [
          { label: parentCategory.name, to: `/category/${parentCategory.slug}` },
          { label: activeCategory?.name || formatCategoryName(categorySlug) },
        ]
      : activeCategory
      ? [{ label: activeCategory.name, to: `/category/${activeCategory.slug}` }]
      : categorySlug
      ? [{ label: formatCategoryName(categorySlug) }]
      : [{ label: "Products" }]),
  ];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-12 py-4">
      <Breadcrumb items={breadcrumbItems} />

      {/* Sleek Minimal Header: Only Category on Left, Compact SORT | FILTER on Right */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
        {/* Top Left Corner: ONLY SELECTED CATEGORY NAME */}
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-black">
            {pageTitle}
          </h1>
          {listing.status === "succeeded" && (
            <span className="text-xs font-normal text-gray-400">({listing.count})</span>
          )}
        </div>

        {/* Top Right Corner: Small SORT and FILTER buttons matching user image */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-normal uppercase tracking-wider text-black">
          {/* SORT Menu */}
          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 py-1 text-black hover:text-gray-600 transition"
              aria-label="Sort products"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 4v16m0 0l-4-4m4 4l4-4" />
                <path d="M17 20V4m0 0l-4 4m4-4l4 4" />
              </svg>
              <span>SORT</span>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 z-30 mt-2 w-52 rounded-md border border-gray-100 bg-white p-1.5 shadow-xl">
                <div className="border-b border-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Sort By
                </div>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateFilters({ ordering: option.value });
                      setIsSortOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs transition ${
                      filters.ordering === option.value
                        ? "bg-gray-100 font-bold text-black"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {filters.ordering === option.value && <FiCheck size={14} className="text-black" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thin Vertical Separator Line */}
          <span className="h-4 w-px bg-gray-300" aria-hidden="true" />

          {/* FILTER Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex items-center gap-1.5 py-1 text-black hover:text-gray-600 transition"
            aria-label="Open filter drawer"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="8" cy="6" r="2" fill="white" stroke="currentColor" />
              <circle cx="16" cy="12" r="2" fill="white" stroke="currentColor" />
              <circle cx="10" cy="18" r="2" fill="white" stroke="currentColor" />
            </svg>
            <span>FILTER</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Chips / Pills (if any filter active) */}
      {activeFilterCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-gray-400">Active:</span>

          {(filters.min_price || filters.max_price) && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs text-gray-800">
              <span>
                ₹{filters.min_price || "0"} – {filters.max_price ? `₹${filters.max_price}` : "Above"}
              </span>
              <button
                type="button"
                onClick={() => updateFilters({ min_price: "", max_price: "" })}
                className="hover:text-black"
                aria-label="Remove price filter"
              >
                <FiX size={13} />
              </button>
            </span>
          )}

          {filters.in_stock && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs text-gray-800">
              <span>In Stock Only</span>
              <button
                type="button"
                onClick={() => updateFilters({ in_stock: "" })}
                className="hover:text-black"
                aria-label="Remove stock filter"
              >
                <FiX size={13} />
              </button>
            </span>
          )}

          {filters.min_rating && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs text-gray-800">
              <span>{filters.min_rating}★ &amp; up</span>
              <button
                type="button"
                onClick={() => updateFilters({ min_rating: "" })}
                className="hover:text-black"
                aria-label="Remove rating filter"
              >
                <FiX size={13} />
              </button>
            </span>
          )}

          {filters.brand && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs text-gray-800">
              <span>{filters.brand}</span>
              <button
                type="button"
                onClick={() => updateFilters({ brand: "" })}
                className="hover:text-black"
                aria-label="Remove brand filter"
              >
                <FiX size={13} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              updateFilters({
                min_price: "",
                max_price: "",
                min_rating: "",
                in_stock: "",
                brand: "",
              })
            }
            className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Full-width Product Grid */}
      <div>
        {listing.status === "loading" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )}

        {listing.status === "failed" && (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-gray-600">Couldn't load products right now.</p>
            <button
              onClick={() => dispatch(fetchProductList({ page: 1 }))}
              className="mt-3 rounded-md bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {listing.status === "succeeded" && listing.items.length === 0 && (
          <div className="py-20 text-center">
            <h3 className="text-base font-bold uppercase tracking-wider text-black">No Products Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              No products match these filters. Try widening your price or resetting filters.
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  updateFilters({
                    min_price: "",
                    max_price: "",
                    min_rating: "",
                    in_stock: "",
                    brand: "",
                  })
                }
                className="mt-4 rounded-md border border-black bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {listing.status === "succeeded" && listing.items.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {listing.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              currentPage={listing.currentPage}
              totalPages={listing.totalPages}
              onPageChange={goToPage}
            />
          </>
        )}
      </div>

      {/* Slide-over Filter Drawer (Opens when FILTERS is clicked) */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categoryTree}
        activeCategorySlug={categorySlug}
        brands={brands.items}
        filters={filters}
        onChange={updateFilters}
        productCount={listing.count || 0}
      />
    </div>
  );
}

export default ProductListingPage;
