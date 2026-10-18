import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowDown, FiCheck, FiChevronDown, FiSliders, FiX } from "react-icons/fi";
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
  for (const category of categories) {
    if (category.slug === slug) return category;
    if (category.children?.length) {
      const found = findCategoryBySlug(category.children, slug);
      if (found) return found;
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

  const activeCategory = categorySlug ? findCategoryBySlug(categoryTree, categorySlug) : null;
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

  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : activeCategory?.name || "All Products";

  const breadcrumbItems = [
    { label: "Home", to: "/" },
    ...(activeCategory
      ? [{ label: activeCategory.name, to: `/category/${activeCategory.slug}` }]
      : [{ label: "Products" }]),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* Main Header Row: Title & Action Buttons (FILTERS & SORT BY) */}
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-black sm:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-0.5 text-xs uppercase tracking-wider text-gray-500">
            {listing.status === "succeeded" ? `${listing.count} products found` : "Loading products..."}
          </p>
        </div>

        {/* Action Controls: Filters button + Sort Dropdown */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* FILTERS Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeFilterCount > 0
                ? "border-black bg-black text-white"
                : "border-gray-300 bg-white text-black hover:border-black"
            }`}
          >
            <FiSliders size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* SORT BY Menu */}
          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:border-black transition"
            >
              <FiArrowDown size={14} />
              <span>Sort: {currentSortOption.label}</span>
              <FiChevronDown
                size={14}
                className={`transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-gray-100 bg-white p-1.5 shadow-xl">
                <div className="border-b border-gray-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
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
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition ${
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
        </div>
      </div>

      {/* Horizontal Category Navigation Bar (Matching Festive Edit / Snitch style) */}
      {categoryTree.length > 0 && (
        <div className="mb-6 border-b border-gray-200">
          <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none">
            <Link
              to="/products"
              className={`shrink-0 text-xs font-bold uppercase tracking-wider transition ${
                !categorySlug
                  ? "border-b-2 border-black pb-2 text-black"
                  : "pb-2 text-gray-500 hover:text-black"
              }`}
            >
              All
            </Link>
            {categoryTree.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className={`shrink-0 text-xs font-bold uppercase tracking-wider transition ${
                  activeCategorySlug === category.slug
                    ? "border-b-2 border-black pb-2 text-black"
                    : "pb-2 text-gray-500 hover:text-black"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
