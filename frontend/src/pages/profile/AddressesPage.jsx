import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Breadcrumb from "../../components/common/Breadcrumb";
import AddressCard from "../../components/checkout/AddressCard";
import AddressForm from "../../components/checkout/AddressForm";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
} from "../../redux/slices/addressSlice";

function AddressesPage() {
  const dispatch = useDispatch();
  const { items: addresses, status } = useSelector((state) => state.addresses);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleAdd = async (formData) => {
    setIsSaving(true);
    const result = await dispatch(createAddress(formData));
    setIsSaving(false);
    if (createAddress.fulfilled.match(result)) {
      setIsAdding(false);
    }
  };

  const handleEdit = async (id, formData) => {
    setIsSaving(true);
    const result = await dispatch(updateAddress({ id, payload: formData }));
    setIsSaving(false);
    if (updateAddress.fulfilled.match(result)) {
      setEditingId(null);
    }
  };

  const handleDelete = (address) => {
    if (!window.confirm(`Delete the address for ${address.full_name}?`)) return;
    dispatch(deleteAddress(address.id));
  };

  const handleSetDefault = (address) => {
    dispatch(updateAddress({ id: address.id, payload: { is_default: true } }));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "My Addresses" }]} />
      <h1 className="mb-6 text-2xl font-bold text-brand">My Addresses</h1>

      {status === "loading" && addresses.length === 0 && (
        <p className="text-sm text-gray-500">Loading addresses...</p>
      )}

      {status === "succeeded" && addresses.length === 0 && !isAdding && (
        <p className="mb-4 text-sm text-gray-500">You haven't saved any addresses yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {addresses.map((address) =>
          editingId === address.id ? (
            <AddressForm
              key={address.id}
              onSave={(formData) => handleEdit(address.id, formData)}
              onCancel={() => setEditingId(null)}
              isSaving={isSaving}
            />
          ) : (
            <AddressCard
              key={address.id}
              address={address}
              actions={
                <>
                  <button
                    onClick={() => setEditingId(address.id)}
                    className="font-medium text-brand-accent hover:underline"
                  >
                    Edit
                  </button>
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address)}
                      className="font-medium text-gray-500 hover:underline"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(address)}
                    className="font-medium text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </>
              }
            />
          )
        )}

        {isAdding ? (
          <AddressForm onSave={handleAdd} onCancel={() => setIsAdding(false)} isSaving={isSaving} />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="rounded-md border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-brand-accent hover:text-brand-accent"
          >
            + Add a new address
          </button>
        )}
      </div>
    </div>
  );
}

export default AddressesPage;
