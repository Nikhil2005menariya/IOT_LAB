// src/components/ReturnModal.jsx
import React, { useState } from 'react';

export default function ReturnModal({ sessionId, item, onClose, onReturn }) {
  const [qty, setQty] = useState(1);

  const submit = () => {
    if (qty <= 0) return alert('Quantity must be at least 1');
    if (qty > item.qty) return alert('Cannot return more than borrowed');
    onReturn({ sessionId, items: [{ item_id: (item.item_id && item.item_id._id) ? item.item_id._id : item.item_id, qty }] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[520px] bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold">Return — {item.name}</h3>
        <div className="mt-4 text-sm text-neutralSoft-600">
          Borrowed qty: <strong>{item.qty}</strong>
        </div>
        <div className="mt-3">
          <label className="text-xs text-neutralSoft-500">Return quantity</label>
          <input className="mt-1 w-28 px-3 py-2 border rounded-md" type="number" value={qty} min="1" max={item.qty} onChange={e => setQty(Number(e.target.value))} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={submit} className="btn btn-primary">Confirm Return</button>
        </div>
      </div>
    </div>
  );
}
