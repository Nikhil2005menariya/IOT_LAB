// src/App.jsx (inside the function component)
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ItemsList from './pages/ItemsList';
import SessionsList from './pages/SessionsList';
import SessionDetails from './pages/SessionDetails';
import Analytics from './pages/Analytics';
import ReturnByStudentModal from './components/ReturnByStudentModal';

export default function App() {
  const [showReturnByStudent, setShowReturnByStudent] = useState(false);

  return (
    <BrowserRouter>
      <div className="container">
        <header style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>IoT Lab — Inventory</h1>
            <p style={{ margin: 0 }}>Items available to borrow</p>
          </div>
          <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/">Items</Link>
            <Link to="/sessions">Sessions</Link>
            <Link to="/analytics">Analytics</Link>
            <button onClick={() => setShowReturnByStudent(true)}>Return by student</button>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<ItemsList />} />
            <Route path="/sessions" element={<SessionsList />} />
            <Route path="/sessions/:id" element={<SessionDetails />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>

        {showReturnByStudent && <ReturnByStudentModal onClose={() => setShowReturnByStudent(false)} />}
      </div>
    </BrowserRouter>
  );
}
