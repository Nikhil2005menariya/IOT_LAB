// src/pages/ItemsList.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchItems, borrowSession } from '../api';
import ItemCard from '../components/ItemCard';
import BorrowModal from '../components/BorrowModal';
import Loader from '../components/Loader';

// new modals (placed in src/components)
import AddItemModal from '../components/AddItemModal';
import UpdateQuantityModal from '../components/UpdateQuantityModal';

export default function ItemsList() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null); // for borrow
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedForUpdate, setSelectedForUpdate] = useState(null);

  const qc = useQueryClient();

  // fetch items with search query as part of the key so refetch works per-query
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['items', query],
    queryFn: () => fetchItems(query),
    keepPreviousData: true
  });

  // borrow mutation
  const borrowMut = useMutation({
    mutationFn: (payload) => borrowSession(payload),
    onSuccess: () => {
      // refresh items and sessions queries
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      // also refetch current items list
      refetch();
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || 'Borrow failed';
      alert(msg);
    }
  });

  const handleBorrow = (item) => {
    setSelected(item);
  };

  const confirmBorrow = (payload) => {
    borrowMut.mutate(payload);
    setSelected(null);
  };

  // open update modal for given item
  const openUpdateFor = (item) => {
    setSelectedForUpdate(item);
    setShowUpdateModal(true);
  };

  // Filter client-side as before (fast)
  const loweredQuery = query.trim().toLowerCase();
  const filtered = items.filter(i => !loweredQuery
    || (i.name && i.name.toLowerCase().includes(loweredQuery))
    || (i.sku && i.sku.toLowerCase().includes(loweredQuery)));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-neutralSoft-500">Items available to borrow</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-80">
            <input
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Search items by name or SKU"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add New Item
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader size={28} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <div key={item._id || item.id} className="space-y-3">
              <ItemCard item={item} onBorrow={handleBorrow} />
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutralSoft-600">Available: <span className="font-semibold">{item.available_quantity ?? item.available ?? 0}</span></div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-ghost small"
                    onClick={() => openUpdateFor(item)}
                  >
                    Update Qty
                  </button>
                  {/* Optional Details button or other actions can go here */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Borrow modal */}
      {selected && (
        <BorrowModal item={selected} onClose={() => setSelected(null)} onConfirm={confirmBorrow} />
      )}

      {/* Add Item modal */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { refetch(); qc.invalidateQueries({ queryKey: ['items'] }); }}
      />

      {/* Update Quantity modal */}
      <UpdateQuantityModal
        isOpen={showUpdateModal}
        item={selectedForUpdate}
        onClose={() => { setShowUpdateModal(false); setSelectedForUpdate(null); }}
        onSuccess={() => { refetch(); qc.invalidateQueries({ queryKey: ['items'] }); setSelectedForUpdate(null); setShowUpdateModal(false); }}
      />
    </div>
  );
}
