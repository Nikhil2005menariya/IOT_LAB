// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ItemsList from './pages/ItemsList';
import SessionsList from './pages/SessionsList';
import SessionDetails from './pages/SessionDetails';
import Analytics from './pages/Analytics';
import ReturnByStudentModal from './components/ReturnByStudentModal';

export default function App() {
  const [showReturnByStudent, setShowReturnByStudent] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header onOpenReturnByStudent={() => setShowReturnByStudent(true)} />
        <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<ItemsList />} />
            <Route path="/sessions" element={<SessionsList />} />
            <Route path="/sessions/:id" element={<SessionDetails />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>

      {showReturnByStudent && (
        <ReturnByStudentModal onClose={() => setShowReturnByStudent(false)} />
      )}
    </BrowserRouter>
  );
}
