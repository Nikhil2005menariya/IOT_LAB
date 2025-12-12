// frontend/src/analysisApi.js
const ANALYSIS_BASE = import.meta.env.VITE_ANALYSIS_URL || 'http://localhost:8001';

export async function requestGeminiSummary(opts = {}) {
  const res = await fetch(`${ANALYSIS_BASE}/analysis/gemini-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Analysis service error: ${res.status} ${text}`);
  }
  return await res.json();
}
export async function fetchUsage(days = 30) {
  const res = await fetch(`${ANALYSIS_BASE}/analysis/usage?days=${days}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Analysis service error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.data || [];
}