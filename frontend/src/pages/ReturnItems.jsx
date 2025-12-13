import { useState } from 'react';
import { fetchSessions, returnSession } from '../api';
import Loader from '../components/Loader';

export default function ReturnItems() {
  const [regNo, setRegNo] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returnQty, setReturnQty] = useState({}); // key: sessionId_itemId -> qty

  const loadSessions = async () => {
    if (!regNo) return alert('Enter registration number');
    setLoading(true);
    try {
      const data = await fetchSessions({ student_reg_no: regNo });
      setSessions(data);
    } catch {
      alert('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (sessionId, item, remaining) => {
    const key = `${sessionId}_${item.item_id}`;
    const qty = Number(returnQty[key]);

    if (!qty || qty <= 0) {
      return alert('Enter a valid quantity');
    }
    if (qty > remaining) {
      return alert(`Cannot return more than ${remaining}`);
    }

    try {
      await returnSession(sessionId, {
        items: [{ item_id: item.item_id, qty }],
        user: 'system'
      });
      setReturnQty(prev => ({ ...prev, [key]: '' }));
      loadSessions();
    } catch (e) {
      alert(e?.response?.data?.error || 'Return failed');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Return Items</h1>

      <div className="flex gap-3 mb-6">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Student Registration No"
          value={regNo}
          onChange={e => setRegNo(e.target.value)}
        />
        <button className="btn btn-primary" onClick={loadSessions}>
          Search
        </button>
      </div>

      {loading && <Loader />}

      {sessions.map(session => (
        <div key={session._id} className="border rounded p-4 mb-4">
          <div className="text-sm text-neutralSoft-600 mb-3">
            Borrowed on {new Date(session.borrowed_at).toLocaleString()}
          </div>

          {session.items.map(item => {
            const remaining = item.qty;
            if (remaining <= 0) return null;

            const key = `${session._id}_${item.item_id}`;

            return (
              <div
                key={item.item_id}
                className="flex items-center justify-between gap-4 mb-3"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-neutralSoft-600">
                    Remaining: {remaining}
                  </div>
                </div>

                <input
                  type="number"
                  min="1"
                  max={remaining}
                  className="w-24 border rounded px-2 py-1"
                  placeholder="Qty"
                  value={returnQty[key] || ''}
                  onChange={e =>
                    setReturnQty(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))
                  }
                />

                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleReturn(session._id, item, remaining)}
                >
                  Return
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
