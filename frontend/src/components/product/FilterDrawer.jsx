import { useEffect, useState } from "react";
import { FiCheck, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";

const RATING_OPTIONS = [4, 3, 2, 1];

function FilterDrawer({
  isOpen,
  onClose,
  categories = [],
  activeCategorySlug,
  brands = [],
  filters,
  onChange,
  productCount = 0,
}) {
  // Local state for draft filter changes before clicking "APPLY"
  const [draftFilters, setDraftFilters] = useState(filters);
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    availability: true,
    rating: false,
    brand: false,
  });

  // Sync draft state with incoming active filters whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setDraftFilters(filters);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, filters]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApply = () => {
    onChange({
      min_price: draftFilters.min_price || "",
      max_price: draftFilters.max_price || "",
      min_rating: draftFilters.min_rating || "",
      in_stock: draftFilters.in_stock || "",
      brand: draftFilters.brand || "",
    });
    onClose();
  };

  const handleClear = () => {
    setDraftFilters({
      min_price: "",
      max_price: "",
      min_rating: "",
      in_stock: "",
      brand: "",
    });
    onChange({
      min_price: "",
      max_price: "",
      min_rating: "",
      in_stock: "",
      brand: "",
    });
    onClose();
  };

  const activeFiltersCount = [
    draftFilters.min_price || draftFilters.max_price ? 1 : 0,
    draftFilters.min_rating ? 1 : 0,
    draftFilters.in_stock ? 1 : 0,
    draftFilters.brand ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div
      className={`fixed inset-0 z-50 transition-visibility duration-300 ${
        isOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
      }`}
      aria-modal="true"
      role="dialog"
    >
      {/* Dark backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Slide-over drawer */}
      <div
        className={`fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-wider text-black">FILTER</h2>
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-black transition"
            aria-label="Close filters"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable Filter Sections */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-gray-100">
          {/* Category Section */}
          {categories.length > 0 && (
            <div className="py-4">
              <button
                onClick={() => toggleSection("category")}
                className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-black"
              >
                <span>Category</span>
                {openSections.category ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </button>

              {openSections.category && (
                <div className="mt-3 flex flex-col gap-1.5 pl-1">
                  <Link
                    to="/products"
                    onClick={onClose}
                    className={`block py-1 text-sm ${
                      !activeCategorySlug ? "font-semibold text-black" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    All Categories
                  </Link>
                  {categories.map((category) => (
                    <div key={category.id}>
                      <Link
                        to={`/category/${category.slug}`}
                        onClick={onClose}
                        className={`block py-1 text-sm ${
                          activeCategorySlug === category.slug
                            ? "font-semibold text-black"
                            : "text-gray-600 hover:text-black"
                        }`}
                      >
                        {category.name}
                      </Link>
                      {category.children?.length > 0 && (
                        <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-gray-200 pl-2">
                          {category.children.map((child) => (
                            <Link
                              key={child.id}
                              to={`/category/${child.slug}`}
                              onClick={onClose}
                              className={`block py-0.5 text-xs ${
                                activeCategorySlug === child.slug
                                  ? "font-semibold text-black"
                                  : "text-gray-500 hover:text-black"
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Price Range Section */}
          <div className="py-4">
            <button
              onClick={() => toggleSection("price")}
              className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-black"
            >
              <span>Price</span>
              {openSections.price ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>

            {openSections.price && (
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={draftFilters.min_price || ""}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({ ...prev, min_price: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                  <span className="text-gray-400">–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={draftFilters.max_price || ""}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({ ...prev, max_price: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Price Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "Under ₹500", min: "", max: "500" },
                    { label: "₹500 - ₹1,500", min: "500", max: "1500" },
                    { label: "₹1,500 - ₹3,000", min: "1500", max: "3000" },
                    { label: "Above ₹3,000", min: "3000", max: "" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          min_price: preset.min,
                          max_price: preset.max,
                        }))
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        draftFilters.min_price === preset.min &&
                        draftFilters.max_price === preset.max
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Availability Section */}
          <div className="py-4">
            <button
              onClick={() => toggleSection("availability")}
              className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-black"
            >
              <span>Availability</span>
              {openSections.availability ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>

            {openSections.availability && (
              <div className="mt-3">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={draftFilters.in_stock === "true"}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        in_stock: e.target.checked ? "true" : "",
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-black accent-black focus:ring-0"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            )}
          </div>

          {/* Rating Section */}
          <div className="py-4">
            <button
              onClick={() => toggleSection("rating")}
              className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-black"
            >
              <span>Customer Rating</span>
              {openSections.rating ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>

            {openSections.rating && (
              <div className="mt-3 flex flex-col gap-2">
                {RATING_OPTIONS.map((rating) => (
                  <label key={rating} className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="drawer_rating"
                      checked={String(draftFilters.min_rating) === String(rating)}
                      onChange={() => setDraftFilters((prev) => ({ ...prev, min_rating: String(rating) }))}
                      className="h-4 w-4 accent-black"
                    />
                    <span>{rating}★ &amp; up</span>
                  </label>
                ))}
                <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="drawer_rating"
                    checked={!draftFilters.min_rating}
                    onChange={() => setDraftFilters((prev) => ({ ...prev, min_rating: "" }))}
                    className="h-4 w-4 accent-black"
                  />
                  <span>Any Rating</span>
                </label>
              </div>
            )}
          </div>

          {/* Brand Section (if brands available) */}
          {brands.length > 0 && (
            <div className="py-4">
              <button
                onClick={() => toggleSection("brand")}
                className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-black"
              >
                <span>Brand</span>
                {openSections.brand ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </button>

              {openSections.brand && (
                <div className="mt-3 flex flex-col gap-2">
                  {brands.map((brand) => (
                    <label key={brand} className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={draftFilters.brand === brand}
                        onChange={() =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            brand: prev.brand === brand ? "" : brand,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-black accent-black focus:ring-0"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Footer (CLEAR + APPLY Buttons) */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-md border border-gray-300 bg-white py-3 text-center text-xs font-bold uppercase tracking-wider text-black transition hover:bg-gray-50 active:scale-[0.99]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 rounded-md bg-black py-3 text-center text-xs font-bold uppercase tracking-wider text-white transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              Apply {productCount > 0 ? `(${productCount})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterDrawer;
