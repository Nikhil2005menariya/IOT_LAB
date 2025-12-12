// src/components/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header({ onOpenReturnByStudent }) {
  const location = useLocation();

  const navItem = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === to ? 'bg-brand-50 text-brand-700' : 'text-neutralSoft-700 hover:bg-neutralSoft-100'}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white border-b border-neutralSoft-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold shadow-card">IoT</div>
            <div>
              <div className="text-lg font-semibold leading-tight">IoT Lab — Inventory</div>
              <div className="text-xs text-neutralSoft-500">Electronics components inventory & borrowing</div>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          {navItem('/', 'Items')}
          {navItem('/sessions', 'Sessions')}
          {navItem('/analytics', 'Analytics')}
          <button onClick={onOpenReturnByStudent} className="ml-4 btn btn-primary">
            Return by Student
          </button>
        </nav>
      </div>
    </header>
  );
}
