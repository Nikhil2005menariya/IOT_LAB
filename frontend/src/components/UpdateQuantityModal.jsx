import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateItemQuantity } from '../api';

export default function UpdateQuantityModal({ item, onClose, onSuccess }) {
  const [change, setChange] = useState('');

  if (!item) return null;

  const mut = useMutation({
    mutationFn: ({ id, change, user }) =>
      updateItemQuantity(id, change, user),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      alert(err?.response?.data?.error || 'Failed to update quantity');
    }
  });

  const handleApply = () => {
    const numeric = Number(change);
    if (!Number.isFinite(numeric) || numeric === 0) {
      return alert('Enter a non-zero number');
    }
    mut.mutate({ id: item._id, change: numeric, user: 'web-ui' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">Update Quantity</h3>

        <p className="text-sm mb-2">
          <strong>{item.name}</strong>
        </p>
        <p className="text-sm mb-4">
          Available: <strong>{item.available_quantity}</strong> / Total:{' '}
          <strong>{item.total_quantity}</strong>
        </p>

        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          placeholder="+5 or -3"
          value={change}
          onChange={(e) => setChange(e.target.value)}
        />

        <div className="mt-5 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={mut.isLoading}
          >
            {mut.isLoading ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
