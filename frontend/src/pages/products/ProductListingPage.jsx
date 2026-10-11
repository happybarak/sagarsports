import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";

import Breadcrumb from "../../components/common/Breadcrumb";
import Pagination from "../../components/common/Pagination";
import FilterSidebar from "../../components/product/FilterSidebar";
import ProductCard from "../../components/product/ProductCard";
import { fetchBrands, fetchProductList } from "../../redux/slices/productSlice";

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-rating", label: "Highest Rated" },
];

// Finds a category (root or nested child) by slug within the fetched tree,
// so the page can show its name in the title/breadcrumb without a second
// API call — the tree is already in Redux from the Header/Layout fetch.
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

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    const params = {
      page: filters.page,
      page_size: 12,
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
    next.delete("page"); // any filter change resets to page 1
    setSearchParams(next);
  };

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", page);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageTitle = searchQuery
    ? `Search results for "${searchQuery}"`
    : activeCategory?.name || "All Products";

  const breadcrumbItems = [
    { label: "Home", to: "/" },
    ...(activeCategory
      ? [{ label: activeCategory.name, to: `/category/${activeCategory.slug}` }]
      : [{ label: "Products" }]),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-brand">{pageTitle}</h1>
        <p className="text-sm text-gray-500">
          {listing.status === "succeeded" ? `${listing.count} products` : "\u00A0"}
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <FilterSidebar
          categories={categoryTree}
          activeCategorySlug={categorySlug}
          brands={brands.items}
          filters={filters}
          onChange={updateFilters}
        />

        <div className="flex-1">
          <div className="mb-4 flex justify-end">
            <select
              value={filters.ordering}
              onChange={(e) => updateFilters({ ordering: e.target.value })}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-accent focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {listing.status === "loading" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-square animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          )}

          {listing.status === "failed" && (
            <p className="text-sm text-gray-500">Couldn't load products right now.</p>
          )}

          {listing.status === "succeeded" && listing.items.length === 0 && (
            <p className="text-sm text-gray-500">
              No products match these filters. Try widening your search.
            </p>
          )}

          {listing.status === "succeeded" && listing.items.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
      </div>
    </div>
  );
}

export default ProductListingPage;
