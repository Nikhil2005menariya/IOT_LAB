// src/components/ReturnByStudentModal.jsx
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSessions } from '../api';
import ReturnModal from './ReturnModal';

/**
 * ReturnByStudentModal
 *
 * Props:
 *  - onClose(): close handler
 *
 * Behavior:
 *  - Ask for student reg no
 *  - On submit, fetch active sessions for that student
 *  - Show sessions and items grouped by session
 *  - Clicking an item opens the existing ReturnModal (to perform partial returns)
 */
export default function ReturnByStudentModal({ onClose }) {
  const [regNo, setRegNo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null); // { sessionId, item }
  const queryClient = useQueryClient();

  const { data: sessions, isFetching, refetch } = useQuery({
    queryKey: ['sessionsByStudent', regNo],
    queryFn: () => fetchSessions({ student_reg_no: regNo }),
    enabled: false // run manually
  });

  const submit = async (e) => {
    e?.preventDefault();
    if (!regNo) return alert('Enter student registration number');
    setSubmitted(true);
    await refetch();
  };

  // When a return completes, invalidate related queries so UI updates
  async function handleAfterReturn() {
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['sessionsByStudent', regNo] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
    // refresh session list
    await refetch();
  }

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, top: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', zIndex: 90
    }}>
      <div style={{ width: 820, maxHeight: '80vh', overflow: 'auto', background: '#fff', padding: 18, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Return items by student</h3>
          <div>
            <button onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
          </div>
        </div>

        <form onSubmit={submit} style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Enter student registration number (e.g. 1162)"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            style={{ padding: 8, flex: 1 }}
          />
          <button type="submit">Search</button>
        </form>

        <div style={{ marginTop: 12 }}>
          {!submitted && <div>Enter a student reg no to view active borrow sessions.</div>}
          {submitted && isFetching && <div>Loading sessions…</div>}
          {submitted && !isFetching && (!sessions || sessions.length === 0) && <div>No active sessions found for {regNo}.</div>}

          {sessions && sessions.length > 0 && (
            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              {sessions.map(sess => (
                <div key={sess._id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{sess.student_reg_no}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Borrowed: {new Date(sess.borrowed_at).toLocaleString()} — Status: {sess.status}</div>
                    </div>
                    <div>
                      <button onClick={() => {
                        // show all items? we already list them below, so this button could toggle; for now just noop
                      }}>View</button>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    {sess.items && sess.items.map(it => {
                      // item.item_id might be populated object or id string
                      const itemId = (it.item_id && it.item_id._id) ? it.item_id._id : it.item_id;
                      return (
                        <div key={`${String(itemId)}-${it.sku}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid #fafafa' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{it.name}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{it.sku}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div>Qty: {it.qty}</div>
                            <button onClick={() => setSelectedReturn({ sessionId: sess._id, item: it })}>Return</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedReturn && (
          <ReturnModal
            sessionId={selectedReturn.sessionId}
            item={selectedReturn.item}
            onClose={() => { setSelectedReturn(null); handleAfterReturn(); }}
          />
        )}
      </div>
    </div>
  );
}
