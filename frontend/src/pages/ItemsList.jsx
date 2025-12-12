// src/pages/ItemsList.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchItems } from '../api';
import BorrowModal from '../components/BorrowModal';

export default function ItemsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    staleTime: 1000 * 60 * 1
  });
  const [selectedItem, setSelectedItem] = useState(null);

  if (isLoading) return <div>Loading items…</div>;
  if (isError) return <div>Error loading items.</div>;

  const items = data || [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <input placeholder="Search (not implemented)" style={{ padding: 8, flex: 1 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
        {items.map(item => (
          <div key={item._id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{item.sku} • {item.location || '—'}</div>
            <div style={{ marginTop: 8 }}>
              <div>Available: <strong>{item.available_quantity}</strong></div>
              <div>Total: {item.total_quantity}</div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button onClick={() => { setSelectedItem(item); }} style={{ padding: '6px 10px' }}>
                Borrow
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <BorrowModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
