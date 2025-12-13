import React from 'react';

export default function ItemCard({ item, onBorrow }) {
  return (
    <div className="card p-4 hover:shadow-card-strong transition-shadow duration-150">
      <div className="flex items-start gap-4">
        {/* SKU box */}
        <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-neutralSoft-100 text-neutralSoft-700">
          <div className="text-sm font-semibold">
            {item.sku || 'SKU'}
          </div>
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-md font-semibold">{item.name}</div>
              <div className="text-xs text-neutralSoft-500 mt-1">
                {item.location || item.shelf || 'Shelf A1'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-neutralSoft-700">Available</div>
              <div className="text-lg font-bold">
                {item.available_quantity ?? 0}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            {typeof onBorrow === 'function' && (
              <button
                onClick={() => onBorrow(item)}
                className="btn btn-primary"
                disabled={item.available_quantity <= 0}
              >
                Borrow
              </button>
            )}

            <button className="btn btn-ghost small">
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
