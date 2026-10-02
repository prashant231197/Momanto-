import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function PlannerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [alertSound, setAlertSound] = useState(true);

  function playNewOrderSound() {
    if (!alertSound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [
        { freq: 587.33, time: 0.0, dur: 0.15 },
        { freq: 880.00, time: 0.15, dur: 0.15 },
        { freq: 1174.66, time: 0.30, dur: 0.4 },
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.time);
        osc.stop(ctx.currentTime + n.time + n.dur);
      });
    } catch {}
  }

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => {
    if (localStorage.getItem('planner_token')) {
      fetchOrders();
    }
  }, [filter]);

  async function checkAuth() {
    const token = localStorage.getItem('planner_token');
    if (!token) { router.push('/planner/login'); return; }
  }

  async function fetchOrders() {
    try {
      const token = localStorage.getItem('planner_token');
      const url = filter === 'all' ? '/api/planner/orders' : `/api/planner/orders?status=${filter}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        if (data.some(o => o.status === 'pending')) {
          playNewOrderSound();
        }
      }
    } catch (err) { console.error('Error fetching orders:', err); }
    finally { setLoading(false); }
  }

  async function updateStatus(orderId, newStatus) {
    try {
      const token = localStorage.getItem('planner_token');
      const response = await fetch(`/api/planner/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) { fetchOrders(); setSelectedOrder(null); }
    } catch (err) { console.error('Error updating status:', err); }
  }

  const statusConfig = {
    pending:     { label: 'Pending',     bg: '#FFF3E0', color: '#E65100', dot: '#FF8E53' },
    confirmed:   { label: 'Confirmed',   bg: '#E3F2FD', color: '#1565C0', dot: '#42A5F5' },
    in_progress: { label: 'In Progress', bg: '#F3E5F5', color: '#6A1B9A', dot: '#AB47BC' },
    completed:   { label: 'Completed',   bg: '#E8F5E9', color: '#2E7D32', dot: '#66BB6A' },
    cancelled:   { label: 'Cancelled',   bg: '#FFEBEE', color: '#C62828', dot: '#EF5350' },
  };

  const getStatus = (s) => statusConfig[s] || { label: s, bg: '#f5f5f5', color: '#666', dot: '#999' };

  const filterTabs = [
    { key: 'all',         label: 'All Orders',  emoji: '📋' },
    { key: 'pending',     label: 'Pending',     emoji: '⏳' },
    { key: 'confirmed',   label: 'Confirmed',   emoji: '✅' },
    { key: 'in_progress', label: 'In Progress', emoji: '🎉' },
    { key: 'completed',   label: 'Completed',   emoji: '🎊' },
  ];

  if (loading) return (
    <>
      <Head>
        <title>Loading... | Momanto</title>
      </Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="center-state">
        <div className="loader-ring" />
        <p className="loading-text">Loading orders…</p>
      </div>
    </>
  );

  return (
    <>
      <Head>
        <title>Orders | Momanto Planner</title>
      </Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── Navbar ── */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo"><span className="logo-m">M</span>omanto</Link>
          <div className="nav-links">
            <Link href="/planner/dashboard" className="nav-link">Dashboard</Link>
            <Link href="/planner/orders" className="nav-link active">Orders</Link>
            <Link href="/planner/packages" className="nav-link">Packages</Link>
            <button className="logout-btn" onClick={() => {
              localStorage.removeItem('planner_token');
              localStorage.removeItem('planner_data');
              router.push('/');
            }}>Logout</button>
          </div>
        </div>
      </nav>

      {/* ── Page Header ── */}
      <div className="page-hero">
        <div className="blob bh1" /><div className="blob bh2" />
        <div className="page-hero-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <p className="hero-eyebrow">📦 Planner Dashboard</p>
            <h1 className="hero-title">Orders Management</h1>
            <p className="hero-sub">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAlertSound(!alertSound);
              if (!alertSound) playNewOrderSound();
            }}
            style={{
              background: alertSound ? '#DCFCE7' : '#F1F5F9',
              color: alertSound ? '#15803D' : '#64748B',
              border: `1.5px solid ${alertSound ? '#BBF7D0' : '#CBD5E1'}`,
              borderRadius: 12,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <span>{alertSound ? '🔔' : '🔕'}</span>
            <span>New Order Sound Alert: {alertSound ? 'ON (Active)' : 'OFF'}</span>
          </button>
        </div>
        <div className="wave-wrap">
          <svg viewBox="0 0 1440 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,25 C480,50 960,0 1440,25 L1440,50 L0,50 Z" fill="#f5f5f0"/>
          </svg>
        </div>
      </div>

      <div className="page-body">

        {/* ── Filter Tabs ── */}
        <div className="filter-row">
          {filterTabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`filter-tab ${filter === t.key ? 'active' : ''}`}>
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── Orders Table ── */}
        {orders.length === 0 ? (
          <div className="empty-card">
            <span className="empty-emoji">📭</span>
            <p className="empty-title">No orders found</p>
            <p className="empty-sub">Orders matching this filter will appear here</p>
          </div>
        ) : (
          <div className="table-card">
            {/* Desktop Table */}
            <div className="table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    {['Order ID', 'Customer', 'Package', 'Event Date', 'Amount', 'Status', 'Action'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const s = getStatus(order.status);
                    return (
                      <tr key={order.order_id} className="order-row" onClick={() => setSelectedOrder(order)}>
                        <td><span className="order-id">#{order.order_id}</span></td>
                        <td>
                          <div className="customer-name">{order.customer_name}</div>
                          <div className="customer-phone">{order.customer_phone}</div>
                        </td>
                        <td><span className="pkg-name">{order.package_name}</span></td>
                        <td>
                          <div className="event-date">{order.event_date}</div>
                          <div className="event-time">{order.event_time}</div>
                        </td>
                        <td>
                          <span className="amount">₹{order.total_amount}</span>
                        </td>
                        <td>
                          <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                            <span className="status-dot" style={{ background: s.dot }} />
                            {s.label}
                          </span>
                        </td>
                        <td>
                          <button className="view-btn" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards">
              {orders.map((order) => {
                const s = getStatus(order.status);
                return (
                  <div key={order.order_id} className="mobile-order-card" onClick={() => setSelectedOrder(order)}>
                    <div className="mc-top">
                      <span className="order-id">#{order.order_id}</span>
                      <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                        <span className="status-dot" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                    </div>
                    <div className="customer-name" style={{ marginTop: 8 }}>{order.customer_name}</div>
                    <div className="customer-phone">{order.customer_phone}</div>
                    <div className="mc-bottom">
                      <span className="event-date">📅 {order.event_date}</span>
                      <span className="amount">₹{order.total_amount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (() => {
        const s = getStatus(selectedOrder.status);
        return (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="modal-head">
                <div>
                  <p className="modal-eyebrow">Order Details</p>
                  <h2 className="modal-title">#{selectedOrder.order_id}</h2>
                </div>
                <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>

              {/* Status Banner */}
              <div className="modal-status-banner" style={{ background: s.bg, color: s.color }}>
                <span className="status-dot lg" style={{ background: s.dot }} />
                Current Status: <strong>{s.label}</strong>
              </div>

              {/* Customer Info */}
              <div className="modal-section">
                <p className="modal-section-title">👤 Customer Information</p>
                <div className="modal-grid">
                  {[
                    { label: 'Name',      value: selectedOrder.customer_name },
                    { label: 'Phone',     value: selectedOrder.customer_phone },
                    { label: 'Email',     value: selectedOrder.customer_email || 'N/A' },
                    { label: 'WhatsApp',  value: selectedOrder.customer_whatsapp || 'N/A' },
                  ].map(r => (
                    <div key={r.label} className="modal-field">
                      <p className="modal-field-label">{r.label}</p>
                      <p className="modal-field-value">{r.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <a
                    href={`https://wa.me/91${(selectedOrder.customer_whatsapp || selectedOrder.customer_phone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      `🎉 Hello ${selectedOrder.customer_name || 'Host'}!\n\nThis is regarding your celebration booking on Momanto:\n📋 Order ID: #${selectedOrder.order_id}\n✨ Package: ${selectedOrder.package_name}\n📅 Date: ${selectedOrder.event_date} at ${selectedOrder.event_time || '18:30'}\n📍 Venue: ${selectedOrder.event_location}\n💰 Total Amount: ₹${selectedOrder.total_amount}\n\nWe have received your celebration order successfully and are preparing the setup for you!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      color: '#fff',
                      padding: '9px 16px',
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: 13,
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
                    }}
                  >
                    💬 Message Customer on WhatsApp (Free Instant Update)
                  </a>
                </div>
              </div>

              {/* Event Info */}
              <div className="modal-section">
                <p className="modal-section-title">🎉 Event Information</p>
                <div className="modal-grid">
                  {[
                    { label: 'Event Date',  value: selectedOrder.event_date },
                    { label: 'Event Time',  value: selectedOrder.event_time },
                    ...(selectedOrder.occasion ? [{ label: 'Occasion', value: selectedOrder.occasion }] : []),
                    ...(selectedOrder.num_guests ? [{ label: 'Guests', value: selectedOrder.num_guests }] : []),
                  ].map(r => (
                    <div key={r.label} className="modal-field">
                      <p className="modal-field-label">{r.label}</p>
                      <p className="modal-field-value">{r.value}</p>
                    </div>
                  ))}
                </div>
                <div className="modal-field full-width" style={{ marginTop: 12 }}>
                  <p className="modal-field-label">Event Location</p>
                  <p className="modal-field-value">{selectedOrder.event_location}</p>
                </div>
              </div>

              {selectedOrder.special_requests && (
                <div className="modal-section">
                  <p className="modal-section-title">📝 Special Requests</p>
                  <p className="modal-note">{selectedOrder.special_requests}</p>
                </div>
              )}

              {/* Total */}
              <div className="modal-total">
                <span className="modal-total-label">Total Amount</span>
                <span className="modal-total-val">₹{selectedOrder.total_amount}</span>
              </div>

              {/* Update Status */}
              <div className="modal-section">
                <p className="modal-section-title">🔄 Update Status</p>
                <div className="status-btns">
                  {['pending', 'confirmed', 'in_progress', 'completed'].map(status => {
                    const sc = getStatus(status);
                    const isCurrent = selectedOrder.status === status;
                    return (
                      <button key={status}
                        onClick={() => updateStatus(selectedOrder.order_id, status)}
                        disabled={isCurrent}
                        className={`status-update-btn ${isCurrent ? 'current' : ''}`}
                        style={isCurrent ? { background: sc.bg, color: sc.color, borderColor: sc.dot } : {}}>
                        <span className="status-dot sm" style={{ background: sc.dot }} />
                        {sc.label}
                        {isCurrent && ' ✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      <footer className="footer">
        <p className="footer-logo">moman<span>to</span></p>
        <p className="footer-copy">© 2026 Momanto. Made with ❤️ in Bhopal, India</p>
      </footer>
    </>
  );
}

/* ═══════════════════════════════════════════
   STYLES — Warm Festive Light Theme
═══════════════════════════════════════════ */
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --coral:  #FF6B6B;
    --orange: #FF8E53;
    --cream:  #f5f5f0;
    --white:  #ffffff;
    --ink:    #1a1a2e;
    --muted:  #6b6880;
    --border: #e8e4f0;
  }
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
    overflow-x: hidden;
  }
  a { text-decoration: none; color: inherit; }

  /* Navbar */
  .nav {
    position: sticky; top: 0; z-index: 200;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(232,228,240,0.8);
    box-shadow: 0 1px 20px rgba(0,0,0,0.05);
  }
  .nav-inner {
    max-width: 1300px; margin: 0 auto;
    padding: 13px 28px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: var(--ink); }
  .logo-m { color: var(--coral); }
  .nav-links { display: flex; align-items: center; gap: 6px; }
  .nav-link {
    font-size: 14px; font-weight: 700; color: var(--muted);
    padding: 7px 14px; border-radius: 8px; transition: all 0.2s;
  }
  .nav-link:hover, .nav-link.active { color: var(--coral); background: rgba(255,107,107,0.07); }
  .logout-btn {
    background: none; border: 1.5px solid var(--border);
    border-radius: 8px; padding: 7px 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; color: var(--muted);
    cursor: pointer; transition: all 0.2s; margin-left: 6px;
  }
  .logout-btn:hover { border-color: var(--coral); color: var(--coral); }

  /* Center State */
  .center-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 70vh; gap: 16px;
  }
  .loader-ring {
    width: 48px; height: 48px;
    border: 4px solid #f0ece8; border-top-color: var(--coral);
    border-radius: 50%; animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 15px; font-weight: 600; color: var(--muted); }

  /* Page Hero */
  .page-hero {
    position: relative;
    background: linear-gradient(145deg, #fff8f5 0%, #ffeee6 45%, #fff0fa 100%);
    padding: 48px 28px 0;
    overflow: hidden;
    text-align: center;
  }
  .blob {
    position: absolute; border-radius: 50%;
    filter: blur(64px); opacity: 0.25; pointer-events: none;
  }
  .bh1 {
    width: 340px; height: 340px;
    background: radial-gradient(circle, #ffb347, #ff6b6b);
    top: -100px; right: -60px;
    animation: drift 8s ease-in-out infinite alternate;
  }
  .bh2 {
    width: 240px; height: 240px;
    background: radial-gradient(circle, #ff8fa3, #c084fc);
    bottom: 0; left: -50px;
    animation: drift 10s ease-in-out infinite alternate-reverse;
  }
  @keyframes drift {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(20px,28px) scale(1.08); }
  }
  .page-hero-inner { position: relative; z-index: 2; padding-bottom: 44px; }
  .hero-eyebrow {
    font-size: 12px; font-weight: 800; color: var(--coral);
    letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;
  }
  .hero-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(26px, 4vw, 38px);
    font-weight: 700; color: var(--ink);
    letter-spacing: -0.5px; margin-bottom: 8px;
  }
  .hero-sub { font-size: 14px; font-weight: 600; color: var(--muted); }
  .wave-wrap { position: relative; line-height: 0; }
  .wave-wrap svg { width: 100%; height: 50px; display: block; }

  /* Page Body */
  .page-body { max-width: 1300px; margin: 0 auto; padding: 32px 24px 80px; }

  /* Filter Tabs */
  .filter-row { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
  .filter-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 20px; border-radius: 50px;
    border: 1.5px solid var(--border);
    background: var(--white); color: var(--muted);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .filter-tab:hover { border-color: var(--coral); color: var(--coral); }
  .filter-tab.active {
    background: linear-gradient(135deg, var(--coral), var(--orange));
    border-color: transparent; color: #fff;
    box-shadow: 0 4px 16px rgba(255,107,107,0.35);
  }

  /* Empty */
  .empty-card {
    background: var(--white); border: 1.5px solid var(--border);
    border-radius: 20px; padding: 72px 40px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  }
  .empty-emoji { font-size: 56px; display: block; margin-bottom: 16px; }
  .empty-title { font-size: 20px; font-weight: 800; color: var(--ink); margin-bottom: 6px; }
  .empty-sub { font-size: 14px; font-weight: 500; color: var(--muted); }

  /* Table Card */
  .table-card {
    background: var(--white); border: 1.5px solid var(--border);
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }

  /* Desktop Table */
  .table-wrap { overflow-x: auto; }
  .orders-table { width: 100%; border-collapse: collapse; }
  .orders-table thead tr {
    background: #faf9fc;
    border-bottom: 1.5px solid var(--border);
  }
  .orders-table th {
    padding: 14px 18px;
    text-align: left; font-size: 12px; font-weight: 800;
    color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px;
    white-space: nowrap;
  }
  .order-row {
    border-bottom: 1px solid #f5f3fa;
    cursor: pointer; transition: background 0.15s;
  }
  .order-row:last-child { border-bottom: none; }
  .order-row:hover { background: #fdfcff; }
  .orders-table td { padding: 16px 18px; vertical-align: middle; }
  .order-id { font-size: 13px; font-weight: 800; color: var(--coral); }
  .customer-name { font-size: 14px; font-weight: 700; color: var(--ink); }
  .customer-phone { font-size: 12px; font-weight: 600; color: var(--muted); margin-top: 2px; }
  .pkg-name { font-size: 13px; font-weight: 600; color: var(--muted); }
  .event-date { font-size: 14px; font-weight: 700; color: var(--ink); }
  .event-time { font-size: 12px; font-weight: 600; color: var(--muted); margin-top: 2px; }
  .amount { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: var(--coral); }

  .status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 50px;
    font-size: 12px; font-weight: 800;
    white-space: nowrap;
  }
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  }
  .status-dot.lg { width: 9px; height: 9px; }
  .status-dot.sm { width: 6px; height: 6px; }

  .view-btn {
    background: none; border: 1.5px solid var(--border);
    border-radius: 8px; padding: 7px 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 700; color: var(--muted);
    cursor: pointer; transition: all 0.2s;
  }
  .view-btn:hover { border-color: var(--coral); color: var(--coral); }

  /* Mobile Cards (hidden on desktop) */
  .mobile-cards { display: none; padding: 12px; gap: 12px; flex-direction: column; }
  .mobile-order-card {
    background: #faf9fc; border: 1.5px solid var(--border);
    border-radius: 14px; padding: 16px; cursor: pointer;
    transition: box-shadow 0.2s;
  }
  .mobile-order-card:hover { box-shadow: 0 4px 16px rgba(255,107,107,0.12); }
  .mc-top { display: flex; justify-content: space-between; align-items: center; }
  .mc-bottom {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border);
  }

  @media (max-width: 768px) {
    .table-wrap { display: none; }
    .mobile-cards { display: flex; }
  }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(26,26,46,0.45);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadein 0.2s ease;
  }
  @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
  .modal-box {
    background: var(--white);
    border-radius: 24px; width: 100%; max-width: 580px;
    max-height: 88vh; overflow-y: auto;
    box-shadow: 0 24px 80px rgba(0,0,0,0.2);
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .modal-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 24px 28px 0;
  }
  .modal-eyebrow { font-size: 12px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .modal-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: var(--ink); }
  .modal-close {
    background: #f0ece8; border: none; border-radius: 50%;
    width: 36px; height: 36px;
    font-size: 16px; color: var(--muted);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; flex-shrink: 0;
  }
  .modal-close:hover { background: #ffd5d8; color: var(--coral); }

  .modal-status-banner {
    display: flex; align-items: center; gap: 8px;
    margin: 16px 28px;
    padding: 12px 16px; border-radius: 12px;
    font-size: 14px; font-weight: 700;
  }

  .modal-section { padding: 0 28px; margin-bottom: 20px; }
  .modal-section-title {
    font-size: 13px; font-weight: 800; color: var(--ink);
    margin-bottom: 14px; padding-bottom: 8px;
    border-bottom: 1.5px dashed var(--border);
  }
  .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 480px) { .modal-grid { grid-template-columns: 1fr; } }
  .modal-field {}
  .modal-field.full-width { grid-column: 1 / -1; }
  .modal-field-label { font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
  .modal-field-value { font-size: 14px; font-weight: 700; color: var(--ink); }
  .modal-note {
    font-size: 14px; font-weight: 500; color: var(--muted);
    background: #faf9fc; border-radius: 10px; padding: 12px 16px; line-height: 1.6;
  }

  .modal-total {
    display: flex; justify-content: space-between; align-items: center;
    margin: 0 28px 20px;
    background: linear-gradient(135deg, #fff8f5, #fff0e8);
    border: 1.5px solid #ffd5c0;
    border-radius: 14px; padding: 16px 20px;
  }
  .modal-total-label { font-size: 15px; font-weight: 800; color: var(--ink); }
  .modal-total-val { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; color: var(--coral); }

  .status-btns { display: flex; gap: 8px; flex-wrap: wrap; }
  .status-update-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 50px;
    border: 1.5px solid var(--border);
    background: var(--white); color: var(--muted);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s;
  }
  .status-update-btn:hover:not(:disabled) { border-color: var(--coral); color: var(--coral); }
  .status-update-btn.current { font-weight: 800; cursor: default; border-width: 2px; }
  .status-update-btn:disabled { opacity: 0.85; }

  /* Footer */
  .footer {
    background: var(--white); border-top: 1.5px solid var(--border);
    padding: 28px 24px; text-align: center;
  }
  .footer-logo { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
  .footer-logo span { color: var(--coral); }
  .footer-copy { font-size: 13px; font-weight: 600; color: var(--muted); }
`;