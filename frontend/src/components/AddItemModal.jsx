// frontend/src/components/AddItemModal.jsx
import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createItem } from '../api';

export default function AddItemModal({ isOpen = false, onClose = () => {}, onSuccess = () => {} }) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSku('');
      setName('');
      setTotalQty('');
      setDescription('');
      setLocation('');
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (payload) => createItem(payload),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || 'Failed to create item';
      alert(msg);
    }
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name?.trim()) return alert('Item name is required');
    const payload = {
      sku: sku?.trim() || undefined,
      name: name.trim(),
      description: description?.trim() || undefined,
      total_quantity: Number(totalQty || 0),
      location: location?.trim() || undefined
    };
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Item</h3>
          <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-700">Close</button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="SKU (optional)"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Item name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Total quantity (number)"
            type="number"
            min="0"
            value={totalQty}
            onChange={(e) => setTotalQty(e.target.value)}
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Location (shelf)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Description (optional)"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? 'Saving…' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
