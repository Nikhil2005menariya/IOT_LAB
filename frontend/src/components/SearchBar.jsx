// src/components/SearchBar.jsx
import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search items...' }) {
  return (
    <div className="flex items-center gap-3">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-md border border-neutralSoft-200 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <button className="btn btn-ghost small">Search</button>
    </div>
  );
}
