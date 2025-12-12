// src/components/ReturnModal.jsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { returnSession } from '../api';

export default function ReturnModal({ sessionId, item, onClose }) {
  const [qty, setQty] = useState(1);
  const queryClient = useQueryClient();

  const m = useMutation({
    mutationFn: ({ sessionId, payload }) => returnSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onClose();
      alert('Return recorded');
    },
    onError: (err) => {
      alert('Return failed: ' + (err?.response?.data?.error || err.message));
    }
  });

    const submit = () => {
    if (qty <= 0) return alert('Quantity must be at least 1');
    if (qty > item.qty) return alert('Quantity cannot exceed borrowed qty');

    // item.item_id may be populated (object) or just an id string.
    const itemId = (item.item_id && item.item_id._id) ? item.item_id._id : item.item_id;

    m.mutate({ sessionId, payload: { items: [{ item_id: itemId, qty }], user: 'web-ui' } });
    };


  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, top: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', zIndex: 60
    }}>
      <div style={{ width: 420, background: '#fff', padding: 18, borderRadius: 8 }}>
        <h3>Return — {item.name}</h3>
        <div>Borrowed qty: {item.qty}</div>
        <div style={{ marginTop: 8 }}>
          <label>Return quantity</label>
          <input type="number" min="1" max={item.qty} value={qty} onChange={e => setQty(Number(e.target.value))} style={{ width: 120, padding: 8, marginTop: 6 }} />
        </div>

        <div style={{ marginTop: 12, textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 10px' }}>Cancel</button>
          <button disabled={m.isLoading} onClick={submit} style={{ padding: '6px 10px' }}>
            {m.isLoading ? 'Saving…' : 'Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
