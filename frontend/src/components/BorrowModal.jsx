// src/components/BorrowModal.jsx
import React, { useState } from 'react';
import { borrowSession } from '../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function BorrowModal({ item, onClose }) {
  const [regNo, setRegNo] = useState('');
  const [qty, setQty] = useState(1);
  const queryClient = useQueryClient();

  const m = useMutation({
    mutationFn: borrowSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onClose();
      alert('Borrow recorded');
    },
    onError: (err) => {
      alert('Error: ' + (err?.response?.data?.error || err.message));
    }
  });

  const submit = async () => {
    if (!regNo) return alert('Enter student registration number (reg_no)');
    if (qty <= 0) return alert('Quantity must be at least 1');
    if (qty > item.available_quantity) return alert('Quantity exceeds available stock');

    const payload = {
      student_reg_no: regNo,
      items: [{ item_id: item._id, sku: item.sku, name: item.name, qty }],
      createdBy: 'web-ui'
    };
    m.mutate(payload);
  };

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, top: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', zIndex: 50
    }}>
      <div style={{ width: 480, background: '#fff', padding: 18, borderRadius: 8 }}>
        <h3>Borrow — {item.name}</h3>
        <div style={{ marginTop: 8 }}>
          <label>Student reg no</label>
          <input value={regNo} onChange={e => setRegNo(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} placeholder="e.g. 1162" />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Quantity</label>
          <input type="number" value={qty} min="1" max={item.available_quantity} onChange={e => setQty(Number(e.target.value))} style={{ width: 120, padding: 8, marginTop: 6 }} />
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 10px' }}>Cancel</button>
          <button onClick={submit} style={{ padding: '6px 10px' }} disabled={m.isLoading}>
            {m.isLoading ? 'Saving…' : 'Confirm Borrow'}
          </button>
        </div>
      </div>
    </div>
  );
}
