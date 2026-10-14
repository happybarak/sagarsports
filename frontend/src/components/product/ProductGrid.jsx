import ProductCard from "./ProductCard";

function ProductGrid({ title, subtitle, items, status }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand md:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>

      {status === "loading" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      )}

      {status === "failed" && (
        <p className="text-sm text-gray-500">Couldn't load this section right now.</p>
      )}

      {status === "succeeded" && items.length === 0 && (
        <p className="text-sm text-gray-500">No products here yet.</p>
      )}

      {status === "succeeded" && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductGrid;
