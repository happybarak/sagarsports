import { useState } from "react";
import { Link } from "react-router-dom";

const RATING_OPTIONS = [4, 3, 2, 1];

function FilterSidebar({
  categories,
  activeCategorySlug,
  brands,
  filters,
  onChange,
}) {
  const [priceInputs, setPriceInputs] = useState({
    min_price: filters.min_price || "",
    max_price: filters.max_price || "",
  });

  const applyPriceFilter = (event) => {
    event.preventDefault();
    onChange({ min_price: priceInputs.min_price, max_price: priceInputs.max_price });
  };

  const toggleBrand = (brand) => {
    const current = filters.brand;
    onChange({ brand: current === brand ? "" : brand });
  };

  return (
    <aside className="w-full shrink-0 md:w-64">
      <div className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Category</h3>
        <ul className="flex flex-col gap-1 text-sm">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                to={`/category/${category.slug}`}
                className={`block rounded px-2 py-1 ${
                  activeCategorySlug === category.slug
                    ? "bg-brand-surface font-medium text-brand-accent"
                    : "text-gray-600 hover:bg-brand-surface"
                }`}
              >
                {category.name}
              </Link>
              {category.children?.length > 0 && (
                <ul className="ml-3 flex flex-col gap-1 border-l border-gray-100 pl-2">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        to={`/category/${child.slug}`}
                        className={`block rounded px-2 py-1 text-sm ${
                          activeCategorySlug === child.slug
                            ? "bg-brand-surface font-medium text-brand-accent"
                            : "text-gray-500 hover:bg-brand-surface"
                        }`}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Price</h3>
        <form onSubmit={applyPriceFilter} className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceInputs.min_price}
            onChange={(e) => setPriceInputs((prev) => ({ ...prev, min_price: e.target.value }))}
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-brand-accent focus:outline-none"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceInputs.max_price}
            onChange={(e) => setPriceInputs((prev) => ({ ...prev, max_price: e.target.value }))}
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-brand-accent focus:outline-none"
          />
        </form>
        <button
          onClick={applyPriceFilter}
          className="mt-2 w-full rounded-md border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
        >
          Apply
        </button>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Rating</h3>
        <div className="flex flex-col gap-1.5 text-sm">
          {RATING_OPTIONS.map((rating) => (
            <label key={rating} className="flex cursor-pointer items-center gap-2 text-gray-600">
              <input
                type="radio"
                name="min_rating"
                checked={String(filters.min_rating) === String(rating)}
                onChange={() => onChange({ min_rating: rating })}
              />
              {rating}★ & up
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-gray-600">
            <input
              type="radio"
              name="min_rating"
              checked={!filters.min_rating}
              onChange={() => onChange({ min_rating: "" })}
            />
            Any rating
          </label>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Availability</h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={filters.in_stock === "true"}
            onChange={(e) => onChange({ in_stock: e.target.checked ? "true" : "" })}
          />
          In stock only
        </label>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-800">Brand</h3>
          <div className="flex flex-col gap-1.5 text-sm">
            {brands.map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={filters.brand === brand}
                  onChange={() => toggleBrand(brand)}
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default FilterSidebar;
