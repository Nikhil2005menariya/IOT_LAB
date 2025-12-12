// src/pages/SessionDetails.jsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionById } from '../api';
import ReturnModal from '../components/ReturnModal';

export default function SessionDetails() {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchSessionById(id),
    enabled: !!id
  });

  const session = data?.data || data || null;
  const [showReturn, setShowReturn] = useState(null);

  if (isLoading) return <div>Loading session…</div>;
  if (isError) return <div>Error loading session.</div>;
  if (!session) return <div>Session not found.</div>;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/sessions">← Back to sessions</Link>
      </div>

      <h2>Session — {session.student_reg_no}</h2>
      <div>Borrowed at: {new Date(session.borrowed_at).toLocaleString()}</div>
      <div>Status: {session.status}</div>

      <div style={{ marginTop: 12 }}>
        <h3>Items</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {session.items.map(it => (
            <div key={String(it.item_id) + it.sku} style={{ border: '1px solid #eee', padding: 10, borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{it.name}</div>
                  <div style={{ fontSize: 12 }}>{it.sku}</div>
                </div>
                <div>
                  <div>Qty: {it.qty}</div>
                  <button onClick={() => setShowReturn({ item: it })} style={{ marginTop: 8 }}>Return</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showReturn && (
        <ReturnModal
          sessionId={session._id}
          item={showReturn.item}
          onClose={() => { setShowReturn(null); refetch(); }}
        />
      )}
    </div>
  );
}
