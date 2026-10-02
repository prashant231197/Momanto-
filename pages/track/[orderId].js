import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo3D from '../../components/Logo3D';

export default function TrackOrder() {
  const router = useRouter();
  const { orderId } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (orderId) {
      fetchOrder();
      // Live real-time polling every 4 seconds
      const pollInterval = setInterval(() => {
        fetchOrder(false);
      }, 4000);
      return () => clearInterval(pollInterval);
    }
  }, [orderId]);

  function playStatusChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  async function fetchOrder(isInitial = true) {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder((prev) => {
          if (prev && prev.status !== data.status) {
            playStatusChime();
          }
          return data;
        });
      } else if (isInitial) {
        setOrder({
          order_id: orderId,
          package_name: 'Royal Celebration & Balloon Decor',
          business_name: 'Bloom Events Bhopal',
          planner_phone: '+919876543210',
          whatsapp_number: '916204507166',
          event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          event_time: '18:30',
          event_location: 'Arera Colony, Bhopal, MP',
          total_amount: 4999,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      if (isInitial) {
        setOrder({
          order_id: orderId,
          package_name: 'Royal Celebration & Balloon Decor',
          business_name: 'Bloom Events Bhopal',
          planner_phone: '+919876543210',
          whatsapp_number: '916204507166',
          event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          event_time: '18:30',
          event_location: 'Arera Colony, Bhopal, MP',
          total_amount: 4999,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        });
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: '📝', desc: 'Booking received & assigned to planner' },
      { key: 'confirmed', label: 'Planner Confirmed', icon: '✅', desc: 'Decorator accepted & preparing materials' },
      { key: 'in_progress', label: 'Setup Underway', icon: '⚡', desc: 'Decorator en route / decorating venue' },
      { key: 'completed', label: 'Celebration Ready!', icon: '🎊', desc: 'Decor finished. Enjoy your event!' },
    ];
    const currentIndex = order ? steps.findIndex((s) => s.key === order.status) : 1;
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  /* ── Shared Navbar ── */
  const Navbar = ({ showBack = false }) => (
    <nav className="nav">
      <div className="nav-inner">
        <Logo3D size="sm" />
        {showBack && (
          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
        )}
      </div>
    </nav>
  );

  /* ── Loading State ── */
  if (loading || !mounted) {
    return (
      <>
        <Head>
          <title>Loading Tracking… | Momanto</title>
        </Head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <Navbar />
        <div className="center-state">
          <div className="loader-ring" />
          <p className="loading-text">Fetching live setup details…</p>
        </div>
      </>
    );
  }

  const steps = getStatusSteps();
  const currentStep = steps.find((s) => s.current) || steps[1];

  function handleWhatsApp() {
    const raw = order?.whatsapp_number || '916204507166';
    const phone = raw.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hi ${order?.business_name || 'Planner'}! I am tracking my order ${orderId} on Momanto 🎉. Could you share a quick status update on my setup?`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  return (
    <>
      <Head>
        <title>Track Order {orderId} | Momanto</title>
      </Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <Navbar showBack />

      {/* ── Hero Strip ── */}
      <div className="track-hero">
        <div className="track-hero-inner">
          <div className="live-badge">
            <span className="live-dot" />
            <span>LIVE CELEBRATION TRACKER</span>
          </div>
          <h1 className="track-title">Your Celebration is On Track! 🎉</h1>
          <div className="track-id-pill">
            Order ID: <strong>{orderId}</strong>
          </div>
          {currentStep && (
            <div className="track-status-badge">
              {currentStep.icon} <strong>{currentStep.label}</strong> — {currentStep.desc}
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* ── Status Timeline ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-icon">🚀</span>
            <h3 className="card-title">Live Setup Progress</h3>
          </div>
          <div className="timeline-wrap">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`timeline-step ${step.completed ? 'completed' : ''} ${
                  step.current ? 'current' : ''
                }`}
              >
                <div className="step-marker">
                  <div className="step-circle">{step.icon}</div>
                  {index < steps.length - 1 && <div className="step-track" />}
                </div>
                <div className="step-content">
                  <h4 className="step-label">{step.label}</h4>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Planner Contact Card ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-icon">👨‍🎨</span>
            <h3 className="card-title">Your Assigned Event Planner</h3>
          </div>
          <div className="card-body planner-card-body">
            <div className="planner-profile">
              <div className="planner-avatar">🎨</div>
              <div className="planner-meta">
                <div className="planner-name">{order?.business_name || 'Bloom Events Bhopal'}</div>
                <div className="planner-badge">🛡️ Momanto Verified Partner · 4.9★</div>
              </div>
            </div>

            <div className="planner-btn-row">
              <button onClick={handleWhatsApp} className="btn-chat-wa">
                💬 WhatsApp Planner
              </button>
              {order?.planner_phone && (
                <a href={`tel:${order.planner_phone}`} className="btn-call-direct">
                  📞 Call
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Order Summary ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-icon">📋</span>
            <h3 className="card-title">Event & Venue Details</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-lbl">Package:</span>
              <span className="info-val bold">{order?.package_name}</span>
            </div>
            <div className="info-row">
              <span className="info-lbl">Event Date:</span>
              <span className="info-val">{order?.event_date}</span>
            </div>
            <div className="info-row">
              <span className="info-lbl">Setup Time:</span>
              <span className="info-val">{order?.event_time || '18:30'}</span>
            </div>
            <div className="info-row">
              <span className="info-lbl">Venue Location:</span>
              <span className="info-val">{order?.event_location}</span>
            </div>
            <div className="info-row total-highlight">
              <span className="info-lbl">Total Amount:</span>
              <span className="info-val price">₹{Number(order?.total_amount || 4999).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="bottom-btns">
          <Link href="/" className="btn-return-home">
            ← Explore More Celebrations
          </Link>
        </div>
      </div>

      <footer className="footer">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Logo3D size="sm" />
        </div>
        <p>© 2026 Momanto · Real-Time Celebration Tracking in Bhopal & across India</p>
      </footer>
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Nunito', -apple-system, sans-serif; background: #F8F9FA; color: #1C1C1C; }
  a { text-decoration: none; color: inherit; }

  .nav { position: sticky; top: 0; z-index: 200; background: rgba(255,255,255,0.96); backdrop-filter: blur(16px); border-bottom: 1px solid #ECECF0; }
  .nav-inner { max-width: 720px; margin: 0 auto; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; }
  .back-link { font-size: 13px; font-weight: 800; color: #FC8019; background: #FFF3E9; padding: 6px 12px; border-radius: 8px; transition: background 0.2s; }
  .back-link:hover { background: #FFE4D0; }

  .center-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 14px; text-align: center; padding: 40px; }
  .loader-ring { width: 44px; height: 44px; border: 4px solid #ECECF0; border-top-color: #FC8019; border-radius: 50%; animation: spin 0.7s linear infinite; }
  .loading-text { font-size: 14px; font-weight: 700; color: #8A8D9B; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Hero Section */
  .track-hero { background: radial-gradient(120% 90% at 50% 0%, #FFF3EC 0%, #FFF9F6 50%, #FFFFFF 100%); border-bottom: 1px solid #ECECF0; padding: 32px 16px 28px; text-align: center; }
  .track-hero-inner { max-width: 620px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
  .live-badge { display: inline-flex; align-items: center; gap: 6px; background: #E8F9EE; color: #15903E; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 50px; margin-bottom: 12px; border: 1px solid #C8F0D6; }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #1DB954; box-shadow: 0 0 8px #1DB954; animation: pulseDot 1.5s infinite; }
  @keyframes pulseDot { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.5; } }
  .track-title { font-size: 26px; font-weight: 900; color: #1C1C1C; margin-bottom: 8px; line-height: 1.25; }
  .track-id-pill { background: #FFFFFF; border: 1.5px solid #ECECF0; border-radius: 50px; padding: 5px 16px; font-size: 13px; color: #4A4D5E; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .track-status-badge { background: #FFF0E5; color: #E55A00; border: 1.5px solid #FFD5B0; border-radius: 12px; padding: 10px 16px; font-size: 13.5px; font-weight: 700; max-width: 480px; }

  /* Body Content */
  .page-body { max-width: 680px; margin: 20px auto 40px; padding: 0 16px; display: flex; flex-direction: column; gap: 16px; }
  .card { background: #FFFFFF; border-radius: 18px; border: 1.5px solid #ECECF0; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
  .card-header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: #FAF8F5; border-bottom: 1px solid #ECECF0; }
  .card-icon { font-size: 18px; }
  .card-title { font-size: 15px; font-weight: 900; color: #1C1C1C; }
  .card-body { padding: 16px 18px; }

  /* Timeline */
  .timeline-wrap { padding: 18px 18px 8px; }
  .timeline-step { display: flex; gap: 14px; position: relative; margin-bottom: 22px; }
  .timeline-step:last-child { margin-bottom: 8px; }
  .step-marker { display: flex; flex-direction: column; align-items: center; width: 36px; flex-shrink: 0; }
  .step-circle { width: 36px; height: 36px; border-radius: 50%; background: #F4F4F6; border: 2px solid #DDD; display: flex; align-items: center; justify-content: center; font-size: 15px; z-index: 2; }
  .timeline-step.completed .step-circle { background: #E8F9EE; border-color: #1DB954; }
  .timeline-step.current .step-circle { background: #FC8019; border-color: #FC8019; color: #fff; box-shadow: 0 0 0 4px rgba(252,128,25,0.2); }
  .step-track { width: 2.5px; flex: 1; background: #ECECF0; margin-top: 4px; margin-bottom: 4px; }
  .timeline-step.completed .step-track { background: #1DB954; }
  .step-content { flex: 1; padding-top: 4px; }
  .step-label { font-size: 14px; font-weight: 900; color: #8A8D9B; margin-bottom: 2px; }
  .timeline-step.completed .step-label { color: #1C1C1C; }
  .timeline-step.current .step-label { color: #FC8019; font-size: 15px; }
  .step-desc { font-size: 12px; color: #8A8D9B; font-weight: 600; line-height: 1.4; }
  .timeline-step.completed .step-desc { color: #4A4D5E; }

  /* Planner Card */
  .planner-card-body { display: flex; flex-direction: column; gap: 14px; }
  .planner-profile { display: flex; align-items: center; gap: 12px; }
  .planner-avatar { width: 48px; height: 48px; border-radius: 14px; background: #FFF3EC; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 1.5px solid #FFD5B0; }
  .planner-name { font-size: 16px; font-weight: 900; color: #1C1C1C; }
  .planner-badge { font-size: 12px; color: #15903E; font-weight: 800; margin-top: 2px; }
  .planner-btn-row { display: flex; gap: 10px; }
  .btn-chat-wa { flex: 1; background: linear-gradient(135deg, #25D366, #128C7E); color: #fff; border: none; border-radius: 12px; padding: 12px; font-size: 14px; font-weight: 900; cursor: pointer; text-align: center; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
  .btn-call-direct { background: #FFFFFF; border: 1.5px solid #ECECF0; border-radius: 12px; padding: 12px 18px; font-size: 14px; font-weight: 900; color: #1C1C1C; display: flex; align-items: center; justify-content: center; }

  /* Summary details */
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid #F4F4F6; }
  .info-row:last-child { border-bottom: none; }
  .info-lbl { font-size: 13px; font-weight: 700; color: #8A8D9B; }
  .info-val { font-size: 13.5px; font-weight: 800; color: #1C1C1C; max-width: 62%; text-align: right; }
  .total-highlight { margin-top: 6px; padding-top: 12px; border-top: 1.5px dashed #ECECF0; }
  .price { font-size: 18px; font-weight: 900; color: #FC8019; }

  .bottom-btns { text-align: center; margin-top: 10px; }
  .btn-return-home { display: inline-block; background: #FFFFFF; border: 1.5px solid #ECECF0; border-radius: 12px; padding: 12px 24px; font-size: 14px; font-weight: 800; color: #1C1C1C; transition: all 0.2s; }
  .btn-return-home:hover { border-color: #FC8019; color: #FC8019; }

  .footer { text-align: center; padding: 24px 20px; border-top: 1px solid #ECECF0; font-size: 12px; font-weight: 700; color: #8A8D9B; }
`;
