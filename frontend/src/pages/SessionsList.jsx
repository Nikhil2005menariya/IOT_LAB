// src/pages/SessionsList.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessions } from '../api';
import { Link } from 'react-router-dom';

export default function SessionsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    staleTime: 60 * 1000
  });

  if (isLoading) return <div>Loading sessions…</div>;
  if (isError) return <div>Error loading sessions.</div>;

  const sessions = data?.data || data || [];

  return (
    <div>
      <h2>Recent Sessions</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {sessions.length === 0 && <div>No sessions yet.</div>}
        {sessions.map(s => (
          <div key={s._id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.student_reg_no} • {s.createdBy || '—'}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(s.borrowed_at).toLocaleString()}</div>
              </div>
              <div>
                <Link to={`/sessions/${s._id}`}>Details</Link>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              {s.items && s.items.map(it => (
                <div key={String(it.item_id) + it.sku} style={{ fontSize: 13 }}>
                  {it.sku} — {it.name} × {it.qty}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
