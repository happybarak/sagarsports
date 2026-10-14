import { useEffect, useState } from "react";

import Pagination from "../../components/common/Pagination";
import adminService from "../../services/adminService";

function InventoryAdminPage() {
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [status, setStatus] = useState("loading");

  const loadInventory = (page = 1, lowStock = lowStockOnly) => {
    setStatus("loading");
    // Inventory reuses the admin products endpoint — same data, different
    // columns — rather than a separate backend endpoint for what's really
    // the same underlying resource.
    adminService
      .fetchProducts({ page, ordering: "stock" })
      .then((data) => {
        const results = lowStock ? data.results.filter((p) => p.low_stock) : data.results;
        setProducts(results);
        setCount(data.count);
        setTotalPages(data.total_pages);
        setCurrentPage(data.current_page);
        setStatus("succeeded");
      })
      .catch(() => setStatus("failed"));
  };

  useEffect(() => {
    loadInventory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-brand">Inventory ({count} products)</h1>

      <label className="flex w-fit items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={lowStockOnly}
          onChange={(e) => {
            setLowStockOnly(e.target.checked);
            loadInventory(1, e.target.checked);
          }}
        />
        Low stock only (below 5 units)
      </label>

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {status === "succeeded" && products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Nothing to show here.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                <td className="px-4 py-3 text-gray-600">{product.category_name}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{product.stock}</td>
                <td className="px-4 py-3">
                  {product.low_stock ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Low stock
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      In stock
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!lowStockOnly && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => loadInventory(page)}
        />
      )}
    </div>
  );
}

export default InventoryAdminPage;
