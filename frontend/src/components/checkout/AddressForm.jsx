import { useState } from "react";

const initialForm = {
  full_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  is_default: false,
};

function AddressForm({ onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  const inputClass =
    "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-2 gap-3">
        <input
          name="full_name"
          placeholder="Full name"
          required
          value={form.full_name}
          onChange={handleChange}
          className={inputClass}
        />
        <input
          name="phone"
          placeholder="Phone"
          required
          value={form.phone}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
      <input
        name="address_line_1"
        placeholder="Address line 1"
        required
        value={form.address_line_1}
        onChange={handleChange}
        className={inputClass}
      />
      <input
        name="address_line_2"
        placeholder="Address line 2 (optional)"
        value={form.address_line_2}
        onChange={handleChange}
        className={inputClass}
      />
      <div className="grid grid-cols-3 gap-3">
        <input
          name="city"
          placeholder="City"
          required
          value={form.city}
          onChange={handleChange}
          className={inputClass}
        />
        <input
          name="state"
          placeholder="State"
          required
          value={form.state}
          onChange={handleChange}
          className={inputClass}
        />
        <input
          name="postal_code"
          placeholder="Postal code"
          required
          value={form.postal_code}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          name="is_default"
          checked={form.is_default}
          onChange={handleChange}
        />
        Set as default address
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AddressForm;
