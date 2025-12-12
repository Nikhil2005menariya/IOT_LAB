// src/pages/SessionDetails.jsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSessionById, returnSession } from '../api';
import ReturnModal from '../components/ReturnModal';

export default function SessionDetails() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchSessionById(id),
    enabled: !!id
  });

  const [selected, setSelected] = useState(null);

  const retMut = useMutation({
    mutationFn: ({ sessionId, payload }) => returnSession(sessionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', id] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['items'] });
      setSelected(null);
      alert('Return recorded');
    },
    onError: (err) => alert('Return failed: ' + (err?.response?.data?.error || err.message))
  });

  if (isLoading) return <div className="py-20 text-center">Loading session…</div>;
  if (!sessionData) return <div className="py-20 text-center">Session not found</div>;

  const session = sessionData.data || sessionData;

  const handleReturn = (payload) => {
    retMut.mutate({ sessionId: session._id, payload });
  };

  return (
    <div>
      <div className="mb-4">
        <Link to="/sessions" className="text-sm text-neutralSoft-600">&larr; Back to sessions</Link>
      </div>
      <h1 className="text-2xl font-semibold">Session — {session.student_reg_no}</h1>
      <div className="text-sm text-neutralSoft-500">Borrowed at: {new Date(session.borrowed_at).toLocaleString()}</div>

      <div className="mt-6 grid gap-3">
        {session.items.map(it => (
          <div key={String(it.item_id) + it.sku} className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-neutralSoft-500">{it.sku}</div>
            </div>
            <div className="flex items-center gap-3">
              <div>Qty: <strong>{it.qty}</strong></div>
              <button onClick={() => setSelected({ sessionId: session._id, item: it })} className="btn btn-primary">Return</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ReturnModal
          sessionId={selected.sessionId}
          item={selected.item}
          onClose={() => setSelected(null)}
          onReturn={(payload) => handleReturn(payload)}
        />
      )}
    </div>
  );
}
