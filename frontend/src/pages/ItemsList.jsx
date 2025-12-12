// src/pages/ItemsList.jsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchItems, borrowSession } from '../api';
import ItemCard from '../components/ItemCard';
import BorrowModal from '../components/BorrowModal';
import Loader from '../components/Loader';

export default function ItemsList() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems
  });

  const borrowMut = useMutation({
    mutationFn: (payload) => borrowSession(payload),
    onSuccess: () => {
      // refresh items and other queries
      window.location.reload(); // quick hack; or use queryClient.invalidateQueries
    }
  });

  const handleBorrow = (item) => {
    setSelected(item);
  };

  const confirmBorrow = (payload) => {
    borrowMut.mutate(payload);
    setSelected(null);
  };

  const filtered = items.filter(i => !query || i.name.toLowerCase().includes(query.toLowerCase()) || (i.sku && i.sku.toLowerCase().includes(query.toLowerCase())));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-neutralSoft-500">Items available to borrow</p>
        </div>
        <div className="w-80">
          <input className="w-full px-4 py-2 border rounded-md" placeholder="Search items by name or SKU" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader size={28} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <ItemCard key={item._id || item.id} item={item} onBorrow={handleBorrow} />
          ))}
        </div>
      )}

      {selected && (
        <BorrowModal item={selected} onClose={() => setSelected(null)} onConfirm={confirmBorrow} />
      )}
    </div>
  );
}
