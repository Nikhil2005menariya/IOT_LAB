import { useState } from 'react';
import { createItem } from '../api';

export default function AddItemModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    location: '',
    total_quantity: ''
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.total_quantity) {
      alert('Name and quantity are required');
      return;
    }

    try {
      await createItem({
        sku: form.sku,
        name: form.name,
        description: form.description,
        location: form.location || 'Shelf A1',
        total_quantity: Number(form.total_quantity)
      });

      onSuccess();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to add item');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Add New Item</h2>

        <div className="space-y-3">
          <input
            name="sku"
            placeholder="SKU (optional)"
            className="w-full border rounded-md px-3 py-2"
            onChange={handleChange}
          />

          <input
            name="name"
            placeholder="Item name *"
            className="w-full border rounded-md px-3 py-2"
            onChange={handleChange}
          />

          <input
            name="description"
            placeholder="Description"
            className="w-full border rounded-md px-3 py-2"
            onChange={handleChange}
          />

          <input
            name="location"
            placeholder="Location (e.g. Shelf B2)"
            className="w-full border rounded-md px-3 py-2"
            onChange={handleChange}
          />

          <input
            type="number"
            name="total_quantity"
            placeholder="Total quantity *"
            className="w-full border rounded-md px-3 py-2"
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}
