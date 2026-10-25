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

function AddressForm({ onSave, onCancel, isSaving, initialValues, serverError }) {
  const [form, setForm] = useState(initialValues ? { ...initialForm, ...initialValues } : initialForm);
  const [errors, setErrors] = useState({});
  const [localError, setLocalError] = useState("");

  const validate = () => {
    const newErrors = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = "Full name is required.";
    }

    const cleanPhone = form.phone.trim().replace(/^(\+91|0)/, "").replace(/[\s\-]/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = "Enter a valid 10-digit mobile number.";
    }

    if (!form.address_line_1.trim()) {
      newErrors.address_line_1 = "Address line 1 is required.";
    }

    if (!form.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!form.state.trim()) {
      newErrors.state = "State is required.";
    }

    const cleanPin = form.postal_code.trim();
    if (!cleanPin) {
      newErrors.postal_code = "PIN code is required.";
    } else if (!/^\d{6}$/.test(cleanPin)) {
      newErrors.postal_code = "Enter a valid 6-digit PIN code.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    let finalValue = type === "checkbox" ? checked : value;

    if (name === "phone") {
      finalValue = finalValue.replace(/[^\d+]/g, "").slice(0, 13);
    } else if (name === "postal_code") {
      finalValue = finalValue.replace(/\D/g, "").slice(0, 6);
    }

    setForm((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (localError) setLocalError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const cleanPhone = form.phone.trim().replace(/^(\+91|0)/, "").replace(/[\s\-]/g, "");
    const cleanPostal = form.postal_code.trim();

    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      phone: cleanPhone,
      address_line_1: form.address_line_1.trim(),
      address_line_2: form.address_line_2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: cleanPostal,
    };

    try {
      const res = await onSave(payload);
      if (res && res.error) {
        setLocalError(res.error);
      }
    } catch (err) {
      setLocalError(err.message || "Failed to save address.");
    }
  };

  const getInputClass = (fieldName) =>
    `rounded-md border px-3 py-2 text-sm transition focus:outline-none focus:ring-1 ${
      errors[fieldName]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50/20"
        : "border-gray-300 focus:border-brand-accent focus:ring-brand-accent"
    }`;

  const displayedError = localError || serverError;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800">
        {initialValues?.id ? "Edit Address" : "Add New Address"}
      </h3>

      {displayedError && (
        <div className="rounded-md bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700">
          {displayedError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Full Name *</label>
          <input
            name="full_name"
            placeholder="e.g. Rahul Sharma"
            value={form.full_name}
            onChange={handleChange}
            className={`w-full ${getInputClass("full_name")}`}
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Phone (10 Digits) *</label>
          <input
            name="phone"
            type="tel"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={handleChange}
            className={`w-full ${getInputClass("phone")}`}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Address Line 1 *</label>
        <input
          name="address_line_1"
          placeholder="House / Flat No., Building, Street, Area"
          value={form.address_line_1}
          onChange={handleChange}
          className={`w-full ${getInputClass("address_line_1")}`}
        />
        {errors.address_line_1 && (
          <p className="mt-1 text-xs text-red-600">{errors.address_line_1}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Address Line 2 (Optional)</label>
        <input
          name="address_line_2"
          placeholder="Landmark, Apartment, Suite"
          value={form.address_line_2}
          onChange={handleChange}
          className={`w-full ${getInputClass("address_line_2")}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">City *</label>
          <input
            name="city"
            placeholder="City / District"
            value={form.city}
            onChange={handleChange}
            className={`w-full ${getInputClass("city")}`}
          />
          {errors.city && (
            <p className="mt-1 text-xs text-red-600">{errors.city}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">State *</label>
          <input
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
            className={`w-full ${getInputClass("state")}`}
          />
          {errors.state && (
            <p className="mt-1 text-xs text-red-600">{errors.state}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">PIN Code (6 Digits) *</label>
          <input
            name="postal_code"
            type="text"
            maxLength={6}
            placeholder="6-digit PIN code"
            value={form.postal_code}
            onChange={handleChange}
            className={`w-full ${getInputClass("postal_code")}`}
          />
          {errors.postal_code && (
            <p className="mt-1 text-xs text-red-600">{errors.postal_code}</p>
          )}
        </div>
      </div>

      <label className="mt-1 flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          name="is_default"
          checked={form.is_default}
          onChange={handleChange}
        />
        Set as default address
      </label>

      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-light disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AddressForm;
