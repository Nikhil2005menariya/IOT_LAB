// src/pages/SessionsList.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessions } from '../api';
import { Link } from 'react-router-dom';

export default function SessionsList() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions
  });

  if (isLoading) return <div className="py-20 text-center">Loading sessions…</div>;
  if (!sessions.length) return <div className="py-20 text-center text-neutralSoft-500">No sessions yet.</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-3">Recent Sessions</h1>
      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s._id} className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <div className="font-medium">{s.student_reg_no} • {s.createdBy || '—'}</div>
              <div className="text-xs text-neutralSoft-500">{new Date(s.borrowed_at).toLocaleString()}</div>
            </div>
            <div>
              <Link to={`/sessions/${s._id}`} className="btn btn-ghost small">Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
