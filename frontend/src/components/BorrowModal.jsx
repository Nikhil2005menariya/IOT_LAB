// src/components/BorrowModal.jsx
import React, { useState } from 'react';

export default function BorrowModal({ item, onClose, onConfirm }) {
  const [regNo, setRegNo] = useState('');
  const [qty, setQty] = useState(1);

  const submit = () => {
    if (!regNo) return alert('Enter student reg no');
    if (qty <= 0) return alert('Qty must be positive');
    onConfirm({ student_reg_no: regNo, items: [{ item_id: item._id || item.id, sku: item.sku, name: item.name, qty }], due_date: null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[520px] bg-white rounded-xl p-6 card-strong">
        <h3 className="text-lg font-semibold">Borrow — {item.name}</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutralSoft-500">Student Reg No</label>
            <input value={regNo} onChange={e=>setRegNo(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="e.g. 1162" />
          </div>
          <div>
            <label className="text-xs text-neutralSoft-500">Quantity</label>
            <input type="number" value={qty} min="1" max={item.available_quantity || 9999} onChange={e=>setQty(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={submit} className="btn btn-primary">Confirm Borrow</button>
        </div>
      </div>
    </div>
  );
}
