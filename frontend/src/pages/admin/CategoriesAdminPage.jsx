import { useEffect, useState } from "react";

import adminService from "../../services/adminService";

const emptyForm = { name: "", parent: "", is_active: true };

function CategoriesAdminPage() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = () => {
    setStatus("loading");
    adminService
      .fetchCategories()
      .then((data) => {
        setCategories(data);
        setStatus("succeeded");
      })
      .catch(() => setStatus("failed"));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (category) => {
    setForm({
      name: category.name,
      parent: category.parent || "",
      is_active: category.is_active,
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    const payload = { ...form, parent: form.parent || null };
    if (editingId) {
      await adminService.updateCategory(editingId, payload);
    } else {
      await adminService.createCategory(payload);
    }
    setIsSaving(false);
    setShowForm(false);
    loadCategories();
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      await adminService.deleteCategory(category.id);
    } catch (error) {
      window.alert(error.response?.data?.message || "Could not delete this category.");
    }
    loadCategories();
  };

  const inputClass =
    "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Categories</h1>
        {!showForm && (
          <button
            onClick={startCreate}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light"
          >
            + Add Category
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
            Name
            <input name="name" required value={form.name} onChange={handleChange} className={inputClass} />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
            Parent (optional)
            <select name="parent" value={form.parent} onChange={handleChange} className={inputClass}>
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => c.id !== editingId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            Active
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{category.name}</td>
                <td className="px-4 py-3 text-gray-600">{category.parent_name || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      category.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <button
                      onClick={() => startEdit(category)}
                      className="font-medium text-brand-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
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
    </div>
  );
}

export default CategoriesAdminPage;
