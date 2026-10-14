import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import adminService from "../../services/adminService";

const emptyForm = {
  name: "",
  description: "",
  short_description: "",
  brand: "",
  category: "",
  price: "",
  discount_price: "",
  stock: "0",
  sku: "",
  featured: false,
  best_seller: false,
  new_arrival: false,
  is_active: true,
};

function ProductFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    adminService.fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    adminService.fetchProduct(id).then((product) => {
      setForm({
        name: product.name,
        description: product.description,
        short_description: product.short_description,
        brand: product.brand,
        category: product.category,
        price: product.price,
        discount_price: product.discount_price || "",
        stock: String(product.stock),
        sku: product.sku,
        featured: product.featured,
        best_seller: product.best_seller,
        new_arrival: product.new_arrival,
        is_active: product.is_active,
      });
      setExistingImage(product.primary_image);
      setIsLoading(false);
    });
  }, [id, isEditMode]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleGenerateDescription = async () => {
    if (!form.name.trim()) {
      setError("Enter a product name before generating a description.");
      return;
    }
    setError("");
    setIsGeneratingDescription(true);
    try {
      const description = await adminService.generateDescription({
        name: form.name,
        brand: form.brand,
        category: form.category,
      });
      setForm((prev) => ({ ...prev, description }));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't generate a description.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "discount_price" && value === "") return; // omit, not send empty string
      formData.append(key, value);
    });
    if (imageFile) {
      formData.append("primary_image_upload", imageFile);
    }

    try {
      if (isEditMode) {
        await adminService.updateProduct(id, formData);
      } else {
        await adminService.createProduct(formData);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the product.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent";

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading product...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-brand">
        {isEditMode ? "Edit Product" : "Add Product"}
      </h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Name
            <input name="name" required value={form.name} onChange={handleChange} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            SKU
            <input name="sku" required value={form.sku} onChange={handleChange} className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Short description
          <input
            name="short_description"
            value={form.short_description}
            onChange={handleChange}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          <span className="flex items-center justify-between">
            Description
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDescription}
              className="text-xs font-normal text-brand-accent hover:underline disabled:opacity-60"
            >
              {isGeneratingDescription ? "Generating..." : "Auto-generate (template-based)"}
            </button>
          </span>
          <textarea
            name="description"
            required
            rows={3}
            value={form.description}
            onChange={handleChange}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Brand
            <input name="brand" required value={form.brand} onChange={handleChange} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Category
            <select name="category" required value={form.category} onChange={handleChange} className={inputClass}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parent_name ? `${cat.parent_name} → ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Price (₹)
            <input
              name="price"
              type="number"
              step="0.01"
              required
              value={form.price}
              onChange={handleChange}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Discount price (₹)
            <input
              name="discount_price"
              type="number"
              step="0.01"
              value={form.discount_price}
              onChange={handleChange}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Stock
            <input
              name="stock"
              type="number"
              required
              value={form.stock}
              onChange={handleChange}
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-gray-600">
          {["featured", "best_seller", "new_arrival", "is_active"].map((flag) => (
            <label key={flag} className="flex items-center gap-2">
              <input type="checkbox" name={flag} checked={form[flag]} onChange={handleChange} />
              {flag.replace("_", " ")}
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Primary image</label>
          {existingImage && !imageFile && (
            <img src={existingImage} alt="Current" className="h-24 w-24 rounded object-cover" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="text-sm"
          />
        </div>

        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
          >
            {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductFormPage;
