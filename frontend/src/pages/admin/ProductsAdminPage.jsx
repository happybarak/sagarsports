import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Pagination from "../../components/common/Pagination";
import adminService from "../../services/adminService";

function ProductsAdminPage() {
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("loading");

  const loadProducts = (page = 1, searchTerm = search) => {
    setStatus("loading");
    adminService
      .fetchProducts({ page, search: searchTerm || undefined })
      .then((data) => {
        setProducts(data.results);
        setCount(data.count);
        setTotalPages(data.total_pages);
        setCurrentPage(data.current_page);
        setStatus("succeeded");
      })
      .catch(() => setStatus("failed"));
  };

  useEffect(() => {
    loadProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadProducts(1, search);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    await adminService.deleteProduct(product.id);
    loadProducts(currentPage);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Products ({count})</h1>
        <Link
          to="/admin/products/create"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light"
        >
          + Add Product
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="max-w-sm">
        <input
          type="text"
          placeholder="Search by name, SKU, or brand"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {status === "succeeded" && products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-50">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-brand-surface">
                    {product.primary_image && (
                      <img
                        src={product.primary_image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="font-medium text-gray-800">{product.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{product.category_name}</td>
                <td className="px-4 py-3 text-gray-600">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <span className={product.low_stock ? "font-medium text-amber-600" : "text-gray-600"}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      className="font-medium text-brand-accent hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      className="font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => loadProducts(page)}
      />
    </div>
  );
}

export default ProductsAdminPage;
