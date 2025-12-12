// src/components/ReturnByStudentModal.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSessions, returnSession } from '../api';
import ReturnModal from './ReturnModal';

export default function ReturnByStudentModal({ onClose }) {
  const [regNo, setRegNo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState(null); // { sessionId, item }
  const qc = useQueryClient();

  // query is disabled by default; we call refetch() on submit
  const { data: sessions = [], refetch, isFetching } = useQuery({
    queryKey: ['sessionsByStudent', regNo],
    queryFn: () => fetchSessions({ student_reg_no: regNo }),
    enabled: false
  });

  // mutation to perform return
  const retMut = useMutation({
    mutationFn: async ({ sessionId, payload }) => {
      // returnSession(sessionId, payload) should post { items: [{ item_id, qty }], user: 'web-ui' }
      return returnSession(sessionId, payload);
    },
    onSuccess: () => {
      // invalidate queries so UI updates
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['sessionsByStudent', regNo] });
      qc.invalidateQueries({ queryKey: ['items'] });
    }
  });

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!regNo) return alert('Enter registration number');
    setSubmitted(true);
    await refetch();
  };

  // called when ReturnModal triggers onReturn(payload)
  const handleReturn = async ({ sessionId, items }) => {
    // items: [{ item_id, qty }]
    if (!sessionId || !Array.isArray(items) || items.length === 0) return;
    try {
      await retMut.mutateAsync({ sessionId, payload: { items, user: 'web-ui' } });
      // close the ReturnModal and refresh sessions list
      setSelected(null);
      // refetch sessions to reflect updated quantities
      await refetch();
      // optional: small success feedback
      alert('Return recorded');
    } catch (err) {
      // surface the error message if available
      const msg = err?.message || 'Return failed';
      alert('Return failed: ' + msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[900px] max-h-[80vh] overflow-auto bg-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Return by Student</h3>
          <button onClick={onClose} className="btn btn-ghost">Close</button>
        </div>

        <form onSubmit={handleSearch} className="mt-4 flex gap-3">
          <input value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="Student registration number" className="flex-1 px-3 py-2 border rounded-md" />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="mt-6 grid gap-4">
          {!submitted && <div className="text-neutralSoft-500">Enter a student reg no to view active borrow sessions.</div>}

          {submitted && isFetching && <div className="text-neutralSoft-600">Loading sessions…</div>}

          {submitted && !isFetching && sessions.length === 0 && (
            <div className="text-neutralSoft-500">No active sessions found for {regNo}.</div>
          )}

          {sessions.map(sess => (
            <div key={String(sess._id)} className="p-4 border rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Session — {sess.student_reg_no}</div>
                  <div className="text-xs text-neutralSoft-500">Borrowed: {new Date(sess.borrowed_at).toLocaleString()} — Status: {sess.status}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {(sess.items || []).map(it => {
                  // item_id may be populated object or id string
                  const itemId = (it.item_id && it.item_id._id) ? it.item_id._id : it.item_id;
                  return (
                    <div key={`${String(itemId)}-${it.sku}`} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-neutralSoft-500">{it.sku}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm">Qty: {it.qty}</div>
                        <button
                          onClick={() => setSelected({ sessionId: sess._id, item: it })}
                          className="btn btn-primary small"
                          disabled={retMut.isLoading}
                        >
                          {retMut.isLoading ? 'Returning…' : 'Return'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <ReturnModal
            sessionId={selected.sessionId}
            item={selected.item}
            onClose={() => setSelected(null)}
            // this onReturn receives payload object as { sessionId, items: [...] } OR you can adapt
            onReturn={(payload) => {
              /* Normalize payload into shape handleReturn expects:
                 If ReturnModal returns { sessionId, items } then fine.
                 If it returns { items } and sessionId separately, map accordingly.
              */
              // If ReturnModal passed only { items }, attach sessionId
              if (!payload.sessionId && payload.items) {
                handleReturn({ sessionId: selected.sessionId, items: payload.items });
              } else if (payload.sessionId && payload.items) {
                handleReturn({ sessionId: payload.sessionId, items: payload.items });
              } else {
                // fallback: assume ReturnModal uses (sessionId, items) signature - adapt if needed
                // For compatibility, handle simple shape: { items: [{item_id, qty}] }
                if (payload.items) handleReturn({ sessionId: selected.sessionId, items: payload.items });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
