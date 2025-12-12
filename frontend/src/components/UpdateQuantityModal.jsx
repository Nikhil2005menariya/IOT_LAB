// frontend/src/components/UpdateQuantityModal.jsx
import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateItemQuantity } from '../api';

export default function UpdateQuantityModal({ isOpen = false, item = null, onClose = () => {}, onSuccess = () => {} }) {
  const [change, setChange] = useState('');

  useEffect(() => {
    if (isOpen) setChange('');
  }, [isOpen, item]);

  const mut = useMutation({
    mutationFn: ({ id, change, user }) => updateItemQuantity(id, change, user),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || 'Failed to update quantity';
      alert(msg);
    }
  });

  if (!isOpen || !item) return null;

  const handleApply = () => {
    const numeric = Number(change);
    if (!Number.isFinite(numeric) || numeric === 0) {
      return alert('Enter a non-zero numeric change (positive to add, negative to reduce)');
    }
    mut.mutate({ id: item._id, change: numeric, user: 'web-ui' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Update Quantity</h3>
          <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-700">Close</button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-neutral-600">Item: <span className="font-medium">{item.name}</span></div>
          <div className="text-sm text-neutral-600">Available: <span className="font-semibold">{item.available_quantity}</span></div>
          <div className="text-sm text-neutral-600">Total: <span className="font-semibold">{item.total_quantity}</span></div>
        </div>

        <div>
          <label className="block text-sm text-neutral-700 mb-1">Change (e.g. +5 or -3)</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter quantity change"
            value={change}
            onChange={(e) => setChange(e.target.value)}
          />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleApply} disabled={mut.isLoading}>
            {mut.isLoading ? 'Applying…' : 'Apply Change'}
          </button>
        </div>
      </div>
    </div>
  );
}
