import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo3D from '../../components/Logo3D';

function checkIsBirthday(data) {
  if (!data) return false;
  const text = [
    data.occasion,
    data.package_name,
    data.occasion_tags,
    data.package_description,
    data.special_requests
  ].filter(Boolean).join(' ').toLowerCase();
  return text.includes('birthday') || text.includes('bday') || text.includes('janamdin');
}

export default function OrderSuccess({ initialOrder }) {
  const router = useRouter();
  const { orderId: queryOrderId } = router.query;
  const orderId = queryOrderId || initialOrder?.order_id;
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [copied, setCopied] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewNote, setReviewNote] = useState('');
  const [selectedTags, setSelectedTags] = useState(['On-Time Setup ⏱️', 'Beautiful Decor 🎈']);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // 🎂 Birthday Celebration Audio Player states
  const [isBirthdayOrder, setIsBirthdayOrder] = useState(() => {
    return initialOrder ? checkIsBirthday(initialOrder) : false;
  });
  const [isPlayingBirthdaySong, setIsPlayingBirthdaySong] = useState(false);
  const audioRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  function playStandardFanfare() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [
        { freq: 523.25, time: 0.1, dur: 0.18 }, // C5
        { freq: 659.25, time: 0.25, dur: 0.18 }, // E5
        { freq: 783.99, time: 0.40, dur: 0.22 }, // G5
        { freq: 1046.50, time: 0.58, dur: 0.6 } // C6
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
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

  function playBirthdayCelebrationMusic() {
    stopBirthdayCelebrationMusic();
    try {
      let audio = null;
      if (typeof window !== 'undefined' && window.__momantoCelebrationAudio) {
        audio = window.__momantoCelebrationAudio;
      }
      if (!audio) {
        audio = new Audio('/sounds/Just_for_You_Today.mp3');
        if (typeof window !== 'undefined') window.__momantoCelebrationAudio = audio;
      }
      audio.volume = 0.85;
      audioRef.current = audio;

      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlayingBirthdaySong(true);
          // Play for 8.0 seconds, then smooth fade-out over ~1.8 seconds (Total ~10 seconds)
          fadeTimerRef.current = setTimeout(() => {
            fadeIntervalRef.current = setInterval(() => {
              if (audio.volume > 0.08) {
                audio.volume = Math.max(0, audio.volume - 0.09);
              } else {
                clearInterval(fadeIntervalRef.current);
                audio.pause();
                audio.currentTime = 0;
                setIsPlayingBirthdaySong(false);
              }
            }, 120);
          }, 8000);
        }).catch((err) => {
          console.log('Autoplay was deferred until user click/touch:', err);
          setIsPlayingBirthdaySong(false);
        });
      }
    } catch (e) {
      console.log('Birthday audio error:', e);
    }
  }

  function stopBirthdayCelebrationMusic() {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }
    if (typeof window !== 'undefined' && window.__momantoCelebrationAudio) {
      try {
        window.__momantoCelebrationAudio.pause();
        window.__momantoCelebrationAudio.currentTime = 0;
      } catch {}
    }
    setIsPlayingBirthdaySong(false);
  }

  function toggleBirthdayMusic() {
    if (isPlayingBirthdaySong) {
      stopBirthdayCelebrationMusic();
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      playBirthdayCelebrationMusic();
    }
  }

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();

    try {
      localStorage.setItem('momanto_latest_order_id', orderId);
      const saved = JSON.parse(localStorage.getItem('momanto_order_ids') || '[]');
      if (!saved.includes(orderId)) {
        saved.unshift(orderId);
        localStorage.setItem('momanto_order_ids', JSON.stringify(saved.slice(0, 10)));
      }
    } catch {}

    // Check early local storage flag set by checkout
    try {
      const isBdayFlag = localStorage.getItem('momanto_is_birthday_order') === 'true';
      const savedInfo = JSON.parse(localStorage.getItem('momanto_latest_order_info') || '{}');
      if (isBdayFlag || checkIsBirthday(savedInfo)) {
        setIsBirthdayOrder(true);
        playBirthdayCelebrationMusic();
      }
    } catch {}

    return () => {
      stopBirthdayCelebrationMusic();
    };
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    let isBday = checkIsBirthday(order);
    try {
      if (localStorage.getItem('momanto_is_birthday_order') === 'true') {
        isBday = true;
      }
    } catch {}

    setIsBirthdayOrder(isBday);

    if (isBday) {
      // If not already playing, start the birthday celebration song
      if (!isPlayingBirthdaySong && (!audioRef.current || audioRef.current.paused)) {
        playBirthdayCelebrationMusic();
      }
    } else {
      playStandardFanfare();
    }
  }, [order]);

  // Fallback: If browser blocked initial autoplay, start on first user tap/click
  useEffect(() => {
    if (isBirthdayOrder && !isPlayingBirthdaySong) {
      const handleUserGesture = () => {
        if (!isPlayingBirthdaySong && (!audioRef.current || audioRef.current.paused)) {
          playBirthdayCelebrationMusic();
        }
      };
      window.addEventListener('click', handleUserGesture, { once: true });
      window.addEventListener('touchstart', handleUserGesture, { once: true });
      return () => {
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('touchstart', handleUserGesture);
      };
    }
  }, [isBirthdayOrder, isPlayingBirthdaySong]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        setOrder(await res.json());
      } else {
        setOrder({
          order_id: orderId,
          package_name: 'Celebration Setup & Decor',
          business_name: 'Verified Momanto Planner',
          customer_name: 'Sushant Kumar',
          customer_phone: '+91916204507166',
          event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          event_time: '18:30',
          event_location: 'Bhopal, Madhya Pradesh',
          total_amount: 4999,
          status: 'pending',
          whatsapp_number: '916204507166',
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      setOrder({
        order_id: orderId,
        package_name: 'Celebration Setup & Decor',
        business_name: 'Verified Momanto Planner',
        customer_name: 'Sushant Kumar',
        customer_phone: '+91916204507166',
        event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        event_time: '18:30',
        event_location: 'Bhopal, Madhya Pradesh',
        total_amount: 4999,
        status: 'pending',
        whatsapp_number: '916204507166',
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  function copyOrderId() {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsApp() {
    const raw = order?.whatsapp_number || '916204507166';
    const phone = raw.replace(/\D/g, '');
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const msg = encodeURIComponent(
      `🎉 *MOMANTO CELEBRATION BOOKING DETAILS* 🎉\n\n` +
      `📋 *Order ID:* #${orderId}\n` +
      `✨ *Package:* ${order?.package_name || 'Celebration Package'}\n` +
      `👤 *Host Name:* ${order?.customer_name || 'Host'}\n` +
      `📱 *Host Phone:* ${order?.customer_phone || ''}\n` +
      `📅 *Date & Time:* ${order?.event_date || 'Upcoming'} at ${order?.event_time || '18:30'}\n` +
      `📍 *Venue:* ${order?.event_location || ''}\n` +
      `💰 *Total Amount:* ₹${order?.total_amount ? Number(order.total_amount).toLocaleString('en-IN') : '0'}\n\n` +
      `🔴 *Live Tracking:* ${siteUrl}/track/${orderId}\n\n` +
      `Please confirm our setup! Looking forward to an amazing celebration! 🙏🎂`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  function handleCustomerWhatsAppCopy() {
    const customerPhone = (order?.customer_whatsapp || order?.customer_phone || '').replace(/\D/g, '').slice(-10);
    if (!customerPhone) return;
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const msg = encodeURIComponent(
      `🎉 *MY MOMANTO BOOKING RECEIPT* 🎉\n\n` +
      `📋 *Order ID:* #${orderId}\n` +
      `✨ *Package:* ${order?.package_name || 'Celebration Package'}\n` +
      `📅 *Date & Time:* ${order?.event_date || 'Upcoming'} at ${order?.event_time || '18:30'}\n` +
      `📍 *Venue:* ${order?.event_location || ''}\n` +
      `💰 *Total:* ₹${order?.total_amount ? Number(order.total_amount).toLocaleString('en-IN') : '0'}\n\n` +
      `🔴 *Track Live:* ${siteUrl}/track/${orderId}`
    );
    window.open(`https://wa.me/91${customerPhone}?text=${msg}`, '_blank');
  }

  function handlePrintInvoice() {
    window.print();
  }

  function handleSubmitReview(e) {
    e.preventDefault();
    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewModal(false);
    }, 1500);
  }

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'in_progress', label: 'In Progress', icon: '⚡' },
    { key: 'completed', label: 'Celebration Ready', icon: '🎊' },
  ];
  const currentIdx = order ? steps.findIndex((s) => s.key === order.status) : 0;

  if (loading) {
    return (
      <>
        <Head>
          <title>Confirming Order… | Momanto</title>
        </Head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <nav className="navbar">
          <div className="navbar-inner">
            <Logo3D size="sm" />
          </div>
        </nav>
        <div className="loading">
          <div className="spinner" />
          <p>Loading your celebration details…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Order Confirmed! 🎉 | Momanto</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Floating festive confetti */}
      {['#FF6B6B', '#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#FC8019'].map((col, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: `${15 + i * 14}%`,
            top: '20%',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: col,
            animation: `confetti 1.4s ${i * 0.12}s ease-out forwards`,
            zIndex: 999,
            pointerEvents: 'none',
          }}
        />
      ))}

      <nav className="navbar">
        <div className="navbar-inner">
          <Logo3D size="sm" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-outline-sm" onClick={() => setShowInvoiceModal(true)}>
              📄 View Tax Invoice
            </button>
            <Link href={`/track/${orderId}`}>
              <button className="btn-outline-sm" style={{ background: '#E8F9EE', color: '#16A34A', borderColor: '#BBF7D0' }}>
                📍 Track Live
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="page">
        <div className="success-banner">
          <div className="success-icon">🎉</div>
          <h1 className="success-title">Order Confirmed!</h1>
          <p className="success-sub">
            Your celebration is locked in. Your verified planner will call you within 15 minutes to confirm theme details.
          </p>
        </div>

        <div className="container">
          {/* Order ID Card */}
          <div className="orderid-card">
            <div>
              <p className="orderid-label">🔖 Order ID (Save for tracking)</p>
              <p className="orderid-hint">You can track live setup progress anytime with this ID</p>
            </div>
            <div className="orderid-right">
              <span className="orderid-value">{orderId}</span>
              <button className="copy-btn" onClick={copyOrderId}>
                {copied ? '✅ Copied!' : '📋 Copy ID'}
              </button>
            </div>
          </div>

          {/* 🎂 Birthday Celebration Audio Bar (Plays 5-10s for Birthday Orders) */}
          {isBirthdayOrder && (
            <div className="bday-music-card">
              <div className="bday-music-left">
                <div className="bday-music-icon-wrap">
                  <span className="bday-music-emoji">🎂</span>
                  <span className="bday-music-note">🎵</span>
                </div>
                <div>
                  <div className="bday-music-heading">
                    Birthday Celebration Music
                    {isPlayingBirthdaySong ? (
                      <span className="bday-playing-pill">▶ Playing Special Track (10s)</span>
                    ) : (
                      <span className="bday-paused-pill">Ready to Play</span>
                    )}
                  </div>
                  <p className="bday-music-sub">
                    {isPlayingBirthdaySong
                      ? 'Playing "Just for You Today" special birthday celebration music (5–10s) 🎶'
                      : '"Just for You Today" special birthday music loaded for your celebration!'}
                  </p>
                </div>
              </div>

              <div className="bday-music-right">
                {isPlayingBirthdaySong && (
                  <div className="bday-eq-bars">
                    <span className="bday-eq-bar eq-1" />
                    <span className="bday-eq-bar eq-2" />
                    <span className="bday-eq-bar eq-3" />
                    <span className="bday-eq-bar eq-4" />
                  </div>
                )}
                <button
                  className={`btn-bday-music ${isPlayingBirthdaySong ? 'active' : ''}`}
                  onClick={toggleBirthdayMusic}
                >
                  {isPlayingBirthdaySong ? '⏸️ Pause' : '▶ Replay Song (10s)'}
                </button>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          {order && (
            <div className="card">
              <div className="card-head">
                <span>🚀</span>
                <h3>Live Status Timeline</h3>
              </div>
              <div className="timeline">
                {steps.map((step, i, arr) => (
                  <div key={step.key} className="step">
                    <div
                      className={`step-circle ${i <= currentIdx ? 'done' : ''} ${
                        i === currentIdx ? 'current' : ''
                      }`}
                    >
                      {i <= currentIdx ? step.icon : <span className="step-num">{i + 1}</span>}
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`step-line ${i < currentIdx ? 'filled' : ''}`} />
                    )}
                    <p
                      className={`step-label ${i <= currentIdx ? 'done' : ''} ${
                        i === currentIdx ? 'active' : ''
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Details */}
          {order && (
            <div className="card">
              <div className="card-head">
                <span>📋</span>
                <h3>Booking Summary</h3>
              </div>
              <div className="detail-list">
                {[
                  { label: 'Package Name', value: order.package_name },
                  { label: 'Planner', value: order.business_name },
                  { label: 'Event Date', value: order.event_date },
                  { label: 'Event Time', value: order.event_time },
                  { label: 'Location', value: order.event_location },
                  { label: 'Payment Mode', value: order.payment_method?.toUpperCase() || 'UPI / ONLINE' },
                ].map((r) => (
                  <div key={r.label} className="detail-row">
                    <span className="detail-label">{r.label}</span>
                    <span className="detail-value">{r.value}</span>
                  </div>
                ))}
                <div className="detail-row total-row">
                  <span className="detail-label">Total Payable</span>
                  <span className="total-amount">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="action-grid">
            <button className="btn-whatsapp" onClick={handleWhatsApp}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp with Planner
              <span className="badge">⚡ Instant Reply</span>
            </button>

            <button
              onClick={handleCustomerWhatsAppCopy}
              style={{
                width: '100%',
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: 14,
                padding: '13px 18px',
                fontSize: 14,
                fontWeight: 800,
                color: '#166534',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              📲 Send Full Booking Details to My WhatsApp (Free)
            </button>

            <button
              onClick={() => setShowReviewModal(true)}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '13px 18px',
                fontSize: 13.5,
                fontWeight: 800,
                color: '#0F172A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <span>⭐</span>
              <span>Rate Experience & Share Photos</span>
            </button>
          </div>

          <div className="bottom-actions">
            <Link href={`/track/${orderId}`} style={{ flex: 1 }}>
              <button className="btn-primary btn-full">📍 Track Live Progress</button>
            </Link>
            <Link href="/" style={{ flex: 1 }}>
              <button className="btn-secondary btn-full">Back to Home</button>
            </Link>
          </div>
        </div>
      </div>

      {/* ════ TAX INVOICE MODAL (PRINT & DOWNLOAD) ════ */}
      {showInvoiceModal && (
        <div className="drawer-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="drawer-panel invoice-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Logo3D size="sm" />
                <span style={{ fontSize: 11, fontWeight: 900, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 4 }}>
                  OFFICIAL TAX INVOICE
                </span>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} style={{ background: '#F1F5F9', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
            </div>

            <div id="printable-invoice">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 16 }}>
                <div>
                  <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>Billed To:</strong>
                  <span>{order?.customer_name || 'Valued Customer'}</span><br />
                  <span>{order?.customer_phone || ''}</span><br />
                  <span>{order?.event_location || 'Bhopal, MP'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>Invoice Details:</strong>
                  <span>Invoice #: INV-{orderId}</span><br />
                  <span>Date: {new Date().toLocaleDateString('en-IN')}</span><br />
                  <span>Planner: {order?.business_name || 'Verified Studio'}</span>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Item Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px' }}>{order?.package_name} (Doorstep Setup & Materials)</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{Number(order?.total_amount).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px' }}>Delivery & Setup Convenience Fee</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16A34A', fontWeight: 800 }}>FREE (₹0)</td>
                  </tr>
                  <tr style={{ borderBottom: '1.5px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 10px' }}>GST & Safety Promise</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16A34A', fontWeight: 800 }}>INCLUDED</td>
                  </tr>
                  <tr style={{ background: '#FFF7ED', fontWeight: 900, fontSize: 14 }}>
                    <td style={{ padding: '10px 10px', color: '#0F172A' }}>Total Paid Amount</td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', color: '#EA580C' }}>₹{Number(order?.total_amount).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'center', fontSize: 11, color: '#64748B', marginBottom: 16 }}>
                <p>Thank you for choosing Momanto! India's #1 Doorstep Celebration Platform 🎈</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handlePrintInvoice}
                style={{
                  flex: 1,
                  background: '#02060C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                🖨️ Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ REVIEW & PHOTO RATING MODAL ════ */}
      {showReviewModal && (
        <div className="drawer-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Rate Your Experience ⭐
              </h3>
              <button onClick={() => setShowReviewModal(false)} style={{ background: '#F1F5F9', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
            </div>

            {reviewSubmitted ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <span style={{ fontSize: 48 }}>🎉</span>
                <h4 style={{ fontSize: 18, fontWeight: 900, color: '#16A34A', marginTop: 10 }}>Thank You for Your Feedback!</h4>
                <p style={{ fontSize: 13, color: '#64748B' }}>Your review has been shared with {order?.business_name}.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview}>
                {/* 5-Star Row */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '14px 0 20px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 32,
                        cursor: 'pointer',
                        transform: rating >= star ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s',
                      }}
                    >
                      {rating >= star ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>

                {/* Tag Chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {['On-Time Setup ⏱️', 'Beautiful Decor 🎈', 'Delicious Cake 🎂', 'Polite Decorator 🤝', 'Great Lighting 💡'].map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag]);
                        }}
                        style={{
                          background: active ? '#FFF3E9' : '#F8FAFC',
                          border: active ? '1.5px solid #FFD1B3' : '1.5px solid #E2E8F0',
                          color: active ? '#C2410C' : '#475569',
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: '5px 10px',
                          borderRadius: 50,
                          cursor: 'pointer',
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Review Text */}
                <textarea
                  placeholder="Share a few words about how the celebration went…"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontSize: 13,
                    outline: 'none',
                    marginBottom: 16,
                  }}
                />

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #FC8019, #FF9E42)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(252,128,25,0.3)',
                  }}
                >
                  Submit 5-Star Review →
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <footer className="footer">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <Logo3D size="sm" />
        </div>
        <p>© 2026 Momanto · Celebrations with ❤️ in Bhopal & across India</p>
      </footer>
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background: #F8F9FA; color: #02060C; }
  a { text-decoration: none; color: inherit; }
  
  .navbar { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #ECECF0; box-shadow: 0 1px 8px rgba(0,0,0,0.05); }
  .navbar-inner { max-width: 900px; margin: 0 auto; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; }
  .btn-outline-sm { background: #fff; border: 1.5px solid #E2E8F0; color: #02060C; border-radius: 8px; padding: 7px 14px; font-size: 12.5px; font-weight: 800; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .btn-outline-sm:hover { background: #F1F5F9; }

  .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #8A8D9B; font-size: 15px; font-weight: 700; }
  .spinner { width: 44px; height: 44px; border: 4px solid #ECECF0; border-top-color: #FC8019; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .page { min-height: 100vh; padding-bottom: 60px; }
  .success-banner { background: linear-gradient(135deg, #FC8019 0%, #FF9E42 100%); color: #fff; text-align: center; padding: 48px 24px 44px; }
  .success-icon { font-size: 58px; margin-bottom: 12px; animation: bounce 0.6s ease; }
  @keyframes bounce { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
  .success-title { font-size: 30px; font-weight: 900; margin-bottom: 8px; }
  .success-sub { font-size: 14.5px; opacity: 0.95; max-width: 480px; margin: 0 auto; line-height: 1.55; font-weight: 700; }

  .container { max-width: 680px; margin: 0 auto; padding: 0 16px; display: flex; flex-direction: column; gap: 16px; }
  
  .orderid-card { background: #fff; border: 2px solid #FC8019; border-radius: 18px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: -24px; box-shadow: 0 8px 24px rgba(252,128,25,0.18); position: relative; z-index: 10; }
  .orderid-label { font-size: 13px; font-weight: 900; color: #FC8019; margin-bottom: 2px; }
  .orderid-hint { font-size: 11.5px; color: #8A8D9B; font-weight: 600; }
  .orderid-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .orderid-value { font-size: 18px; font-weight: 900; color: #1C1C1C; letter-spacing: 0.8px; }
  .copy-btn { background: #FFF3E9; border: 1.5px solid #FC8019; color: #FC8019; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 800; cursor: pointer; font-family: inherit; white-space: nowrap; }

  .card { background: #fff; border: 1.5px solid #ECECF0; border-radius: 18px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
  .card-head { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid #ECECF0; background: #FAF8F5; font-size: 15px; font-weight: 900; }

  .timeline { display: flex; align-items: flex-start; justify-content: space-between; padding: 26px 16px 20px; }
  .step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
  .step-circle { width: 40px; height: 40px; border-radius: 50%; background: #F4F4F6; border: 2px solid #DDD; display: flex; align-items: center; justify-content: center; font-size: 16px; z-index: 2; }
  .step-circle.done { background: #E8F9EE; border-color: #1DB954; }
  .step-circle.current { background: #1DB954; border-color: #1DB954; color: #fff; box-shadow: 0 0 0 4px rgba(29,185,84,0.2); }
  .step-num { font-size: 13px; font-weight: 800; color: #AAA; }
  .step-line { position: absolute; top: 20px; left: 60%; right: -40%; height: 3px; background: #ECECF0; z-index: 1; }
  .step-line.filled { background: #1DB954; }
  .step-label { font-size: 11px; font-weight: 800; color: #AAA; margin-top: 8px; text-align: center; line-height: 1.25; }
  .step-label.done { color: #4A4D5E; }
  .step-label.active { color: #15903E; }

  .detail-list { padding: 4px 0; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid #F4F4F6; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { font-size: 13.5px; font-weight: 700; color: #8A8D9B; }
  .detail-value { font-size: 14px; font-weight: 800; max-width: 60%; text-align: right; color: #1C1C1C; }
  .total-row { background: #FFF5EE; }
  .total-amount { font-size: 20px; font-weight: 900; color: #FC8019; }

  .action-grid { display: flex; flex-direction: column; gap: 10px; }
  .btn-whatsapp { width: 100%; background: linear-gradient(135deg, #25D366, #128C7E); color: #fff; border: none; border-radius: 14px; padding: 15px 20px; font-size: 15px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px rgba(37,211,102,0.35); transition: transform 0.2s; }
  .btn-whatsapp:hover { transform: translateY(-2px); }
  .badge { background: rgba(255,255,255,0.25); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 800; }

  .bottom-actions { display: flex; gap: 12px; flex-direction: column; padding-bottom: 8px; }
  @media(min-width: 600px) { .bottom-actions { flex-direction: row; } }
  .btn-primary { background: linear-gradient(135deg, #FC8019, #FF9E42); color: #fff; border: none; border-radius: 12px; padding: 14px 22px; font-size: 14px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(252,128,25,0.3); }
  .btn-secondary { background: #fff; color: #1C1C1C; border: 1.5px solid #ECECF0; border-radius: 12px; padding: 13px 22px; font-size: 14px; font-weight: 800; cursor: pointer; }
  .btn-full { width: 100%; font-size: 14.5px; }

  .footer { text-align: center; padding: 24px 20px; border-top: 1px solid #ECECF0; margin-top: 20px; font-size: 12px; font-weight: 700; color: #8A8D9B; }

  /* Drawer Overlay for Invoice & Review Modals */
  .drawer-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
    z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;
    animation: fadeIn 0.2s ease;
  }
  .drawer-panel {
    background: #FFFFFF; border-radius: 24px; width: 100%; box-shadow: 0 20px 48px rgba(0,0,0,0.25);
    animation: slideUp 0.25s ease; overflow: hidden;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* ── Birthday Music Bar ── */
  .bday-music-card {
    background: linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%);
    border: 2px solid #FDBA74;
    border-radius: 18px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    box-shadow: 0 4px 18px rgba(251, 146, 60, 0.15);
    position: relative;
    overflow: hidden;
  }
  .bday-music-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .bday-music-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #FC8019 0%, #FF9E42 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 4px 10px rgba(252, 128, 25, 0.3);
    flex-shrink: 0;
  }
  .bday-music-emoji {
    font-size: 22px;
  }
  .bday-music-note {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 14px;
    animation: floatNote 1.6s ease-in-out infinite alternate;
  }
  @keyframes floatNote {
    from { transform: translateY(0) rotate(-6deg); }
    to { transform: translateY(-5px) rotate(12deg); }
  }
  .bday-music-heading {
    font-size: 14.5px;
    font-weight: 900;
    color: #9A3412;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .bday-playing-pill {
    background: #16A34A;
    color: #fff;
    font-size: 10.5px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 20px;
    letter-spacing: 0.3px;
    animation: pulseGlow 1.5s infinite;
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.04); }
  }
  .bday-paused-pill {
    background: #CBD5E1;
    color: #475569;
    font-size: 10.5px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 20px;
  }
  .bday-music-sub {
    font-size: 12px;
    color: #7C2D12;
    font-weight: 600;
    margin-top: 2px;
  }
  .bday-music-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .bday-eq-bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 20px;
  }
  .bday-eq-bar {
    width: 3.5px;
    background: #EA580C;
    border-radius: 3px;
    animation: eqScale 0.8s ease-in-out infinite alternate;
  }
  .bday-eq-bar.eq-1 { height: 16px; animation-delay: 0.0s; }
  .bday-eq-bar.eq-2 { height: 22px; animation-delay: 0.2s; }
  .bday-eq-bar.eq-3 { height: 12px; animation-delay: 0.4s; }
  .bday-eq-bar.eq-4 { height: 18px; animation-delay: 0.15s; }
  @keyframes eqScale {
    0% { transform: scaleY(0.3); }
    100% { transform: scaleY(1.0); }
  }
  .btn-bday-music {
    background: #EA580C;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 8px 16px;
    font-size: 12.5px;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
  }
  .btn-bday-music:hover {
    background: #C2410C;
    transform: translateY(-1px);
  }
  .btn-bday-music.active {
    background: #FFF;
    color: #EA580C;
    border: 1.5px solid #EA580C;
  }

  @media print {
    body * { visibility: hidden; }
    #printable-invoice, #printable-invoice * { visibility: visible; }
    #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
  }
`;

export async function getServerSideProps(context) {
  const { orderId } = context.params;
  try {
    const { dbHelpers } = require('../../backend/config/database');
    const order = await dbHelpers.get(
      `SELECT o.*, pl.business_name, pl.phone as planner_phone,
              pk.occasion_tags, pk.description as package_description,
              COALESCE(pk.whatsapp_number, pl.whatsapp_number, '916204507166') as whatsapp_number, pk.gallery_url
       FROM orders o 
       LEFT JOIN planners pl ON o.planner_id = pl.planner_id
       LEFT JOIN packages pk ON o.package_id = pk.package_id
       WHERE o.order_id = ?`,
      [orderId]
    );
    if (order) {
      return {
        props: {
          initialOrder: {
            ...order,
            selected_addons: order.selected_addons ? JSON.parse(order.selected_addons) : []
          }
        }
      };
    }
  } catch (err) {
    console.error('SSR fetch order error:', err.message);
  }
  return { props: { initialOrder: null } };
}