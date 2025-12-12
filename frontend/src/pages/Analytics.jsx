// frontend/src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopBorrowed, fetchLowStock } from '../api';
import { requestGeminiSummary, fetchUsage } from '../analysisApi';
import ReactMarkdown from 'react-markdown';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const cardStyle = {
  background: '#fff', border: '1px solid #eee', padding: 12, borderRadius: 8, marginBottom: 12
};

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [loadingGrok, setLoadingGrok] = useState(false);
  const [cached, setCached] = useState(false);
  const [llmResponse, setLlmResponse] = useState('');
  const [fallbackText, setFallbackText] = useState(null);
  const [topList, setTopList] = useState([]);
  const [lowList, setLowList] = useState([]);
  const [usageSeries, setUsageSeries] = useState([]);

  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ['topBorrowed', days],
    queryFn: () => fetchTopBorrowed(days, 10),
    enabled: !!days
  });

  const { data: lowData, isLoading: lowLoading } = useQuery({
    queryKey: ['lowStock', 5],
    queryFn: () => fetchLowStock(5)
  });

  // fetch time series using react-query pattern (manual)
  useEffect(() => {
    let mounted = true;
    async function loadUsage() {
      try {
        const data = await fetchUsage(days);
        if (!mounted) return;
        // data is [{date, total}, ...] ascending
        setUsageSeries(data);
      } catch (err) {
        console.error('usage fetch failed', err);
        setUsageSeries([]);
      }
    }
    loadUsage();
    return () => { mounted = false; };
  }, [days]);

  async function generateGrok(force = false) {
    setLoadingGrok(true);
    setLlmResponse('');
    setFallbackText(null);
    setTopList([]);
    setLowList([]);

    try {
      const res = await requestGeminiSummary({ days, top_n: 10, low_stock_threshold: 5, force_refresh: force });
      setCached(Boolean(res.cached));

      if (res.llm_available === true || res.llm_available === undefined) {
        setLlmResponse(res.llm_response || '');
        setTopList(res.top || []);
        setLowList(res.low || []);
      } else {
        setFallbackText(res.llm_response || 'LLM unavailable — showing fallback.');
        if (res.fallback) {
          setTopList(res.fallback.recommendations || []);
          setLowList(res.fallback.low_alerts || []);
          setLlmResponse('Fallback recommendations (LLM unavailable).');
        } else {
          setTopList(res.top || []);
          setLowList(res.low || []);
          setLlmResponse(res.llm_response || '');
        }
      }
    } catch (err) {
      setLlmResponse('Analysis failed: ' + err.message);
    } finally {
      setLoadingGrok(false);
    }
  }

  // Prepare data for charts
  const usageForChart = usageSeries.map(d => ({ date: d.date.slice(5), total: d.total })); // mm-dd display
  const topForChart = (topList && topList.length) ? topList.map((t,i) => ({
    name: t.name || t.name,
    sku: t.sku || t.sku,
    value: t.recommended_reorder !== undefined ? t.recommended_reorder : (t.totalQty || t.borrowed_qty || 0),
    borrowed: t.totalQty || t.borrowed_qty || 0
  })) : (topData && topData.length ? topData.map(t => ({ name: t.name, sku: t.sku, value: t.totalQty, borrowed: t.totalQty })) : []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>Admin Analytics</h2>
          <div style={{ color: '#666', marginTop: 6 }}>Usage patterns, top-borrowed items, and restock recommendations.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ color: '#555' }}>Days:</label>
          <input type="number" value={days} onChange={e => setDays(Number(e.target.value))} style={{ width: 80, padding: 6 }} />
          <button onClick={() => generateGrok(false)} disabled={loadingGrok} style={{ padding: '8px 12px' }}>
            {loadingGrok ? 'Generating…' : 'Generate AI Summary'}
          </button>
          <button onClick={() => generateGrok(true)} disabled={loadingGrok} style={{ padding: '8px 12px' }}>
            {loadingGrok ? 'Generating…' : 'Force Refresh'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>
        <div>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0 }}>Usage pattern (borrowed items per day)</h4>
            {usageForChart && usageForChart.length > 0 ? (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageForChart} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#f5f5f5" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#1976d2" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <div style={{ color: '#666' }}>No usage data for the selected range.</div>}
          </div>

          <div style={{ ...cardStyle }}>
            <h4 style={{ marginTop: 0 }}>Top borrowed (recent)</h4>
            <div style={{ width: '100%', height: 240 }}>
              {topForChart && topForChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={topForChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={160} />
                    <Tooltip />
                    <Bar dataKey="borrowed" fill="#ff8a65">
                      {topForChart.map((entry, idx) => <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#ff8a65' : '#ff7043'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color: '#666' }}>No borrow data yet.</div>}
            </div>
          </div>
        </div>

        <div>
          <div style={{ ...cardStyle }}>
            <h4 style={{ margin: 0 }}>AI Inventory Summary</h4>
            <div style={{ marginTop: 8 }}>
              {llmResponse ? (
                <div style={{ maxHeight: 320, overflow: 'auto' }}>
                  <ReactMarkdown>{llmResponse}</ReactMarkdown>
                </div>
              ) : (
                <div style={{ color: '#666' }}>Press "Generate AI Summary" to get LLM recommendations.</div>
              )}
              {fallbackText && <div style={{ color: '#b44', marginTop: 8 }}><strong>Note:</strong> {fallbackText}</div>}
            </div>
            {cached && <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Cached result</div>}
          </div>

          <div style={{ ...cardStyle }}>
            <h4 style={{ marginTop: 0 }}>Top recommendations / reorder</h4>
            {(!topList || topList.length === 0) && <div style={{ color: '#666' }}>No recommendations yet.</div>}
            {topList && topList.map((r, idx) => (
              <div key={(r.sku || r.name || idx) + '-' + idx} style={{ padding: 10, borderRadius: 6, border: '1px solid #f3f3f3', marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{r.name} {r.sku ? <span style={{ color: '#666', fontWeight: 500 }}>({r.sku})</span> : null}</div>
                <div style={{ fontSize: 13, color: '#444', marginTop: 6 }}>
                  Borrowed: <strong>{r.borrowed_qty ?? r.totalQty ?? '-'}</strong>
                  &nbsp;•&nbsp; Available: <strong>{r.available ?? r.available_quantity ?? '-'}</strong>
                </div>
                {r.recommended_reorder !== undefined && <div style={{ marginTop: 8 }}>Reorder: <strong>{r.recommended_reorder}</strong></div>}
                {r.reason && <div style={{ marginTop: 8, color: '#333' }}>{r.reason}</div>}
              </div>
            ))}
          </div>

          <div style={{ ...cardStyle }}>
            <h4 style={{ marginTop: 0 }}>Low-stock alerts</h4>
            {(!lowList || lowList.length === 0) && <div style={{ color: '#666' }}>No low-stock items.</div>}
            {lowList && lowList.map((l, idx) => (
              <div key={(l.sku || l.name || idx) + '-low'} style={{ padding: 8, borderRadius: 6, border: '1px solid #eee', marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{l.name} {l.sku ? <span style={{ color: '#666', fontWeight: 500 }}>({l.sku})</span> : null}</div>
                <div style={{ fontSize: 13, color: '#444' }}>Available: <strong>{l.available ?? l.available_quantity ?? '-'}</strong></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
