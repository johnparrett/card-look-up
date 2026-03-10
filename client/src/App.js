import React, { useState, useEffect } from 'react';
import { parseCardString, generateSearchLinks } from './utils/parser';
import './App.css';

function csvSafe(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

export default function App() {
  const [tableMode, setTableMode] = useState(null); // 'new' or 'old'
  const [input, setInput] = useState('');
  const [rows, setRows] = useState(() => {
    try {
      const raw = localStorage.getItem('cardRows');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  function clearAll() {
    if (typeof window !== 'undefined' && !window.confirm('Clear all entries? This cannot be undone.')) return;
    setRows([]);
    try { localStorage.removeItem('cardRows'); } catch (e) {}
  }

  function confirmReset() {
    if (typeof window !== 'undefined' && !window.confirm('Reset to table selection screen?')) return;
    // clear the stored rows and localStorage, then go back to the chooser
    setRows([]);
    try { localStorage.removeItem('cardRows'); } catch (e) {}
    setTableMode(null);
  }

  async function handleLookup() {
    if (!input.trim()) return;
    const query = input.trim();

    const parsed = parseCardString(query);
    const urls = generateSearchLinks(parsed);

    const baseRow = {
      card: query,
      ebayPrice: '',
      urls,
      ratingPrice: '',
      ratingLink: '',
      comments: ''
    };

    setRows(prev => [...prev, baseRow]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }
      if (data) {
        const updated = {
          card: query,
          ebayPrice: '',
          urls: data.urls || urls,
          ratingPrice: '',
          ratingLink: '',
          comments: ''
        };
        setRows(prev => [...prev.slice(0, -1), updated]);
        setLoading(false);
        return;
      }
    } catch (e) {
      // ignore
    }

    setLoading(false);
  }

  function exportCSV() {
    if (tableMode === 'new') {
      const headers = [
        'Year Brand playerName [description] cardNumber — Agency Rating',
        'eBay price',
        'eBay link',
        'Rating price',
        'Rating link',
        'Comments'
      ];
      const lines = [headers.join(',')].concat(rows.map(r => {
        const ebayLink = (r.urls && r.urls.ebayLink) ? r.urls.ebayLink : '';
        return [csvSafe(r.card), csvSafe(r.ebayPrice || ''), csvSafe(ebayLink), csvSafe(r.ratingPrice || ''), csvSafe(r.ratingLink || ''), csvSafe(r.comments || '')].join(',');
      }));
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'card-prices.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Card', 'eBay Sold Price', 'Search Links'];
      const lines = [headers.join(',')].concat(rows.map(r => {
        const link = (r.urls && r.urls.ebayLink) ? r.urls.ebayLink : '';
        return [csvSafe(r.card), csvSafe(r.ebayPrice || ''), csvSafe(link)].join(',');
      }));
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'card-prices.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  useEffect(() => { try { localStorage.setItem('cardRows', JSON.stringify(rows)); } catch (e) {} }, [rows]);

  return (
    <div className="app-container" style={{ padding: 20, fontFamily: 'sans-serif', position: 'relative' }}>
      {tableMode == null ? (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <h2>Choose table format</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            <button onClick={() => setTableMode('new')}>6-column (include rating)</button>
            <button onClick={() => setTableMode('old')}>4-column (compact)</button>
          </div>
        </div>
      ) : (
        <>
          <button className="reset-button" onClick={confirmReset}>Reset</button>
          <button className="clear-button" onClick={clearAll}>Clear list</button>

          <h2>Baseball Card Look-Up</h2>
          <p>Enter: "Year Brand playerName [description] cardNumber — Agency Rating"</p>

          <div className="input-row" style={{ marginBottom: 8 }}>
            <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
              <input type="text" name="cc-number" autoComplete="cc-number" tabIndex={-1} />
              <input type="text" name="cc-exp" autoComplete="cc-exp" tabIndex={-1} />
              <input type="text" name="cc-csc" autoComplete="cc-csc" tabIndex={-1} />
            </div>

            <input
              name="card_query"
              style={{ width: '70%' }}
              type="search"
              value={input}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoCapitalize="off"
              inputMode="text"
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) handleLookup(); }}
              placeholder={'e.g. 1998 Topps Ken Griffey Jr. #34 — PSA 6'}
            />
            <button onClick={handleLookup} disabled={loading} style={{ marginLeft: 8 }}>Lookup</button>
          </div>

          <div className="table-wrapper">
            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                {tableMode === 'new' ? (
                  <tr>
                    <th>Year Brand playerName [description] cardNumber — Agency Rating</th>
                    <th>eBay price</th>
                    <th>eBay link</th>
                    <th>Rating price</th>
                    <th>Rating link</th>
                    <th>Comments</th>
                    <th>Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Card</th>
                    <th>eBay Sold Price</th>
                    <th>Search Links</th>
                    <th>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {editingIndex === i ? (
                        <input value={editingValue} onChange={e => setEditingValue(e.target.value)} style={{ width: '100%' }} />
                      ) : (
                        r.card
                      )}
                    </td>
                    {tableMode === 'new' ? (
                      <>
                        <td>{r.ebayPrice || ''}</td>
                        <td>{(r.urls && r.urls.ebayLink) ? (<a href={r.urls.ebayLink} target="_blank" rel="noreferrer">eBay link</a>) : ''}</td>
                        <td>{r.ratingPrice || ''}</td>
                        <td>{r.ratingLink ? (<a href={r.ratingLink} target="_blank" rel="noreferrer">rating link</a>) : ''}</td>
                        <td>{r.comments || ''}</td>
                      </>
                    ) : (
                      <>
                        <td>{r.ebayPrice || ''}</td>
                        <td>{(r.urls && r.urls.ebayLink) ? (<a href={r.urls.ebayLink} target="_blank" rel="noreferrer">eBay sold</a>) : ''}</td>
                      </>
                    )}
                    <td className="actions-cell">
                      {editingIndex === i ? (
                        <>
                          <button onClick={() => {
                            const newCard = editingValue.trim();
                            if (!newCard) return;
                            const parsed = parseCardString(newCard);
                            const urls = generateSearchLinks(parsed);
                            const updatedRow = {
                              ...r,
                              card: newCard,
                              urls,
                              // clear ebayPrice when editing and regenerate link
                              ebayPrice: '',
                              ratingPrice: r.ratingPrice || '',
                              ratingLink: r.ratingLink || '',
                              comments: r.comments || ''
                            };
                            setRows(prev => prev.map((row, idx) => idx === i ? updatedRow : row));
                            setEditingIndex(null);
                            setEditingValue('');
                          }}>Save</button>
                          <button onClick={() => { setEditingIndex(null); setEditingValue(''); }} style={{ marginLeft: 6 }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingIndex(i); setEditingValue(r.card || ''); }}>Edit</button>
                          <button onClick={() => { setRows(prev => prev.filter((_, idx) => idx !== i)); }} style={{ marginLeft: 6 }}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={exportCSV} disabled={rows.length === 0}>Export CSV</button>
          </div>
        </>
      )}
    </div>
  );
}
