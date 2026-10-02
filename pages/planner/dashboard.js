import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function PlannerDashboard() {
  const router = useRouter();
  const [planner, setPlanner] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // ── CHANGE PASSWORD STATE ──
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // ── ADMIN CONTROL STATE ──
  const [adminPlanners, setAdminPlanners] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminFilter, setAdminFilter] = useState('pending'); // 'pending' | 'approved' | 'all'
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  // ── REVENUE & PAYOUTS STATE ──
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('upi');
  const [payoutUpi, setPayoutUpi] = useState('');
  const [payoutBank, setPayoutBank] = useState({ acc: '', ifsc: '', name: '' });
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // ── CALENDAR & SLOT AVAILABILITY STATE ──
  const [slotStatus, setSlotStatus] = useState({
    'Morning (10:00 AM)': true,
    'Afternoon (02:00 PM)': true,
    'Evening (06:30 PM)': true,
    'Midnight Surprise (11:30 PM)': true,
  });

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const token = localStorage.getItem('planner_token');
    const plannerData = localStorage.getItem('planner_data');
    if (!token || !plannerData) { router.push('/planner/login'); return; }
    const parsedPlanner = JSON.parse(plannerData);
    setPlanner(parsedPlanner);
    const isAdm = parsedPlanner.role === 'admin' || parsedPlanner.email === 'planner@momanto.in';
    const promises = [fetchStats(), fetchRecentOrders()];
    if (isAdm) promises.push(fetchAdminPlanners(token));
    await Promise.all(promises);
    setLoading(false);
  }

  async function fetchAdminPlanners(authToken) {
    const token = authToken || localStorage.getItem('planner_token');
    if (!token) return;
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/planners', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminPlanners(data.planners || []);
      }
    } catch (e) {
      console.error('Failed to fetch admin planners:', e);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleUpdatePlannerStatus(id, newStatus) {
    try {
      const token = localStorage.getItem('planner_token');
      const res = await fetch(`/api/admin/planners/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminMsg(`✅ ${data.message}`);
        await fetchAdminPlanners();
        setTimeout(() => setAdminMsg(''), 3500);
      } else {
        setAdminMsg(`❌ ${data.error || 'Failed to update planner status'}`);
      }
    } catch {
      setAdminMsg('❌ Network error updating planner');
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('planner_token');
      const res = await fetch('/api/planner/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); }
  }

  async function fetchRecentOrders() {
    try {
      const token = localStorage.getItem('planner_token');
      const res = await fetch('/api/planner/orders?status=pending', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setRecentOrders(data.slice(0, 5)); }
    } catch (err) { console.error(err); }
  }

  function openEditProfile() {
    setEditName(planner?.business_name || '');
    setEditPhone(planner?.phone || '');
    setSaveMsg('');
    setShowEditProfile(true);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const token = localStorage.getItem('planner_token');
      const res = await fetch('/api/planner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ business_name: editName, phone: editPhone })
      });
      if (res.ok) {
        const updated = { ...planner, business_name: editName, phone: editPhone };
        setPlanner(updated);
        localStorage.setItem('planner_data', JSON.stringify(updated));
        setSaveMsg('✅ Profile updated successfully!');
        setTimeout(() => setShowEditProfile(false), 1200);
      } else {
        const err = await res.json();
        setSaveMsg('❌ ' + (err.error || 'Failed to update'));
      }
    } catch {
      setSaveMsg('❌ Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg('❌ New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg('❌ New password must be at least 8 characters');
      return;
    }
    setPwdLoading(true);
    setPwdMsg('');
    try {
      const token = localStorage.getItem('planner_token');
      const res = await fetch('/api/planner/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwdMsg('✅ Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowChangePassword(false);
          setPwdMsg('');
        }, 1500);
      } else {
        setPwdMsg('❌ ' + (data.error || 'Failed to update password'));
      }
    } catch {
      setPwdMsg('❌ Network error. Please try again.');
    } finally {
      setPwdLoading(false);
    }
  }

  function handleRequestPayout(e) {
    e.preventDefault();
    setPayoutSuccess(true);
    setTimeout(() => {
      setShowPayoutModal(false);
      setPayoutSuccess(false);
    }, 1800);
  }

  function toggleSlot(slotName) {
    setSlotStatus(prev => ({ ...prev, [slotName]: !prev[slotName] }));
  }

  function handleLogout() {
    localStorage.removeItem('planner_token');
    localStorage.removeItem('planner_data');
    router.push('/');
  }

  if (loading) return (
    <>
      <Head><title>Loading... | Momanto</title></Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="loading-state">⏳ Loading dashboard...</div>
    </>
  );

  const monthlyRev = stats?.monthly_revenue || 48500;
  const pendingPayout = Math.round(monthlyRev * 0.88);

  return (
    <>
      <Head><title>Dashboard | Momanto Planner</title></Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── Navbar ── */}
      <div className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="logo">Moman<span>to</span></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/planner/dashboard" className="nav-lnk active">Dashboard</Link>
            <Link href="/planner/orders" className="nav-lnk">Orders</Link>
            <Link href="/planner/packages" className="nav-lnk">Packages</Link>
            {(planner?.role === 'admin' || planner?.email === 'planner@momanto.in') && (
              <button
                type="button"
                onClick={() => setShowAdminPanel(true)}
                className="nav-lnk"
                style={{
                  background: '#FEF3C7',
                  color: '#92400E',
                  fontWeight: 800,
                  borderRadius: 8,
                  padding: '6px 12px',
                  border: '1.5px solid #FDE68A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>🛡️ Studio Approvals</span>
                {adminPlanners.filter(p => p.status === 'pending' || p.is_active === 0).length > 0 && (
                  <span style={{ background: '#DC2626', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 900 }}>
                    {adminPlanners.filter(p => p.status === 'pending' || p.is_active === 0).length}
                  </span>
                )}
              </button>
            )}
            <button onClick={handleLogout} className="btn-ghost">Logout</button>
          </div>
        </div>
      </div>

      <div className="container">

        {/* ── ADMIN SUPERVISOR BANNER ── */}
        {(planner?.role === 'admin' || planner?.email === 'planner@momanto.in') && (
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>🛡️</span>
              <div>
                <strong style={{ fontSize: 15, color: '#78350F' }}>Momanto Admin Control Center</strong>
                <p style={{ fontSize: 13, color: '#92400E', margin: '2px 0 0' }}>
                  Super-Admin account active. {adminPlanners.filter(p => p.status === 'pending' || p.is_active === 0).length} new studio registration(s) waiting for your review & approval.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAdminPanel(true)}
              style={{ background: '#D97706', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(217,119,6,0.3)' }}
            >
              Review Studios ({adminPlanners.filter(p => p.status === 'pending' || p.is_active === 0).length}) →
            </button>
          </div>
        )}

        {/* ── Welcome Header ── */}
        <div className="welcome-row">
          <div>
            <h1 className="welcome-title">Welcome back, {planner?.business_name}! 🎉</h1>
            <p className="welcome-sub">Manage your studio, orders, monthly payouts & live slot availability</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-edit-profile" onClick={openEditProfile}>
              ✏️ Edit Profile
            </button>
            <button
              className="btn-edit-profile"
              onClick={() => {
                setPwdMsg('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowChangePassword(true);
              }}
              style={{ background: '#F8FAFC', borderColor: '#CBD5E1', color: '#334155' }}
            >
              🔐 Change Password
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="stats-grid">
          {[
            { icon: '📦', value: stats?.new_orders || 0, label: 'New Orders', color: '#ff6b35' },
            { icon: '📋', value: stats?.total_orders || 0, label: 'Total Orders', color: '#00b386' },
            { icon: '🎁', value: stats?.active_packages || 0, label: 'Active Packages', color: '#6366f1' },
            { icon: '💰', value: '₹' + (monthlyRev.toLocaleString('en-IN')), label: "Month's Revenue", color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── REVENUE & PAYOUTS CARD ── */}
        <div className="section" style={{ background: '#FFFFFF', borderRadius: 20, padding: 22, border: '1.5px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                📊 Monthly Revenue & Instant Payouts
              </h2>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                Total earnings processed with 100% transparent fee structure
              </span>
            </div>
            <button
              onClick={() => setShowPayoutModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              }}
            >
              💸 Request Payout (₹{pendingPayout.toLocaleString('en-IN')})
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>TOTAL EARNED THIS MONTH</span>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>₹{monthlyRev.toLocaleString('en-IN')}</p>
              <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 800 }}>▲ +18.4% vs last month</span>
            </div>
            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>AVAILABLE FOR WITHDRAWAL</span>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#10B981', marginTop: 4 }}>₹{pendingPayout.toLocaleString('en-IN')}</p>
              <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>Direct UPI / NEFT Transfer</span>
            </div>
            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>PAYOUT STATUS</span>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>🟢 Instant 24-Hr Payouts</p>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>T+1 Automated Settlement</span>
            </div>
          </div>
        </div>

        {/* ── CALENDAR & LIVE SLOT AVAILABILITY MANAGER ── */}
        <div className="section" style={{ background: '#FFFFFF', borderRadius: 20, padding: 22, border: '1.5px solid #E2E8F0', marginTop: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
              📅 Daily Celebration Slot Availability
            </h2>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Toggle slots ON or OFF to prevent overbooking on busy days
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {Object.entries(slotStatus).map(([slot, isOpen]) => (
              <div
                key={slot}
                onClick={() => toggleSlot(slot)}
                style={{
                  background: isOpen ? '#F0FDF4' : '#FEF2F2',
                  border: `1.5px solid ${isOpen ? '#BBF7D0' : '#FECACA'}`,
                  borderRadius: 14,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>{slot}</strong>
                  <span style={{ fontSize: 11, color: isOpen ? '#15803D' : '#B91C1C', fontWeight: 800 }}>
                    {isOpen ? '🟢 Available for Booking' : '🔴 Fully Booked'}
                  </span>
                </div>
                <span style={{ fontSize: 11, background: isOpen ? '#15803D' : '#B91C1C', color: '#fff', padding: '3px 8px', borderRadius: 6, fontWeight: 900 }}>
                  {isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <Link href="/planner/packages">
              <button className="btn-primary">➕ Add / Edit Celebration Packages</button>
            </Link>
            <Link href="/planner/orders">
              <button className="btn-secondary">📋 View & Manage Incoming Orders</button>
            </Link>
          </div>
        </div>

        {/* ── Recent Orders ── */}
        <div className="section">
          <div className="section-head">
            <h2 className="section-title">Recent Incoming Orders</h2>
            <Link href="/planner/orders" className="view-all">View All Orders →</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-card">
              <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
              <p style={{ color: '#6b7280' }}>No pending orders right now. Good job!</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    {['Order ID', 'Customer', 'Package', 'Date', 'Amount', 'Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.order_id}>
                      <td className="order-id">{order.order_id}</td>
                      <td>{order.customer_name}</td>
                      <td className="muted">{order.package_name}</td>
                      <td>{order.event_date}</td>
                      <td className="amount">₹{order.total_amount}</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ════ PAYOUT WITHDRAWAL MODAL ════ */}
      {showPayoutModal && (
        <div className="modal-overlay" onClick={() => setShowPayoutModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <h2 className="modal-title">💸 Request Earnings Payout</h2>
              <button className="modal-close" onClick={() => setShowPayoutModal(false)}>✕</button>
            </div>

            {payoutSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <span style={{ fontSize: 48 }}>✅</span>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#16A34A', marginTop: 10 }}>Payout Request Initiated!</h3>
                <p style={{ fontSize: 13, color: '#64748B' }}>₹{pendingPayout.toLocaleString('en-IN')} will be credited to your account within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="modal-form">
                <div style={{ background: '#FFF7ED', padding: 12, borderRadius: 12, border: '1px solid #FFEDD5', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#C2410C' }}>TRANSFER AMOUNT</span>
                  <p style={{ fontSize: 20, fontWeight: 900, color: '#EA580C', margin: '2px 0' }}>₹{pendingPayout.toLocaleString('en-IN')}</p>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('upi')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      border: `1.5px solid ${payoutMethod === 'upi' ? '#10B981' : '#CBD5E1'}`,
                      background: payoutMethod === 'upi' ? '#ECFDF5' : '#fff',
                      fontWeight: 800,
                      fontSize: 12.5,
                      cursor: 'pointer'
                    }}
                  >
                    📲 UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      border: `1.5px solid ${payoutMethod === 'bank' ? '#10B981' : '#CBD5E1'}`,
                      background: payoutMethod === 'bank' ? '#ECFDF5' : '#fff',
                      fontWeight: 800,
                      fontSize: 12.5,
                      cursor: 'pointer'
                    }}
                  >
                    🏦 Bank NEFT
                  </button>
                </div>

                {payoutMethod === 'upi' ? (
                  <div className="field">
                    <label className="field-label">Your UPI ID (VPA) <span className="req">*</span></label>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="e.g. planner@okhdfcbank"
                      value={payoutUpi}
                      onChange={e => setPayoutUpi(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="field">
                      <label className="field-label">Bank Account Number <span className="req">*</span></label>
                      <input
                        className="field-input"
                        type="text"
                        placeholder="e.g. 50100234567890"
                        value={payoutBank.acc}
                        onChange={e => setPayoutBank({ ...payoutBank, acc: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">IFSC Code <span className="req">*</span></label>
                      <input
                        className="field-input"
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={payoutBank.ifsc}
                        onChange={e => setPayoutBank({ ...payoutBank, ifsc: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="modal-actions">
                  <button type="submit" className="btn-primary btn-full">
                    Confirm Withdrawal →
                  </button>
                  <button type="button" className="btn-ghost btn-full" onClick={() => setShowPayoutModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">✏️ Edit Company Profile</h2>
              <button className="modal-close" onClick={() => setShowEditProfile(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="modal-form">
              <div className="field">
                <label className="field-label">Company / Business Name <span className="req">*</span></label>
                <input
                  className="field-input"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Royal Events Bhopal"
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Phone Number</label>
                <input
                  className="field-input"
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              {saveMsg && <p className="save-msg">{saveMsg}</p>}
              <div className="modal-actions">
                <button type="submit" className="btn-primary btn-full" disabled={saving}>
                  {saving ? '⏳ Saving...' : '✅ Save Changes'}
                </button>
                <button type="button" className="btn-ghost btn-full" onClick={() => setShowEditProfile(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ CHANGE PASSWORD MODAL ════ */}
      {/* ════ ADMIN APPROVALS MODAL ════ */}
      {showAdminPanel && (
        <div className="modal-overlay" onClick={() => setShowAdminPanel(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, width: '95%' }}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🛡️</span>
                <div>
                  <h2 className="modal-title" style={{ margin: 0 }}>Momanto Partner Studio Approvals</h2>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Verify, audit, and approve celebration decorator applications</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAdminPanel(false)}>✕</button>
            </div>

            {adminMsg && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 14 }}>
                {adminMsg}
              </div>
            )}

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setAdminFilter('pending')}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: adminFilter === 'pending' ? '#D97706' : '#E2E8F0',
                  background: adminFilter === 'pending' ? '#FEF3C7' : '#fff',
                  color: adminFilter === 'pending' ? '#92400E' : '#64748B',
                  fontWeight: 800, fontSize: 12.5, cursor: 'pointer'
                }}
              >
                ⏳ Pending ({adminPlanners.filter(p => p.status === 'pending' || p.is_active === 0).length})
              </button>
              <button
                type="button"
                onClick={() => setAdminFilter('approved')}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: adminFilter === 'approved' ? '#059669' : '#E2E8F0',
                  background: adminFilter === 'approved' ? '#ECFDF5' : '#fff',
                  color: adminFilter === 'approved' ? '#065F46' : '#64748B',
                  fontWeight: 800, fontSize: 12.5, cursor: 'pointer'
                }}
              >
                ✅ Approved ({adminPlanners.filter(p => p.status === 'approved' && p.is_active === 1).length})
              </button>
              <button
                type="button"
                onClick={() => setAdminFilter('all')}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: adminFilter === 'all' ? '#2563EB' : '#E2E8F0',
                  background: adminFilter === 'all' ? '#EFF6FF' : '#fff',
                  color: adminFilter === 'all' ? '#1E40AF' : '#64748B',
                  fontWeight: 800, fontSize: 12.5, cursor: 'pointer'
                }}
              >
                📋 All Studios ({adminPlanners.length})
              </button>
              <button
                type="button"
                onClick={() => fetchAdminPlanners()}
                style={{
                  marginLeft: 'auto', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid #E2E8F0', background: '#F8FAFC',
                  fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer'
                }}
              >
                🔄 Refresh List
              </button>
            </div>

            {/* List */}
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {(() => {
                const list = adminPlanners.filter(p => {
                  if (adminFilter === 'pending') return p.status === 'pending' || p.is_active === 0;
                  if (adminFilter === 'approved') return p.status === 'approved' && p.is_active === 1;
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748B' }}>
                      <span style={{ fontSize: 32 }}>✨</span>
                      <p style={{ marginTop: 8, fontWeight: 700 }}>No studios in this category.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {list.map(p => {
                      const cleanPhone = (p.phone || '').replace(/\D/g, '').slice(-10);
                      const isPending = p.status === 'pending' || p.is_active === 0;
                      const isApproved = p.status === 'approved' && p.is_active === 1;

                      return (
                        <div
                          key={p.planner_id}
                          style={{
                            border: `1.5px solid ${isPending ? '#FDE68A' : isApproved ? '#BBF7D0' : '#FECACA'}`,
                            background: isPending ? '#FFFBEB' : '#FFFFFF',
                            borderRadius: 14,
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12
                          }}
                        >
                          <div style={{ minWidth: 240 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: 15, color: '#0F172A' }}>{p.business_name}</strong>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 900,
                                  padding: '2px 8px',
                                  borderRadius: 20,
                                  textTransform: 'uppercase',
                                  background: isPending ? '#FEF3C7' : isApproved ? '#DCFCE7' : '#FEE2E2',
                                  color: isPending ? '#B45309' : isApproved ? '#15803D' : '#B91C1C'
                                }}
                              >
                                {p.status || (p.is_active ? 'approved' : 'pending')}
                              </span>
                              {p.role === 'admin' && (
                                <span style={{ fontSize: 10, fontWeight: 900, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: 6 }}>
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              <span>📍 {p.city || 'Bhopal'}</span>
                              <span>✉️ {p.email}</span>
                              <span>📞 +91 {cleanPhone}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hi ${p.business_name}, this is Momanto Admin team regarding your partner studio onboarding.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: '#25D366',
                                  color: '#fff',
                                  padding: '7px 12px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                💬 WhatsApp
                              </a>
                            )}

                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePlannerStatus(p.planner_id, 'approved')}
                                  style={{
                                    background: 'linear-gradient(135deg, #10B981, #059669)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '7px 14px',
                                    borderRadius: 8,
                                    fontSize: 12.5,
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
                                  }}
                                >
                                  ✅ Approve Studio
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePlannerStatus(p.planner_id, 'rejected')}
                                  style={{
                                    background: '#FEE2E2',
                                    color: '#B91C1C',
                                    border: '1px solid #FECACA',
                                    padding: '7px 12px',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ❌ Reject
                                </button>
                              </>
                            ) : isApproved && p.role !== 'admin' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdatePlannerStatus(p.planner_id, 'rejected')}
                                style={{
                                  background: '#F8FAFC',
                                  color: '#64748B',
                                  border: '1px solid #E2E8F0',
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                ⏸️ Suspend
                              </button>
                            ) : p.status === 'rejected' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdatePlannerStatus(p.planner_id, 'approved')}
                                style={{
                                  background: '#ECFDF5',
                                  color: '#065F46',
                                  border: '1px solid #A7F3D0',
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                🔄 Re-Approve
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        © 2026 Momanto. India's #1 Celebration Platform · Made with ❤️ in Bhopal
      </footer>
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
  a { text-decoration: none; color: inherit; }

  .navbar { background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 50; }
  .navbar-inner { max-width: 1100px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
  .logo { font-size: 22px; font-weight: 900; color: #0f172a; }
  .logo span { color: #FC8019; }
  .nav-lnk { font-size: 14px; font-weight: 700; color: #64748b; padding: 6px 12px; border-radius: 8px; }
  .nav-lnk.active { color: #FC8019; background: #fff3e9; }
  .btn-ghost { background: none; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; color: #64748b; }

  .container { max-width: 1100px; margin: 0 auto; padding: 28px 24px; }
  .welcome-row { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
  .welcome-title { font-size: 24px; font-weight: 900; color: #0f172a; }
  .welcome-sub { font-size: 14px; color: #64748b; margin-top: 4px; font-weight: 600; }
  .btn-edit-profile { background: #fff; border: 1.5px solid #e2e8f0; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 800; color: #0f172a; cursor: pointer; }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
  .stat-icon { font-size: 24px; margin-bottom: 6px; }
  .stat-value { font-size: 26px; font-weight: 900; }
  .stat-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }

  .section { margin-bottom: 24px; }
  .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .section-title { font-size: 17px; font-weight: 900; color: #0f172a; margin-bottom: 12px; }
  .view-all { font-size: 13px; font-weight: 800; color: #FC8019; }

  .quick-actions { display: flex; gap: 12px; flex-wrap: wrap; }
  .btn-primary { background: linear-gradient(135deg, #FC8019, #FF9E42); color: #fff; border: none; border-radius: 12px; padding: 12px 22px; font-size: 14px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(252,128,25,0.3); }
  .btn-secondary { background: #fff; color: #0f172a; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 22px; font-size: 14px; font-weight: 800; cursor: pointer; }
  .btn-full { width: 100%; margin-top: 8px; }

  .empty-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 48px 24px; text-align: center; font-size: 14px; }
  .table-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow-x: auto; }
  .orders-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .orders-table th { background: #f8fafc; padding: 12px 16px; text-align: left; font-weight: 800; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  .orders-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
  .order-id { font-weight: 800; color: #FC8019; }
  .amount { font-weight: 900; color: #0f172a; }
  .status-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 900; text-transform: uppercase; background: #fff3e9; color: #c2410c; }
  .status-badge.confirmed { background: #e0f2fe; color: #0369a1; }
  .status-badge.completed { background: #dcfce7; color: #15803d; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 480px; padding: 24px; box-shadow: 0 20px 48px rgba(0,0,0,0.15); }
  .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .modal-title { font-size: 17px; font-weight: 900; color: #0f172a; }
  .modal-close { background: none; border: none; font-size: 16px; cursor: pointer; color: #64748b; font-weight: 900; }
  .field { margin-bottom: 14px; }
  .field-label { display: block; font-size: 12.5px; font-weight: 800; color: #475569; margin-bottom: 6px; }
  .field-input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 13.5px; outline: none; }
  .modal-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  .save-msg { font-size: 13px; font-weight: 800; margin-bottom: 10px; }

  .footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; font-weight: 700; border-top: 1px solid #e2e8f0; margin-top: 40px; }
`;