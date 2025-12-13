import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchItems, borrowSession } from '../api';
import { useAuth } from '../auth/AuthContext';

import ItemCard from '../components/ItemCard';
import BorrowModal from '../components/BorrowModal';
import Loader from '../components/Loader';

import AddItemModal from '../components/AddItemModal';
import UpdateQuantityModal from '../components/UpdateQuantityModal';

export default function ItemsList() {
  const { user } = useAuth(); // role-based access
  const isAdmin = user?.role === 'admin';

  const [query, setQuery] = useState('');
  const [borrowItem, setBorrowItem] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [updateItem, setUpdateItem] = useState(null);

  const qc = useQueryClient();

  /* =====================
     FETCH ITEMS
  ====================== */
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', query],
    queryFn: () => fetchItems(query),
    keepPreviousData: true
  });

  /* =====================
     BORROW (SYSTEM USER)
  ====================== */
  const borrowMut = useMutation({
    mutationFn: borrowSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      setBorrowItem(null);
    },
    onError: (err) => {
      alert(err?.response?.data?.error || 'Borrow failed');
    }
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-neutralSoft-500">
            {isAdmin ? 'Manage lab inventory' : 'Items available to borrow'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            className="w-80 px-4 py-2 border rounded-md"
            placeholder="Search by name or SKU"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Add Item
            </button>
          )}
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item._id} className="space-y-3">
              <ItemCard
                item={item}
                onBorrow={!isAdmin ? setBorrowItem : undefined}
              />

              {/* Footer actions */}
              <div className="flex items-center justify-between text-sm">
                <span>
                  Available:{' '}
                  <strong>{item.available_quantity ?? 0}</strong>
                </span>

                {isAdmin && (
                  <button
                    className="btn btn-ghost small"
                    onClick={() => setUpdateItem(item)}
                  >
                    Update Qty
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SYSTEM USER: Borrow */}
      {!isAdmin && borrowItem && (
        <BorrowModal
          item={borrowItem}
          onClose={() => setBorrowItem(null)}
          onConfirm={(payload) => borrowMut.mutate(payload)}
        />
      )}

      {/* ADMIN: Add Item */}
      {isAdmin && showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['items'] });
            setShowAddModal(false);
          }}
        />
      )}

      {/* ADMIN: Update Quantity */}
      {isAdmin && updateItem && (
        <UpdateQuantityModal
          item={updateItem}
          onClose={() => setUpdateItem(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['items'] });
            setUpdateItem(null);
          }}
        />
      )}
    </div>
  );
}
