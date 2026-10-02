import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo3D from '../../components/Logo3D';

const MOCK_PACKAGES_MAP = {
  p1: {
    package_id: 'p1',
    package_name: 'Royal Birthday Bash',
    business_name: 'Bloom Events Bhopal',
    city: 'Bhopal',
    description: 'Complete 3D balloon arch, gourmet cake, photography, fairy lights & personalized entrance banner.',
    price: 4999,
    original_price: 6999,
    discount_percent: 28,
    photos: [
      '/images/categories/birthday.jpg',
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800'
    ],
    included_items: [
      'Complete 3D Balloon Arch (100+ Metallic Balloons)',
      'Gourmet 1kg Fresh Fondant Birthday Cake',
      'Personalised LED Name & Age Milestone Banner',
      '2-Hour On-Site Setup by Pro Decorator Team',
      '10m Warm Ambient Fairy Lights & Spotlights',
      '10 High-Res Edited Digital Photoshoots'
    ],
    whatsapp_number: '916204507166'
  },
  p2: {
    package_id: 'p2',
    package_name: 'Candlelight Anniversary Setup',
    business_name: 'Dreamy Setups',
    city: 'Bhopal',
    description: 'Fresh red roses, glowing golden candles, luxury table setting & romantic couple photoshoot.',
    price: 7999,
    original_price: 10999,
    discount_percent: 27,
    photos: [
      '/images/categories/anniversary.jpg',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800'
    ],
    included_items: [
      '100 Fresh Red Dutch Velvet Roses',
      'Scented Golden Candlelight & Rose Petals Path',
      'Romantic Couple Canopy with Satin Cushions',
      'Luxury Private Tableware & Centerpiece Setup',
      'Professional Couple Photographer (1 Hour Coverage)'
    ],
    whatsapp_number: '916204507166'
  },
};

const DEFAULT_ADDONS = [
  { id: 'add_photo', name: 'DSLR Photographer (1 Hr Coverage)', price: 999, emoji: '📸', sub: '30+ High-res edited digital photos' },
  { id: 'add_cake', name: 'Upgrade to 1.5kg Pinata Hammer Cake', price: 499, emoji: '🎂', sub: 'Custom design & wooden hammer' },
  { id: 'add_guitar', name: 'Live Acoustic Guitarist (30 Mins)', price: 1499, emoji: '🎶', sub: 'Top romantic & celebration songs' },
  { id: 'add_pyro', name: 'Cold Firework Pyro Entry (4 Pcs)', price: 599, emoji: '💥', sub: 'Safe indoor/outdoor stage sparklers' },
  { id: 'add_roses', name: 'Bouquet of 20 Red Dutch Roses', price: 399, emoji: '🌹', sub: 'Fresh premium velvet cut roses' },
  { id: 'add_helium', name: '50 Ceiling Floating Balloons', price: 449, emoji: '🎈', sub: 'Metallic ribbons with ceiling cling' },
  { id: 'add_sweets', name: 'Gourmet Sweets & Chocolate Box', price: 349, emoji: '🍬', sub: 'Premium celebration gift box' },
];

/* ── Web Audio API Sounds (Zero external MP3 dependency, 100% reliable) ── */
function playCouponAppliedSound(soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Note 1: E6 (1318.5 Hz) - bright chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Note 2: B6 (1975.5 Hz) - bright sparkle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1975.53, now + 0.1);
    gain2.gain.setValueAtTime(0.35, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.log('Audio blocked:', e);
  }
}

function playOrderPlacedSound(soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.16 }, // C5
      { freq: 659.25, time: 0.14, dur: 0.16 }, // E5
      { freq: 783.99, time: 0.28, dur: 0.2 }, // G5
      { freq: 1046.50, time: 0.44, dur: 0.5 } // C6
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
  } catch (e) {
    console.log('Audio blocked:', e);
  }
}

/* ── Confetti Particle Generator ── */
function ConfettiOverlay({ active }) {
  if (!active) return null;
  const colors = ['#FF6B6B', '#FC8019', '#FFD166', '#06D6A0', '#118AB2', '#9C27B0', '#FF1493'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 45 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 1.2 + Math.random() * 1.0;
        const size = 8 + Math.random() * 8;
        const bg = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 0.6}px`,
              background: bg,
              borderRadius: '2px',
              opacity: 0.9,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `confettiFall ${duration}s ease-out ${delay}s forwards`,
            }}
          />
        );
      })}
      <style jsx global>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Navbar({ step, onBack, soundEnabled, onToggleSound, currentUser, onOpenProfile }) {
  return (
    <nav className="swiggy-nav">
      <div className="swiggy-nav-inner">
        <div className="swiggy-nav-left">
          <Link href="/" className="swiggy-brand-logo-wrap">
            <span className="swiggy-logo-icon">🎉</span>
            <span className="swiggy-logo-text">Momanto</span>
          </Link>
          <div className="swiggy-nav-divider hide-on-mobile" />
          <div className="swiggy-location-selector hide-on-mobile" onClick={onOpenProfile}>
            <span className="swiggy-loc-icon">📍</span>
            <span className="swiggy-loc-title">
              {currentUser ? `Hi, ${currentUser.name?.split(' ')[0]}` : 'Setup precise location'}
            </span>
            <span className="swiggy-loc-chevron">▾</span>
          </div>
        </div>

        <div className="swiggy-nav-search hide-on-mobile">
          <span className="swiggy-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search for restaurant and food, cakes, decor"
            className="swiggy-search-input"
            readOnly
          />
        </div>

        <div className="swiggy-nav-right">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label="Toggle Sound Effects"
            className="swiggy-sound-pill"
          >
            <span>{soundEnabled ? '🔊' : '🔇'}</span>
            <span className="hide-on-mobile">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          {step === 2 && (
            <button className="swiggy-back-btn" onClick={onBack}>
              ← Back
            </button>
          )}

          <button
            type="button"
            className="swiggy-user-avatar-btn"
            onClick={onOpenProfile}
            title={currentUser ? `${currentUser.name} (View Profile)` : 'Login / View Profile'}
            aria-label="User Profile"
          >
            {currentUser ? (
              <span className="avatar-initial-badge">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '👑'}
              </span>
            ) : (
              <span className="avatar-icon">👤</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── STEP 1: Authentic Swiggy Dineout / Restaurant Celebration Details Page ── */
function StepDetails({
  packageData,
  onContinue,
  selectedAddons,
  onToggleAddon,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onOpenCouponsDrawer,
  couponError,
  currentUser,
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [mediaTab, setMediaTab] = useState('photos'); // 'photos' | 'video'
  const [customInputCode, setCustomInputCode] = useState('');
  const [offersTab, setOffersTab] = useState('prebooking'); // 'prebooking' | 'walkin'

  const basePrice = Number(packageData.price) || 4999;
  const origPrice = packageData.original_price ? Number(packageData.original_price) : Math.round(basePrice * 1.35);
  const baseDiscount = packageData.discount_percent || (origPrice > basePrice ? Math.round(((origPrice - basePrice) / origPrice) * 100) : 28);

  // Combine photos with path normalization
  const rawPhotos = (Array.isArray(packageData.photos) && packageData.photos.length > 0
    ? packageData.photos
    : ['/images/categories/birthday.jpg']).map(p => {
      if (typeof p !== 'string') return '/images/categories/birthday.jpg';
      let clean = p.trim().replace(/\\/g, '/');
      if (clean.startsWith('public/')) clean = clean.replace(/^public\//, '/');
      if (clean.startsWith('uploads/')) clean = '/' + clean;
      return clean;
    });

  const allPhotos = rawPhotos.length > 1
    ? rawPhotos
    : [
        rawPhotos[0],
        '/images/categories/balloons.jpg',
        '/images/categories/surprise.jpg'
      ];

  const defaultInclusions = [
    'Complete 3D Balloon Arch (100+ Metallic Balloons)',
    'Gourmet 1kg Fresh Fondant Birthday Cake',
    'Personalised LED Name & Age Milestone Banner',
    '2-Hour On-Site Setup by Pro Decorator Team',
    '10m Warm Ambient Fairy Lights & Spotlights',
    '10 High-Res Edited Digital Photoshoots'
  ];

  const inclusions = Array.isArray(packageData.included_items) && packageData.included_items.length > 0
    ? packageData.included_items
    : defaultInclusions;

  const availableAddons = Array.isArray(packageData.custom_addons) && packageData.custom_addons.length > 0
    ? packageData.custom_addons
    : DEFAULT_ADDONS;

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const subtotal = basePrice + addonsTotal;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, subtotal - couponDiscount);
  const totalSavings = (origPrice - basePrice) + couponDiscount;

  function getVideoEmbed(url) {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    return url;
  }

  const embedUrl = getVideoEmbed(packageData.video_url);
  const isDirectVideo = embedUrl && !embedUrl.includes('youtube.com/embed');

  return (
    <div className="swiggy-details-page">
      {/* ── TOP SAVINGS TOAST (SWIGGY GOLD / DINEOUT STYLE) ── */}
      {totalSavings > 0 && (
        <div className="savings-toast-top">
          <span>🥳</span>
          <p>
            You saved <strong>₹{totalSavings.toLocaleString('en-IN')}</strong>
            {appliedCoupon ? (
              <> including <strong>₹{couponDiscount.toLocaleString('en-IN')} with '{appliedCoupon.code}'</strong></>
            ) : (
              <> with special planner discount</>
            )}
          </p>
        </div>
      )}

      {/* ── HERO BANNER WITH SWIGGY ACTION CHIPS & SHOW ALL IMAGES BUTTON ── */}
      <div className="swiggy-hero-container">
        {mediaTab === 'video' && packageData.video_url ? (
          <div className="swiggy-hero-media-wrap" style={{ background: '#000' }}>
            {isDirectVideo ? (
              <video src={embedUrl} controls autoPlay className="swiggy-hero-img" style={{ objectFit: 'contain' }} />
            ) : (
              <iframe
                src={embedUrl}
                title="Celebration Setup Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>
        ) : (
          <div className="swiggy-hero-media-wrap">
            <img
              src={allPhotos[activePhotoIdx] || allPhotos[0]}
              alt={packageData.package_name}
              className="swiggy-hero-img"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/categories/birthday.jpg';
              }}
            />
            <div className="swiggy-hero-overlay-grad" />

            {/* Top Swiggy Action Chips (matching Image 1) */}
            <div className="swiggy-hero-top-actions">
              <span className="swiggy-open-pill">
                <span className="open-dot" /> Open till 10PM ▾
              </span>
              <a
                href={packageData.whatsapp_number ? `https://wa.me/${packageData.whatsapp_number.replace(/\D/g, '')}` : '#'}
                target="_blank"
                rel="noreferrer"
                className="swiggy-action-pill"
              >
                <span className="action-icon">↗</span> Directions
              </a>
              <a
                href={packageData.whatsapp_number ? `tel:${packageData.whatsapp_number}` : '#'}
                className="swiggy-action-pill"
              >
                <span className="action-icon">📞</span> Call
              </a>
            </div>

            {/* Show All Images Frosted Glass Pill (matching Image 1) */}
            <button
              type="button"
              className="swiggy-show-all-btn"
              onClick={() => {
                const nextIdx = (activePhotoIdx + 1) % allPhotos.length;
                setActivePhotoIdx(nextIdx);
              }}
            >
              <span>⤢</span>
              <span>Show all images ({allPhotos.length})</span>
            </button>
          </div>
        )}

        {/* Thumbnail Preview Strip */}
        <div className="swiggy-thumb-strip">
          {allPhotos.map((imgUrl, i) => (
            <div
              key={i}
              onClick={() => {
                setActivePhotoIdx(i);
                setMediaTab('photos');
              }}
              className={`swiggy-thumb-item${activePhotoIdx === i && mediaTab === 'photos' ? ' is-active' : ''}`}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${i + 1}`}
                className="swiggy-thumb-img"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/categories/birthday.jpg';
                }}
              />
            </div>
          ))}
          {packageData.video_url && (
            <button
              type="button"
              onClick={() => setMediaTab(mediaTab === 'video' ? 'photos' : 'video')}
              className={`swiggy-thumb-item swiggy-video-thumb-btn${mediaTab === 'video' ? ' is-active' : ''}`}
            >
              <span>🎥</span>
              <span style={{ fontSize: 10, fontWeight: 800 }}>Video</span>
            </button>
          )}
        </div>
      </div>

      {/* ── PACKAGE INFO & SWIGGY ORANGE CTA BAR (MATCHING IMAGE 1) ── */}
      <div className="swiggy-info-cta-card">
        <div className="swiggy-info-left">
          <p className="swiggy-vendor-subtitle">
            BY {packageData.business_name?.toUpperCase() || 'BLOOM EVENTS BHOPAL'} · <Link href={`/studio/${packageData.planner_id || 'planner1'}`} style={{ color: '#E55A00', fontWeight: 800, textDecoration: 'underline' }}>VIEW MENU →</Link> · 📍 {packageData.city?.toUpperCase() || 'BHOPAL'}
          </p>
          <h1 className="swiggy-pkg-main-title">{packageData.package_name}</h1>

          <div className="swiggy-meta-pills-row">
            <span className="swiggy-verified-pill">★ {packageData.rating || '4.9'} Verified</span>
            <span className="swiggy-meta-sep">·</span>
            <span className="swiggy-meta-count">{packageData.reviews_count || 140}+ Celebrations</span>
            <span className="swiggy-meta-sep">·</span>
            <span className="swiggy-meta-location">📍 {packageData.city || 'Bhopal'}</span>
          </div>

          {packageData.description && (
            <p className="swiggy-desc-quote">"{packageData.description}"</p>
          )}
        </div>

        <div className="swiggy-pricing-cta-box">
          <div className="swiggy-price-header">
            <span className="swiggy-main-price">₹{basePrice.toLocaleString('en-IN')}</span>
            {origPrice > basePrice && (
              <span className="swiggy-strike-price">₹{origPrice.toLocaleString('en-IN')}</span>
            )}
            {baseDiscount > 0 && (
              <span className="swiggy-save-tag">Save {baseDiscount}%</span>
            )}
            <span className="swiggy-inclusive-tag">all inclusive</span>
          </div>

          <button className="swiggy-primary-cta-btn" onClick={onContinue}>
            Select Date & Book →
          </button>
        </div>
      </div>

      {/* ── HIGHLIGHT FEATURE PILLS ── */}
      <div className="swiggy-chips-strip">
        <span className="swiggy-feature-chip">🏠 Doorstep Setup</span>
        <span className="swiggy-feature-chip">⏱ {packageData.setup_time || '2–3 Hrs Setup'}</span>
        <span className="swiggy-feature-chip">🛡️ 100% On-Time Guarantee</span>
        <span className="swiggy-feature-chip">📸 Photo Ready</span>
        <span className="swiggy-feature-chip">⚡ ₹0 Advance Needed</span>
      </div>

      {/* ── SWIGGY "OFFERS FOR YOU" SECTION (EXACT REPLICA OF IMAGE 1) ── */}
      <div className="swiggy-offers-section">
        <h3 className="swiggy-offers-heading">Offers for you</h3>

        {/* Offers Tab Switcher */}
        <div className="swiggy-offers-tab-row">
          <button
            type="button"
            className={`swiggy-offers-tab${offersTab === 'prebooking' ? ' is-active' : ''}`}
            onClick={() => setOffersTab('prebooking')}
          >
            Pre-booking offers
          </button>
          <button
            type="button"
            className={`swiggy-offers-tab${offersTab === 'walkin' ? ' is-active' : ''}`}
            onClick={() => setOffersTab('walkin')}
          >
            Walk-in offers
          </button>
        </div>

        <div className="swiggy-offers-grid-layout">
          {/* Left Card: Swiggy ONE / Momanto Exclusive Card */}
          <div className="swiggy-one-exclusive-card">
            <div className="swiggy-one-badge-row">
              <span className="swiggy-one-badge">
                <span className="one-text">one</span> EXCLUSIVE
              </span>
            </div>

            <div className="swiggy-one-title-row" onClick={onOpenCouponsDrawer}>
              <h4 className="swiggy-one-main-offer">Flat {baseDiscount}% off on Total Bill &gt;</h4>
              <p className="swiggy-one-sub-offer">Available on Mon-Sun with booking fee: ₹0</p>
            </div>

            {/* Connected Sub-offer Pills with '+' */}
            <div className="swiggy-connected-cashback-row">
              <div className="swiggy-mini-offer-box">
                <span className="mini-icon">🪙</span>
                <div>
                  <strong>10% cashback</strong>
                  <p>On every bill payment</p>
                </div>
              </div>

              <div className="swiggy-connector-plus">+</div>

              <div className="swiggy-mini-offer-box">
                <span className="mini-icon">💳</span>
                <div>
                  <strong>Flat ₹200 off</strong>
                  <p>use HDFCCARDS</p>
                </div>
                <span className="swiggy-pager-dots">&lt; • &gt;</span>
              </div>
            </div>

            {/* Applied / Enter coupon box */}
            <div className="swiggy-coupon-action-bar">
              {appliedCoupon ? (
                <div className="swiggy-coupon-applied-pill">
                  <span>🎉 Coupon <strong>'{appliedCoupon.code}'</strong> applied (-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')})</span>
                  <button type="button" className="swiggy-remove-link" onClick={onRemoveCoupon}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="swiggy-inline-coupon-input-wrap">
                  <input
                    type="text"
                    placeholder="ENTER PROMO CODE (E.G. CELEBRATE28)"
                    value={customInputCode}
                    onChange={(e) => setCustomInputCode(e.target.value.toUpperCase())}
                    className="swiggy-inline-coupon-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customInputCode.trim()) {
                        onApplyCoupon(customInputCode.trim());
                        setCustomInputCode('');
                      }
                    }}
                    className="swiggy-inline-apply-btn"
                  >
                    APPLY
                  </button>
                </div>
              )}
            </div>

            {couponError && <p className="swiggy-coupon-err-msg">{couponError}</p>}
          </div>

          {/* Right Card: Dineout / Momanto Studio App Download & Support (matching Image 1) */}
          <div className="swiggy-dineout-qr-card">
            <h4 className="swiggy-dineout-title">Explore more ways to dine with</h4>
            <div className="swiggy-dineout-brand-row">
              <span className="dineout-logo-icon">🍽️</span>
              <span className="dineout-brand-name">Dineout</span>
            </div>

            <div className="swiggy-qr-code-box">
              {/* High-definition QR graphic */}
              <div className="swiggy-qr-matrix">
                <div className="qr-corner top-left" />
                <div className="qr-corner top-right" />
                <div className="qr-corner bottom-left" />
                <div className="qr-center-icon">🎉</div>
              </div>
            </div>

            <p className="swiggy-qr-subtext">Scan the QR code to download the app</p>
          </div>
        </div>
      </div>

      {/* ── ITEMIZED WHAT'S INCLUDED (SWIGGY MENU STYLE) ── */}
      <div className="swiggy-section-block">
        <div className="swiggy-block-header">
          <h3 className="swiggy-block-title">What's Included in this Celebration</h3>
          <span className="swiggy-count-badge">{inclusions.length} Items Included</span>
        </div>

        <div className="swiggy-inclusions-list">
          {inclusions.map((item, i) => (
            <div key={i} className="swiggy-inclusion-item">
              <div className="swiggy-inc-check">✓</div>
              <div className="swiggy-inc-text">
                <h4 className="swiggy-inc-label">{item}</h4>
                <p className="swiggy-inc-sub">Provided & arranged by verified planner</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTERACTIVE CELEBRATION ADD-ONS (SWIGGY MENU ITEMS) ── */}
      <div className="swiggy-section-block">
        <div className="swiggy-block-header">
          <div>
            <h3 className="swiggy-block-title">Add Celebration Add-ons</h3>
            <p className="swiggy-block-sub">Customise your party with extra surprises</p>
          </div>
          {selectedAddons.length > 0 && (
            <span className="swiggy-addon-active-pill">+{selectedAddons.length} Selected (+₹{addonsTotal})</span>
          )}
        </div>

        <div className="swiggy-addons-stack">
          {availableAddons.map((addon) => {
            const isSelected = selectedAddons.some((a) => a.id === addon.id);
            return (
              <div
                key={addon.id}
                onClick={() => onToggleAddon(addon)}
                className={`swiggy-addon-item-card${isSelected ? ' is-selected' : ''}`}
              >
                <div className="swiggy-addon-left">
                  <span className="swiggy-addon-emoji">{addon.emoji || '🎁'}</span>
                  <div>
                    <h4 className="swiggy-addon-name">{addon.name}</h4>
                    <p className="swiggy-addon-sub">{addon.sub || 'Optional celebration upgrade'}</p>
                  </div>
                </div>

                <div className="swiggy-addon-right">
                  <span className="swiggy-addon-price">+₹{addon.price}</span>
                  <button
                    type="button"
                    className={`swiggy-addon-add-btn${isSelected ? ' is-added' : ''}`}
                  >
                    {isSelected ? 'ADDED ✓' : 'ADD +'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SETUP SPECIFICATIONS & TIMELINE ── */}
      <div className="swiggy-section-block">
        <div className="swiggy-block-header">
          <h3 className="swiggy-block-title">Setup Specifications & Timeline</h3>
          <span className="swiggy-count-badge">Certified Setup</span>
        </div>

        <div className="swiggy-specs-grid">
          <div className="swiggy-spec-card">
            <span className="spec-icon">⏱️</span>
            <div>
              <p className="spec-title">Setup Duration</p>
              <p className="spec-sub">Planner arrives 2 hours before celebration</p>
            </div>
          </div>
          <div className="swiggy-spec-card">
            <span className="spec-icon">🏠</span>
            <div>
              <p className="spec-title">Venue Suitability</p>
              <p className="spec-sub">Living Room, Terrace, Garden, Café or Hall</p>
            </div>
          </div>
          <div className="swiggy-spec-card">
            <span className="spec-icon">⚡</span>
            <div>
              <p className="spec-title">Power Requirement</p>
              <p className="spec-sub">1 standard 3-pin plug point within 5m</p>
            </div>
          </div>
          <div className="swiggy-spec-card">
            <span className="spec-icon">🛡️</span>
            <div>
              <p className="spec-title">Safe Materials</p>
              <p className="spec-sub">Non-toxic metallic balloons & safe LED lights</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOMANTO 100% CELEBRATION PROMISE ── */}
      <div className="swiggy-section-block">
        <div className="swiggy-block-header">
          <h3 className="swiggy-block-title">Momanto 100% Celebration Promise</h3>
          <span className="swiggy-count-badge">Host Protection</span>
        </div>

        <div className="swiggy-promise-grid">
          <div className="swiggy-promise-tile">
            <span className="promise-icon">🛡️</span>
            <p className="promise-title">Verified Planners</p>
            <p className="promise-sub">Background checked & certified decor artists</p>
          </div>
          <div className="swiggy-promise-tile">
            <span className="promise-icon">⚡</span>
            <p className="promise-title">100% On-Time Setup</p>
            <p className="promise-sub">Ready before guest arrival or ₹500 refund</p>
          </div>
          <div className="swiggy-promise-tile">
            <span className="promise-icon">📞</span>
            <p className="promise-title">15-Min Planner Call</p>
            <p className="promise-sub">Direct call to confirm name & customization</p>
          </div>
          <div className="swiggy-promise-tile">
            <span className="promise-icon">❌</span>
            <p className="promise-title">Free Cancellation</p>
            <p className="promise-sub">100% full refund up to 24 hours before event</p>
          </div>
        </div>
      </div>

      <div style={{ height: '100px' }} />

      {/* ── STICKY BOTTOM BAR (SWIGGY STYLE) ── */}
      <div className="swiggy-sticky-bottom-bar">
        <div className="swiggy-sticky-left">
          <p className="swiggy-sticky-total">₹{finalPrice.toLocaleString('en-IN')}</p>
          <p className="swiggy-sticky-sub">
            {appliedCoupon ? `Saved ₹${couponDiscount} · ` : ''}Free Cancellation
          </p>
        </div>
        <button className="swiggy-sticky-cta" onClick={onContinue}>
          Select Date & Book →
        </button>
      </div>
    </div>
  );
}

/* ── STEP 2: Swiggy-Style Celebration Booking Form ── */
function StepForm({
  packageData,
  formData,
  selectedAddons,
  appliedCoupon,
  onChange,
  onSlotSelect,
  onLocationFetch,
  locationFetching,
  onSubmit,
  submitting,
  error,
}) {
  const [addressCategory, setAddressCategory] = useState('home');
  const [whatsappSynced, setWhatsappSynced] = useState(true);

  const timeSlots = [
    { label: 'Morning Setup', time: '10:00 AM – 01:00 PM', value: '10:00', badge: 'Day Event', icon: '🌅' },
    { label: 'Afternoon Slot', time: '02:00 PM – 05:00 PM', value: '14:00', badge: 'Family & Tea', icon: '☀️' },
    { label: 'Evening Prime', time: '06:30 PM – 09:30 PM', value: '18:30', badge: '🔥 Most Popular', icon: '🌆' },
    { label: 'Midnight Surprise', time: '11:30 PM – 12:30 AM', value: '23:30', badge: '✨ Surprise Entry', icon: '🌙' },
  ];

  const quickCustomizationTags = [
    { id: 'banner', label: '🏷️ Name on Banner', snippet: 'Name on banner: ""' },
    { id: 'theme_rosegold', label: '🎨 Rose Gold & White', snippet: 'Theme: Rose Gold & Metallic White' },
    { id: 'theme_royalblue', label: '🎨 Royal Blue & Silver', snippet: 'Theme: Royal Blue & Silver Chrome' },
    { id: 'theme_pastel', label: '🎨 Pastel Boho', snippet: 'Theme: Soft Pastel Macaron Balloons' },
    { id: 'age', label: '🎂 Milestone / Age', snippet: 'Age milestone: ""' },
    { id: 'surprise', label: '🤫 100% Secret Surprise', snippet: 'SURPRISE: Do not call the recipient, only call me!' },
    { id: 'timing', label: '🚪 Setup Before Guests', snippet: 'Please complete setup 30 mins before party time.' },
    { id: 'call', label: '📞 Call 15 Min Prior', snippet: 'Call 15 mins before arriving at venue for entry.' },
  ];

  const basePrice = Number(packageData.price) || 4999;
  const origPrice = packageData.original_price ? Number(packageData.original_price) : Math.round(basePrice * 1.35);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice + addonsTotal - couponDiscount);
  const totalSavings = (origPrice - basePrice) + couponDiscount + 499; // Included free delivery & setup fee savings

  const handleTagClick = (tag) => {
    const current = (formData.special_requests || '').trim();
    if (current.includes(tag.snippet)) {
      // Remove if already present
      const updated = current
        .replace(tag.snippet, '')
        .replace(/\n\n+/g, '\n')
        .trim();
      onChange({ target: { name: 'special_requests', value: updated } });
    } else {
      // Append snippet cleanly
      const updated = current ? `${current}\n• ${tag.snippet}` : `• ${tag.snippet}`;
      onChange({ target: { name: 'special_requests', value: updated } });
    }
  };

  const handlePhoneChange = (e) => {
    onChange(e);
    if (whatsappSynced) {
      onChange({ target: { name: 'customer_whatsapp', value: e.target.value } });
    }
  };

  const handleAddressTagSelect = (tag) => {
    setAddressCategory(tag);
  };

  const formatSelectedDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="swiggy-checkout-container">
      {/* ── PROGRESS BAR ── */}
      <div className="swiggy-progress-track">
        <div className="swiggy-progress-fill" />
      </div>

      {/* ── SWIGGY STORE / PLANNER BANNER RECAP ── */}
      <div className="swiggy-cart-recap-card">
        <div className="swiggy-cart-recap-main">
          {packageData.photos?.[0] ? (
            <img src={packageData.photos[0]} className="swiggy-cart-recap-img" alt={packageData.package_name} />
          ) : (
            <div className="swiggy-cart-recap-fallback">🎉</div>
          )}
          <div className="swiggy-cart-recap-details">
            <div className="swiggy-vendor-pill">
              <span className="dot-live" /> {packageData.business_name || 'Verified Momanto Studio'}
            </div>
            <h2 className="swiggy-cart-pkg-title">{packageData.package_name}</h2>
            <div className="swiggy-cart-meta">
              <span className="swiggy-rating-badge">★ {packageData.rating || '4.9'}</span>
              <span className="swiggy-meta-sep">·</span>
              <span className="swiggy-city-tag">📍 {packageData.city || 'Bhopal'}</span>
              {appliedCoupon && (
                <>
                  <span className="swiggy-meta-sep">·</span>
                  <span className="swiggy-coupon-chip">🏷️ {appliedCoupon.code} Applied</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="swiggy-cart-recap-pricing">
          <span className="swiggy-cart-total-label">Total to Pay</span>
          <span className="swiggy-cart-total-val">₹{finalPrice.toLocaleString('en-IN')}</span>
          {totalSavings > 0 && (
            <span className="swiggy-cart-savings-pill">Saving ₹{totalSavings.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>

      {error && (
        <div className="swiggy-alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} autoComplete="on" className="swiggy-checkout-form">
        {/* ── CARD 1: CONTACT & INVOICE DETAILS ── */}
        <div className="swiggy-section-card">
          <div className="swiggy-section-header">
            <div className="swiggy-header-left">
              <div className="swiggy-header-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                👤
              </div>
              <div>
                <h3 className="swiggy-header-title">1. Contact & Booking Details</h3>
                <p className="swiggy-header-sub">Used for booking pass, live updates & tax invoice</p>
              </div>
            </div>
            <span className="swiggy-step-badge">Required</span>
          </div>

          <div className="swiggy-fields-grid">
            {/* Full Name */}
            <div className="swiggy-input-group">
              <label className="swiggy-label">
                Full Name <span className="req">*</span>
              </label>
              <div className="swiggy-input-wrap">
                <span className="swiggy-input-icon">🙍‍♂️</span>
                <input
                  className="swiggy-text-input"
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={onChange}
                  placeholder="e.g. Rahul Sharma"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Mobile Number with +91 flag */}
            <div className="swiggy-input-group">
              <label className="swiggy-label">
                Mobile Number <span className="req">*</span>
              </label>
              <div className="swiggy-input-wrap">
                <div className="swiggy-phone-prefix">
                  <span className="flag-icon">🇮🇳</span>
                  <span className="code">+91</span>
                </div>
                <input
                  className="swiggy-text-input swiggy-phone-input"
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handlePhoneChange}
                  placeholder="98765 43210"
                  maxLength="10"
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* WhatsApp live updates checkbox & field */}
            <div className="swiggy-whatsapp-box">
              <div className="swiggy-whatsapp-row" onClick={() => setWhatsappSynced(!whatsappSynced)}>
                <input
                  type="checkbox"
                  checked={whatsappSynced}
                  onChange={(e) => {
                    setWhatsappSynced(e.target.checked);
                    if (e.target.checked) {
                      onChange({ target: { name: 'customer_whatsapp', value: formData.customer_phone } });
                    }
                  }}
                  id="wa-sync-check"
                  className="swiggy-checkbox"
                />
                <label htmlFor="wa-sync-check" className="swiggy-whatsapp-label">
                  <span className="wa-icon">🟢</span>
                  <span>Receive live decor setup photos & order updates on WhatsApp</span>
                </label>
              </div>

              {!whatsappSynced && (
                <div className="swiggy-input-wrap" style={{ marginTop: 10 }}>
                  <span className="swiggy-input-icon">💬</span>
                  <input
                    className="swiggy-text-input"
                    type="tel"
                    name="customer_whatsapp"
                    value={formData.customer_whatsapp}
                    onChange={onChange}
                    placeholder="Different WhatsApp Number (e.g. 9812345678)"
                  />
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="swiggy-input-group">
              <div className="swiggy-label-row">
                <label className="swiggy-label">Email Address</label>
                <span className="swiggy-label-optional">(For Instant Tax Invoice & Pass)</span>
              </div>
              <div className="swiggy-input-wrap">
                <span className="swiggy-input-icon">✉️</span>
                <input
                  className="swiggy-text-input"
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={onChange}
                  placeholder="e.g. rahul.sharma@gmail.com"
                  autoComplete="email"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 2: CELEBRATION VENUE / ADDRESS ── */}
        <div className="swiggy-section-card">
          <div className="swiggy-section-header">
            <div className="swiggy-header-left">
              <div className="swiggy-header-icon-box" style={{ background: '#FFF1F2', color: '#E11D48' }}>
                📍
              </div>
              <div>
                <h3 className="swiggy-header-title">2. Celebration Venue / Address</h3>
                <p className="swiggy-header-sub">Where should our decoration team set up?</p>
              </div>
            </div>
            <span className="swiggy-badge-green">🏠 Doorstep Setup</span>
          </div>

          {/* Address Category Selector */}
          <div className="swiggy-address-type-row">
            {[
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'work', label: 'Office / Work', icon: '🏢' },
              { id: 'hotel', label: 'Hotel / Banquet', icon: '🏨' },
              { id: 'other', label: 'Farmhouse / Other', icon: '✨' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`swiggy-addr-tag${addressCategory === cat.id ? ' selected' : ''}`}
                onClick={() => handleAddressTagSelect(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Venue Address Input + GPS Location Auto-detect */}
          <div className="swiggy-input-group" style={{ marginTop: 12 }}>
            <label className="swiggy-label">
              Complete Venue Address & Landmark <span className="req">*</span>
            </label>
            <div className="swiggy-location-input-container">
              <div className="swiggy-input-wrap swiggy-location-wrap">
                <span className="swiggy-input-icon">📍</span>
                <input
                  className="swiggy-text-input swiggy-location-input"
                  type="text"
                  name="event_location"
                  value={formData.event_location}
                  onChange={onChange}
                  placeholder="e.g. Flat 402, Tower B, Palm Meadows, Near City Center Mall, Bhopal"
                  required
                  autoComplete="street-address"
                />
              </div>

              <button
                type="button"
                className={`swiggy-gps-btn${locationFetching ? ' is-loading' : ''}`}
                onClick={onLocationFetch}
                disabled={locationFetching}
                title="Auto-detect current address via GPS"
              >
                {locationFetching ? (
                  <>
                    <span className="gps-spinner" />
                    <span>Detecting…</span>
                  </>
                ) : (
                  <>
                    <span className="gps-target-icon">🎯</span>
                    <span className="gps-btn-text">Detect GPS</span>
                  </>
                )}
              </button>
            </div>
            {locationFetching && (
              <div className="swiggy-gps-live-hint">
                <span className="pulse-dot" /> Detecting your accurate doorstep coordinates…
              </div>
            )}
          </div>
        </div>

        {/* ── CARD 3: DATE & TIME SLOT ── */}
        <div className="swiggy-section-card">
          <div className="swiggy-section-header">
            <div className="swiggy-header-left">
              <div className="swiggy-header-icon-box" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                🗓️
              </div>
              <div>
                <h3 className="swiggy-header-title">3. Celebration Date & Slot</h3>
                <p className="swiggy-header-sub">Choose your celebration day & convenient setup time</p>
              </div>
            </div>
            {formData.event_date && (
              <span className="swiggy-badge-orange">
                {formatSelectedDate(formData.event_date)}
              </span>
            )}
          </div>

          {/* Event Date Picker */}
          <div className="swiggy-input-group">
            <label className="swiggy-label">
              Select Celebration Date <span className="req">*</span>
            </label>
            <div className="swiggy-input-wrap">
              <span className="swiggy-input-icon">📅</span>
              <input
                className="swiggy-text-input swiggy-date-input"
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={onChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="swiggy-input-group" style={{ marginTop: 14 }}>
            <label className="swiggy-label">
              Select Setup Slot <span className="req">*</span>
            </label>
            <div className="swiggy-slots-grid">
              {timeSlots.map((ts) => {
                const isSelected = formData.event_time === ts.value;
                return (
                  <div
                    key={ts.value}
                    onClick={() => onSlotSelect(ts.value)}
                    className={`swiggy-slot-card${isSelected ? ' is-selected' : ''}`}
                  >
                    <div className="slot-top-row">
                      <div className="slot-icon-title">
                        <span className="slot-emoji">{ts.icon}</span>
                        <span className="slot-name">{ts.label}</span>
                      </div>
                      <div className={`slot-radio-circle${isSelected ? ' active' : ''}`} />
                    </div>

                    <p className="slot-timing">{ts.time}</p>

                    <div className="slot-bottom-meta">
                      <span className={`slot-badge${isSelected ? ' active' : ''}`}>{ts.badge}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CARD 4: CELEBRATION CUSTOMIZATION & SPECIAL INSTRUCTIONS (SWIGGY CHEF NOTE STYLE) ── */}
        <div className="swiggy-section-card">
          <div className="swiggy-section-header">
            <div className="swiggy-header-left">
              <div className="swiggy-header-icon-box" style={{ background: '#FAF5FF', color: '#9333EA' }}>
                ✨
              </div>
              <div>
                <h3 className="swiggy-header-title">4. Celebration Instructions & Theme Customization</h3>
                <p className="swiggy-header-sub">Decorator will customize the celebration strictly as per your instructions</p>
              </div>
            </div>
            <span className="swiggy-badge-purple">Customized</span>
          </div>

          {/* Quick-add suggestions tags (Swiggy cooking instruction style) */}
          <div className="swiggy-tags-container">
            <p className="swiggy-tags-hint">💡 Tap quick suggestions to add into instructions:</p>
            <div className="swiggy-chips-flex">
              {quickCustomizationTags.map((tag) => {
                const isApplied = (formData.special_requests || '').includes(tag.snippet);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`swiggy-chip-pill${isApplied ? ' chip-active' : ''}`}
                    onClick={() => handleTagClick(tag)}
                  >
                    <span>{tag.label}</span>
                    <span className="chip-plus">{isApplied ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Realistic Instruction Textarea */}
          <div className="swiggy-textarea-wrap" style={{ marginTop: 12 }}>
            <textarea
              className="swiggy-note-textarea"
              name="special_requests"
              value={formData.special_requests}
              onChange={onChange}
              placeholder='e.g. Please print "Happy 25th Birthday Aryan!" on the backdrop banner. Balloon colors: Pastel Blue & White. Please call my number before ringing doorbell so the surprise is not spoiled!'
              rows={4}
              maxLength={400}
            />

            <div className="swiggy-textarea-footer">
              <span className="swiggy-char-counter">
                {(formData.special_requests || '').length} / 400 characters
              </span>
              {formData.special_requests && (
                <button
                  type="button"
                  className="swiggy-clear-btn"
                  onClick={() => onChange({ target: { name: 'special_requests', value: '' } })}
                >
                  Clear Instructions
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── CARD 5: SWIGGY ITEMIZED BILL BREAKDOWN ── */}
        <div className="swiggy-section-card swiggy-bill-card">
          <div className="swiggy-section-header">
            <div className="swiggy-header-left">
              <div className="swiggy-header-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                🧾
              </div>
              <div>
                <h3 className="swiggy-header-title">5. Bill Details</h3>
                <p className="swiggy-header-sub">Transparent pricing with zero hidden charges</p>
              </div>
            </div>
            <span className="swiggy-badge-green">All Inclusive</span>
          </div>

          <div className="swiggy-bill-table">
            <div className="swiggy-bill-row">
              <span className="swiggy-bill-item-name">
                🎉 {packageData.package_name} (Base Package)
              </span>
              <span className="swiggy-bill-item-price">₹{basePrice.toLocaleString('en-IN')}</span>
            </div>

            {selectedAddons.map((addon) => (
              <div key={addon.id} className="swiggy-bill-row swiggy-bill-addon">
                <span className="swiggy-bill-item-name">
                  {addon.emoji} {addon.name}
                </span>
                <span className="swiggy-bill-item-price">+₹{addon.price?.toLocaleString('en-IN')}</span>
              </div>
            ))}

            <div className="swiggy-bill-row">
              <span className="swiggy-bill-item-name">
                🚚 Doorstep Decorator Setup & Teardown
              </span>
              <div className="swiggy-price-strike-wrap">
                <span className="strike-amount">₹499</span>
                <span className="free-tag">FREE</span>
              </div>
            </div>

            <div className="swiggy-bill-row">
              <span className="swiggy-bill-item-name">
                🛡️ Momanto 100% On-Time Guarantee
              </span>
              <span className="free-tag">FREE</span>
            </div>

            {appliedCoupon && (
              <div className="swiggy-bill-row swiggy-discount-highlight-row">
                <span className="swiggy-bill-item-name discount-color">
                  🎟️ Coupon Discount ({appliedCoupon.code})
                </span>
                <span className="swiggy-bill-item-price discount-color">
                  -₹{couponDiscount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Swiggy Tear Line */}
            <div className="swiggy-receipt-tear">
              <div className="tear-notch-left" />
              <div className="tear-dashed-line" />
              <div className="tear-notch-right" />
            </div>

            {/* Grand Total Row */}
            <div className="swiggy-bill-grand-row">
              <div>
                <span className="grand-total-label">To Pay</span>
                <p className="grand-total-sub">Includes all taxes, materials & vendor fee</p>
              </div>
              <div className="grand-total-value">
                ₹{finalPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {totalSavings > 0 && (
            <div className="swiggy-savings-celebration-strip">
              <span className="savings-emoji">🥳</span>
              <span className="savings-text">
                Hurray! You are saving <strong>₹{totalSavings.toLocaleString('en-IN')}</strong> on this celebration!
              </span>
            </div>
          )}
        </div>

        {/* ── CARD 6: SWIGGY PAYMENT METHOD SELECTOR ── */}
        <div className="swiggy-section-card">
          <div className="swiggy-section-header">
            <div className="swiggy-header-left">
              <div className="swiggy-header-icon-box" style={{ background: '#ECFEFF', color: '#0891B2' }}>
                💳
              </div>
              <div>
                <h3 className="swiggy-header-title">6. Choose Payment Method</h3>
                <p className="swiggy-header-sub">Safe & 256-Bit SSL Encrypted checkout</p>
              </div>
            </div>
            <span className="swiggy-badge-green">🔒 100% Secure</span>
          </div>

          <div className="swiggy-payment-methods-stack">
            {/* UPI Option */}
            <div
              onClick={() => onChange({ target: { name: 'payment_method', value: 'upi' } })}
              className={`swiggy-pay-card${formData.payment_method === 'upi' ? ' is-selected green-theme' : ''}`}
            >
              <div className="pay-card-header">
                <div className="pay-card-left">
                  <div className="pay-method-icon-box" style={{ background: '#DCFCE7', color: '#15803D' }}>
                    📱
                  </div>
                  <div>
                    <strong className="pay-method-title">UPI Instant Payment (Google Pay, PhonePe, Paytm)</strong>
                    <p className="pay-method-desc">Instant booking confirmation via UPI QR / VPA</p>
                  </div>
                </div>
                <div className="pay-card-right">
                  <span className="pay-badge-fast">⚡ FASTEST</span>
                  <div className={`pay-radio-dot${formData.payment_method === 'upi' ? ' active' : ''}`} />
                </div>
              </div>

              {formData.payment_method === 'upi' && (
                <div className="swiggy-upi-expanded-drawer">
                  <div className="upi-qr-box">
                    <div className="upi-qr-card">
                      <span style={{ fontSize: 36 }}>📱</span>
                      <span className="qr-pay-text">Scan & Pay ₹{finalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="upi-vpa-text">UPI ID: <strong>momanto.celebrations@icici</strong></p>
                  </div>
                  <div className="upi-app-pills">
                    <span className="upi-pill gpay">GPay</span>
                    <span className="upi-pill phonepe">PhonePe</span>
                    <span className="upi-pill paytm">Paytm</span>
                    <span className="upi-pill cred">CRED</span>
                  </div>
                </div>
              )}
            </div>

            {/* Credit / Debit Cards */}
            <div
              onClick={() => onChange({ target: { name: 'payment_method', value: 'cards' } })}
              className={`swiggy-pay-card${formData.payment_method === 'cards' ? ' is-selected blue-theme' : ''}`}
            >
              <div className="pay-card-header">
                <div className="pay-card-left">
                  <div className="pay-method-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    💳
                  </div>
                  <div>
                    <strong className="pay-method-title">Credit / Debit Cards & NetBanking</strong>
                    <p className="pay-method-desc">Visa, MasterCard, RuPay, Corporate & All Major Banks</p>
                  </div>
                </div>
                <div className="pay-card-right">
                  <div className={`pay-radio-dot${formData.payment_method === 'cards' ? ' active' : ''}`} />
                </div>
              </div>

              {formData.payment_method === 'cards' && (
                <div className="swiggy-cards-expanded-drawer">
                  <input
                    type="text"
                    placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                    maxLength="19"
                    className="swiggy-text-input card-num-input"
                  />
                  <div className="card-sub-inputs">
                    <input type="text" placeholder="MM/YY" maxLength="5" className="swiggy-text-input" />
                    <input type="password" placeholder="CVV" maxLength="4" className="swiggy-text-input cvv-input" />
                  </div>
                </div>
              )}
            </div>

            {/* Pay on Setup (COD) */}
            <div
              onClick={() => onChange({ target: { name: 'payment_method', value: 'cod' } })}
              className={`swiggy-pay-card${formData.payment_method === 'cod' ? ' is-selected orange-theme' : ''}`}
            >
              <div className="pay-card-header">
                <div className="pay-card-left">
                  <div className="pay-method-icon-box" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                    💵
                  </div>
                  <div>
                    <strong className="pay-method-title">Pay on Setup (Cash or UPI on Arrival)</strong>
                    <p className="pay-method-desc">Pay decorator only after 100% decoration completion at venue</p>
                  </div>
                </div>
                <div className="pay-card-right">
                  <span className="pay-badge-trust">🛡️ 100% TRUST</span>
                  <div className={`pay-radio-dot${formData.payment_method === 'cod' ? ' active' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 7: SAFETY & CANCELLATION GUARANTEES ── */}
        <div className="swiggy-trust-card">
          <div className="trust-point">
            <span className="trust-icon">🛡️</span>
            <div>
              <strong>100% Free Cancellation:</strong>
              <span> Full instant refund if cancelled 24 hours prior to event time.</span>
            </div>
          </div>
          <div className="trust-point">
            <span className="trust-icon">📞</span>
            <div>
              <strong>15-Minute Decorator Callback:</strong>
              <span> Your assigned verified planner will call you to confirm color nuances & entry details.</span>
            </div>
          </div>
        </div>
        {/* ── SUBMIT CTA BUTTON ── */}
        <div className="swiggy-submit-wrap">
          <button type="submit" className="swiggy-checkout-submit-btn" disabled={submitting}>
            {submitting ? (
              <span className="submit-spinner-wrap">
                <span className="btn-spinner" /> Reserving Celebration Setup…
              </span>
            ) : (
              <span className="submit-content-wrap">
                <span>🎉 Confirm & Place Celebration Booking</span>
                <span className="submit-arrow">₹{finalPrice.toLocaleString('en-IN')} →</span>
              </span>
            )}
          </button>
        </div>

        <div style={{ height: '40px' }} />
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN CHECKOUT COMPONENT
═══════════════════════════════════════════ */
export default function Checkout() {
  const router = useRouter();
  const { packageId } = router.query;

  const [step, setStep] = useState(1);
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locationFetching, setLocationFetching] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [showCouponsDrawer, setShowCouponsDrawer] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // User Profile & Auth states
  const [currentUser, setCurrentUser] = useState(null);
  const [latestOrder, setLatestOrder] = useState(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNewPassword, setAuthNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [authStep, setAuthStep] = useState(1);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_whatsapp: '',
    customer_email: '',
    customer_age: '25',
    event_date: '',
    event_time: '18:30',
    event_location: '',
    special_requests: '',
    payment_method: 'upi',
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('momanto_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u) {
          setCurrentUser(u);
          setFormData((prev) => ({
            ...prev,
            customer_name: u.name || prev.customer_name,
            customer_phone: u.phone || prev.customer_phone,
            customer_whatsapp: u.phone || prev.customer_whatsapp,
            customer_email: u.email || prev.customer_email,
          }));
        }
      }
      const savedOrder = localStorage.getItem('momanto_latest_order_info');
      if (savedOrder) {
        setLatestOrder(JSON.parse(savedOrder));
      }
    } catch {}

    if (packageId) fetchPackage();
  }, [packageId]);

  async function fetchPackage() {
    try {
      const res = await fetch(`/api/packages/${packageId}`);
      if (res.ok) {
        const data = await res.json();
        setPackageData(data);
      } else {
        const fallback = MOCK_PACKAGES_MAP[packageId] || MOCK_PACKAGES_MAP.p1;
        setPackageData(fallback);
      }
    } catch {
      const fallback = MOCK_PACKAGES_MAP[packageId] || MOCK_PACKAGES_MAP.p1;
      setPackageData(fallback);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    try {
      localStorage.removeItem('momanto_user');
      localStorage.removeItem('momanto_token');
      localStorage.removeItem('momanto_customer_phone');
      localStorage.removeItem('momanto_customer_name');
      localStorage.removeItem('momanto_latest_order_id');
      localStorage.removeItem('momanto_latest_order_info');
    } catch {}
    setCurrentUser(null);
    setLatestOrder(null);
    setShowProfileDrawer(false);
  }

  function handleDismissOrder() {
    try {
      localStorage.removeItem('momanto_latest_order_id');
      localStorage.removeItem('momanto_latest_order_info');
    } catch {}
    setLatestOrder(null);
  }

  function handleAuthSuccess(userData, token) {
    if (userData) {
      localStorage.setItem('momanto_user', JSON.stringify(userData));
      if (userData.phone) localStorage.setItem('momanto_customer_phone', userData.phone);
      if (userData.name) localStorage.setItem('momanto_customer_name', userData.name);
      setCurrentUser(userData);
      setFormData((prev) => ({
        ...prev,
        customer_name: userData.name || prev.customer_name,
        customer_phone: userData.phone || prev.customer_phone,
        customer_whatsapp: userData.phone || prev.customer_whatsapp,
        customer_email: userData.email || prev.customer_email,
      }));
    }
    if (token) localStorage.setItem('momanto_token', token);
    setShowAuthModal(false);
    setShowProfileDrawer(false);
    setAuthStep(1);
    setAuthPassword('');
    setAuthNewPassword('');
    setAuthOtp('');
    setAuthError('');
    triggerCelebrationEffects();
  }

  // ── AUTH: LOGIN WITH PASSWORD (ZERO SMS COST) ──
  async function handleLogin(e) {
    if (e) e.preventDefault();
    setAuthError('');
    if (!authPhone.trim()) {
      setAuthError('Please enter your mobile number or email');
      return;
    }
    if (!authPassword) {
      setAuthError('Please enter your password');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: authPhone.trim(),
          password: authPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed. Please check your credentials.');

      handleAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  // ── AUTH: REGISTER WITH PASSWORD (ZERO SMS COST) ──
  async function handleRegister(e) {
    if (e) e.preventDefault();
    setAuthError('');
    if (!authName.trim()) {
      setAuthError('Please enter your full name');
      return;
    }
    const clean = authPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setAuthError('Please enter a valid email address');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName.trim(),
          phone: clean.slice(-10),
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      handleAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  // ── AUTH: FORGOT PASSWORD - SEND RESET OTP ──
  async function handleForgotSendOtp(e) {
    if (e) e.preventDefault();
    const clean = authPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setAuthError('Please enter your registered 10-digit mobile number');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code');

      setAuthStep(2);
      setOtpTimer(60);
      setAuthSuccessMsg(data.message || `Reset code sent to +91 ${clean.slice(-10)}`);
      setAuthOtp('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  // ── AUTH: FORGOT PASSWORD - RESET & LOGIN ──
  async function handleForgotReset(e) {
    if (e) e.preventDefault();
    if (!authOtp || authOtp.trim().length < 4) {
      setAuthError('Please enter the 4-digit verification code');
      return;
    }
    if (!authNewPassword || authNewPassword.length < 6) {
      setAuthError('New password must be at least 6 characters');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: authPhone.replace(/\D/g, '').slice(-10),
          otp: authOtp.trim(),
          new_password: authNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      handleAuthSuccess(data.user, data.token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function playCouponSound(enabled = true) {
    if (!enabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.1, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.22, dur: 0.25 }, // G5
        { freq: 1046.50, time: 0.35, dur: 0.4 }, // C6
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.time);
        osc.stop(ctx.currentTime + n.time + n.dur);
      });
    } catch {}
  }

  function playOrderPlacedSound(enabled = true) {
    if (!enabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [
        { freq: 440.00, time: 0.0, dur: 0.15 }, // A4
        { freq: 554.37, time: 0.15, dur: 0.15 }, // C#5
        { freq: 659.25, time: 0.30, dur: 0.2 }, // E5
        { freq: 880.00, time: 0.48, dur: 0.5 }, // A5
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

  function triggerCelebrationEffects() {
    setConfettiActive(true);
    playCouponSound(soundEnabled);
    setTimeout(() => setConfettiActive(false), 2500);
  }

  // Available coupons list - ONLY planner-configured & verified coupons
  const getAvailableCoupons = useCallback(() => {
    if (!packageData) return [];
    const baseP = Number(packageData?.price) || 4999;
    const list = [];

    // 1. Planner's custom coupon code (if set by planner)
    if (packageData.coupon_code) {
      const code = packageData.coupon_code.trim().toUpperCase();
      let disc = 0;
      if (packageData.coupon_discount) {
        disc = Number(packageData.coupon_discount) <= 100
          ? Math.round((baseP * Number(packageData.coupon_discount)) / 100)
          : Math.round(Number(packageData.coupon_discount));
      } else if (packageData.discount_percent) {
        disc = Math.round((baseP * Number(packageData.discount_percent)) / 100);
      } else {
        disc = 500;
      }
      list.push({
        code,
        title: `Planner Special Code ${code}`,
        desc: `Exclusive coupon created by ${packageData?.business_name || 'Planner'}`,
        discountAmount: disc,
        minOrder: 0,
      });
    }

    // 2. Planner's percentage discount coupon
    const plannerDisc = packageData?.discount_percent || 0;
    if (plannerDisc > 0) {
      const discAmt = Math.round((baseP * plannerDisc) / 100);
      const code = `CELEBRATE${plannerDisc}`;
      if (!list.some(c => c.code === code)) {
        list.push({
          code,
          title: `Planner ${plannerDisc}% OFF`,
          desc: `Special celebration discount offered by ${packageData?.business_name || 'Studio'}`,
          discountAmount: discAmt,
          minOrder: 0,
        });
      }
    }

    // 3. Fallback standard platform voucher ONLY if planner set no codes
    if (list.length === 0) {
      list.push({
        code: 'MOMANTO500',
        title: 'Flat ₹500 Celebration Discount',
        desc: 'Save flat ₹500 on all doorstep celebration setups',
        discountAmount: 500,
        minOrder: 1000,
      });
    }

    return list;
  }, [packageData]);

  const handleApplyCoupon = useCallback(
    (codeToApply) => {
      setCouponError('');
      const code = (codeToApply || '').trim().toUpperCase();
      if (!code) {
        setCouponError('Please enter a coupon code');
        return;
      }

      const allCoupons = getAvailableCoupons();
      const found = allCoupons.find((c) => c.code.toUpperCase() === code);

      if (found) {
        setAppliedCoupon(found);
        setCouponError('');
        setShowCouponsDrawer(false);
        triggerCelebrationEffects();
      } else {
        const percentMatch = code.match(/^CELEBRATE(\d+)$/);
        if (percentMatch) {
          const pct = parseInt(percentMatch[1], 10);
          const baseP = Number(packageData?.price) || 4999;
          const discAmt = Math.round((baseP * pct) / 100);
          const customCoupon = {
            code,
            title: `Special ${pct}% OFF`,
            desc: `Celebration promotional coupon`,
            discountAmount: discAmt,
            minOrder: 0,
          };
          setAppliedCoupon(customCoupon);
          setShowCouponsDrawer(false);
          triggerCelebrationEffects();
        } else {
          setCouponError(`❌ Coupon "${code}" is invalid or not applicable for this celebration.`);
        }
      }
    },
    [getAvailableCoupons, packageData, soundEnabled]
  );

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError('');
  }, []);

  function handleToggleAddon(addon) {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        playCouponSound(soundEnabled);
        return [...prev, addon];
      }
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSlotSelect(slotObj) {
    setFormData((prev) => ({
      ...prev,
      event_time: slotObj.time,
      slot_label: slotObj.title,
    }));
  }

  function fetchCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocationFetching(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.display_name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          setFormData((prev) => ({
            ...prev,
            event_location: addr,
          }));
        } catch {
          setFormData((prev) => ({
            ...prev,
            event_location: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));
        } finally {
          setLocationFetching(false);
        }
      },
      () => {
        alert('Could not fetch location. Please enter your venue address manually.');
        setLocationFetching(false);
      }
    );
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError('');

    if (!formData.customer_name?.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.customer_phone?.trim() || formData.customer_phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.event_date) {
      setError('Please choose your celebration date');
      return;
    }
    if (!formData.event_location?.trim()) {
      setError('Please provide the complete celebration venue address');
      return;
    }

    setSubmitting(true);

    const basePrice = Number(packageData?.price) || 4999;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalPrice = Math.max(0, basePrice + addonsTotal - couponDiscount);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageData?.package_id || packageId,
          package_name: packageData?.package_name,
          business_name: packageData?.business_name,
          customer_name: formData.customer_name.trim(),
          customer_phone: formData.customer_phone.trim(),
          customer_whatsapp: formData.customer_whatsapp || formData.customer_phone.trim(),
          customer_email: formData.customer_email || '',
          event_date: formData.event_date,
          event_time: formData.event_time || '18:30',
          event_location: formData.event_location.trim(),
          special_requests: formData.special_requests || '',
          occasion: ((packageData?.package_name || '') + ' ' + (packageData?.occasion_tags || '') + ' ' + (formData.special_requests || '')).toLowerCase().includes('birthday') ? 'Birthday' : 'Celebration',
          selected_addons: selectedAddons,
          coupon_code: appliedCoupon?.code || null,
          discount_amount: couponDiscount,
          total_amount: finalPrice,
          payment_method: formData.payment_method || 'upi',
          status: 'confirmed',
        }),
      });

      const data = await res.json();
      const finalOrderId = data.order_id || `MOM${Date.now()}`;

      const isBirthdayCelebration = (
        (packageData?.package_name || '').toLowerCase().includes('birthday') ||
        (packageData?.package_name || '').toLowerCase().includes('bday') ||
        (packageData?.occasion_tags || '').toLowerCase().includes('birthday') ||
        (packageData?.description || '').toLowerCase().includes('birthday') ||
        (formData.special_requests || '').toLowerCase().includes('birthday')
      );

      try {
        localStorage.setItem('momanto_is_birthday_order', isBirthdayCelebration ? 'true' : 'false');
      } catch {}

      if (isBirthdayCelebration && soundEnabled) {
        try {
          if (typeof window !== 'undefined') {
            if (window.__momantoCelebrationAudio) {
              window.__momantoCelebrationAudio.pause();
            }
            const bdayAudio = new Audio('/sounds/Just_for_You_Today.mp3');
            bdayAudio.volume = 0.85;
            window.__momantoCelebrationAudio = bdayAudio;
            const playPromise = bdayAudio.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          }
        } catch (err) {
          console.log('Birthday audio error on checkout gesture:', err);
        }
      } else {
        playOrderPlacedSound(soundEnabled);
      }

      try {
        localStorage.setItem('momanto_latest_order_id', finalOrderId);
        localStorage.setItem(
          'momanto_latest_order_info',
          JSON.stringify({
            order_id: finalOrderId,
            package_name: packageData?.package_name || 'Celebration Setup',
            business_name: packageData?.business_name || 'Verified Planner',
            occasion: isBirthdayCelebration ? 'Birthday' : 'Celebration',
            occasion_tags: packageData?.occasion_tags || '',
            event_date: formData.event_date,
            event_time: formData.event_time,
            total_amount: finalPrice,
            applied_coupon: appliedCoupon?.code || null,
          })
        );
      } catch {}

      router.push(`/order-success/${finalOrderId}`);
    } catch {
      const fallbackOrderId = `MOM${Date.now()}`;
      try {
        localStorage.setItem('momanto_latest_order_id', fallbackOrderId);
      } catch {}
      router.push(`/order-success/${fallbackOrderId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Celebration… | Momanto</title>
        </Head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <Navbar
          step={1}
          onBack={() => {}}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          currentUser={currentUser}
          onOpenProfile={() => setShowProfileDrawer(true)}
        />
        <div className="center-state">
          <div className="loader-ring" />
          <p className="loading-text">Loading package details…</p>
        </div>
      </>
    );
  }

  const availableCoupons = getAvailableCoupons();

  return (
    <>
      <Head>
        <title>
          {step === 1
            ? `${packageData.package_name} | Momanto Celebrations`
            : `Book ${packageData.package_name} | Momanto`}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <ConfettiOverlay active={confettiActive} />

      <Navbar
        step={step}
        onBack={() => setStep(1)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        currentUser={currentUser}
        onOpenProfile={() => setShowProfileDrawer(true)}
      />

      <div className="step-bar">
        <div className={`step-dot${step >= 1 ? ' on' : ''}`}>{step > 1 ? '✓' : '1'}</div>
        <div className={`step-line${step >= 2 ? ' on' : ''}`} />
        <div className={`step-dot${step >= 2 ? ' on' : ''}`}>2</div>
      </div>

      <div className="page-wrap">
        {step === 1 ? (
          <StepDetails
            packageData={packageData}
            onContinue={() => setStep(2)}
            selectedAddons={selectedAddons}
            onToggleAddon={handleToggleAddon}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            onOpenCouponsDrawer={() => setShowCouponsDrawer(true)}
            couponError={couponError}
            currentUser={currentUser}
          />
        ) : (
          <StepForm
            packageData={packageData}
            formData={formData}
            selectedAddons={selectedAddons}
            appliedCoupon={appliedCoupon}
            onChange={handleChange}
            onSlotSelect={handleSlotSelect}
            onLocationFetch={fetchCurrentLocation}
            locationFetching={locationFetching}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        )}
      </div>

      {/* ── VIEW ALL COUPONS MODAL (SWIGGY / ZOMATO DRAWER) ── */}
      {showCouponsDrawer && (
        <div className="coupons-modal-overlay" onClick={() => setShowCouponsDrawer(false)}>
          <div className="coupons-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="coupons-sheet-head">
              <div>
                <h3 className="coupons-sheet-title">Available Celebration Coupons</h3>
                <p className="coupons-sheet-sub">Apply coupons for extra instant savings</p>
              </div>
              <button className="coupons-sheet-close" onClick={() => setShowCouponsDrawer(false)}>
                ✕
              </button>
            </div>

            <div className="coupons-list">
              {availableCoupons.map((c) => {
                const isThisApplied = appliedCoupon?.code === c.code;
                return (
                  <div key={c.code} className={`coupon-tile${isThisApplied ? ' applied' : ''}`}>
                    <div className="coupon-tile-left">
                      <div className="coupon-code-badge">{c.code}</div>
                      <h4 className="coupon-tile-title">{c.title}</h4>
                      <p className="coupon-tile-desc">{c.desc}</p>
                    </div>

                    <button
                      type="button"
                      className={`coupon-apply-action-btn${isThisApplied ? ' is-applied' : ''}`}
                      onClick={() => {
                        if (isThisApplied) {
                          handleRemoveCoupon();
                        } else {
                          handleApplyCoupon(c.code);
                        }
                      }}
                    >
                      {isThisApplied ? 'APPLIED ✓' : 'APPLY'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════ SWIGGY USER & PLANNER PROFILE DRAWER ════ */}
      {showProfileDrawer && (
        <div className="drawer-overlay" onClick={() => setShowProfileDrawer(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Peach Top Header with User Info or Guest Login Prompt */}
            <div className="drawer-header-peach">
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="drawer-close-btn"
                aria-label="Close Drawer"
              >
                ✕
              </button>

              {currentUser ? (
                <div>
                  <div style={{ display: 'inline-block', background: '#FEF08A', color: '#854D0E', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4, marginBottom: 6 }}>
                    👑 VERIFIED HOST
                  </div>
                  <h2 className="user-name-title">{currentUser.name}</h2>
                  <p className="user-contact-sub">+91 {currentUser.phone} · {currentUser.email || 'No email added'}</p>
                </div>
              ) : (
                <div>
                  <h2 className="user-name-title">Welcome, Guest! 👋</h2>
                  <p className="user-contact-sub" style={{ marginBottom: 12 }}>
                    Log in with mobile OTP to manage bookings & unlock ₹500 coupons
                  </p>
                  <button
                    onClick={() => {
                      setShowProfileDrawer(false);
                      setAuthStep(1);
                      setAuthError('');
                      setShowAuthModal(true);
                    }}
                    style={{
                      background: 'var(--swiggy-orange)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 900,
                      padding: '8px 18px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(252,128,25,0.4)',
                    }}
                  >
                    ⚡ Login / Register with OTP
                  </button>
                </div>
              )}
            </div>

            {/* 📍 AUTOMATIC ACTIVE CELEBRATION TRACKER CARD (If order exists) */}
            {latestOrder && (
              <div
                onClick={() => {
                  setShowProfileDrawer(false);
                  router.push(`/track/${latestOrder.order_id}`);
                }}
                style={{
                  margin: '14px 20px 0',
                  background: 'linear-gradient(135deg, #0A1633 0%, #152A56 100%)',
                  border: '1.5px solid #F59E0B',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 6px 18px rgba(10, 22, 51, 0.25)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E', display: 'inline-block' }} />
                    <span style={{ fontSize: 10.5, fontWeight: 900, color: '#4ADE80', textTransform: 'uppercase', letterSpacing: 0.5 }}>Live Order Active</span>
                  </div>
                  <h4 style={{ fontSize: 13.5, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{latestOrder.package_name || 'Celebration Booking'}</h4>
                  <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>ID: {latestOrder.order_id}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: '#0A1633', background: '#FFD13B', padding: '6px 12px', borderRadius: 8, boxShadow: '0 2px 8px rgba(255,209,59,0.4)' }}>
                    Track Live ➔
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismissOrder();
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: '#CBD5E1',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                    title="Dismiss / Clear Order"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Momanto Celebration Pass Card */}
            <div className="momanto-one-card">
              <div>
                <span className="one-badge">MOMANTO CLUB</span>
                <h4 style={{ fontSize: 14, fontWeight: 900, color: '#1C1C1C' }}>₹500 saved on bookings</h4>
                <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Exclusive planner priority & ₹0 convenience fee</p>
              </div>
              <span style={{ fontSize: 20 }}>👑</span>
            </div>

            {/* 4 Quick Tiles */}
            <div className="drawer-tiles-grid">
              <div className="drawer-tile-btn" onClick={() => alert('Saved Addresses: Home, Office, Venues in Bhopal')}>
                <span className="dtile-icon">📍</span>
                <span className="dtile-label">Saved Address</span>
              </div>
              <div className="drawer-tile-btn" onClick={() => alert('Payment Modes: UPI, Cards, NetBanking, Pay on Setup')}>
                <span className="dtile-icon">💳</span>
                <span className="dtile-label">Payment Modes</span>
              </div>
              <div
                className="drawer-tile-btn"
                onClick={() => {
                  setShowProfileDrawer(false);
                  if (latestOrder) {
                    router.push(`/track/${latestOrder.order_id}`);
                  } else {
                    alert('No active celebration found to track.');
                  }
                }}
              >
                <span className="dtile-icon">🔄</span>
                <span className="dtile-label">{latestOrder ? 'Track Order 🟢' : 'Track Order'}</span>
              </div>
              <div className="drawer-tile-btn" onClick={() => alert('Momanto Wallet Balance: ₹500.00')}>
                <span className="dtile-icon">👛</span>
                <span className="dtile-label">Momanto Wallet</span>
              </div>
            </div>

            {/* List of Menu Options */}
            <div className="drawer-menu-list">
              <Link href="/planner/login" className="drawer-menu-item" onClick={() => setShowProfileDrawer(false)}>
                <div className="drawer-item-left">
                  <span className="ditem-icon">👨‍🎨</span>
                  <div>
                    <span className="ditem-text">Event Planner Portal</span>
                    <p style={{ fontSize: 11, color: 'var(--swiggy-green)', fontWeight: 700 }}>Log in to accept customer orders & manage packages</p>
                  </div>
                </div>
                <span className="ditem-arrow">→</span>
              </Link>

              {latestOrder && (
                <div
                  className="drawer-menu-item"
                  onClick={() => {
                    setShowProfileDrawer(false);
                    router.push(`/track/${latestOrder.order_id}`);
                  }}
                >
                  <div className="drawer-item-left">
                    <span className="ditem-icon">📍</span>
                    <div>
                      <span className="ditem-text">Track Live Order</span>
                      <p style={{ fontSize: 11, color: 'var(--swiggy-orange-hover)', fontWeight: 800 }}>
                        Active: {latestOrder.package_name} ({latestOrder.order_id})
                      </p>
                    </div>
                  </div>
                  <span className="ditem-arrow">›</span>
                </div>
              )}

              <div
                className="drawer-menu-item"
                onClick={() => {
                  setShowProfileDrawer(false);
                  setShowCouponsDrawer(true);
                }}
              >
                <div className="drawer-item-left">
                  <span className="ditem-icon">🎟️</span>
                  <span className="ditem-text">My Vouchers & Offers</span>
                </div>
                <span className="ditem-arrow">›</span>
              </div>

              <a href="https://wa.me/916204507166" target="_blank" rel="noreferrer" className="drawer-menu-item">
                <div className="drawer-item-left">
                  <span className="ditem-icon">💬</span>
                  <span className="ditem-text">WhatsApp Celebration Help (24/7)</span>
                </div>
                <span className="ditem-arrow">›</span>
              </a>

              <div className="drawer-menu-item" onClick={() => alert('Momanto 100% On-Time Guarantee: Full refund if decorator team is late.')}>
                <div className="drawer-item-left">
                  <span className="ditem-icon">🛡️</span>
                  <span className="ditem-text">100% On-Time Guarantee & Safety</span>
                </div>
                <span className="ditem-arrow">›</span>
              </div>

              {currentUser && (
                <div
                  className="drawer-menu-item"
                  onClick={handleLogout}
                  style={{ borderTop: '2px dashed #F1F1F4', marginTop: 12, cursor: 'pointer' }}
                >
                  <div className="drawer-item-left">
                    <span className="ditem-icon">🚪</span>
                    <span className="ditem-text" style={{ color: '#EF4444' }}>Log Out ({currentUser.name})</span>
                  </div>
                  <span className="ditem-arrow" style={{ color: '#EF4444' }}>›</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ CUSTOMER OTP LOGIN & REGISTRATION MODAL ════ */}
      {showAuthModal && (
        <div className="coupons-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAuthModal(false)}
              className="drawer-close-btn"
              style={{ position: 'absolute', top: 16, right: 16 }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 32 }}>🎉</span>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--swiggy-black)', marginTop: 6 }}>
                {authTab === 'forgot'
                  ? (authStep === 1 ? 'Reset Password 🔑' : 'Set New Password 🔐')
                  : authTab === 'login'
                    ? 'Login to Momanto 👋'
                    : 'Create Your Account 🎉'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--swiggy-muted)', fontWeight: 600, marginTop: 2 }}>
                {authTab === 'forgot'
                  ? (authStep === 1
                    ? 'Enter your registered mobile number for reset OTP'
                    : `Enter code sent to +91 ${authPhone.slice(-10)} and create new password`)
                  : authTab === 'login'
                    ? 'Login with your mobile/email and password'
                    : 'Register with Name, Mobile, Email & Password'}
              </p>
            </div>

            {authError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, marginBottom: 12, textAlign: 'center' }}>
                ⚠️ {authError}
              </div>
            )}

            {authSuccessMsg && (
              <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#166534', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, marginBottom: 12, textAlign: 'center' }}>
                ✅ {authSuccessMsg}
              </div>
            )}

            {authTab !== 'forgot' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError('');
                      setAuthSuccessMsg('');
                    }}
                    style={{
                      padding: '8px',
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: 8,
                      border: 'none',
                      background: authTab === 'login' ? '#fff' : 'transparent',
                      color: authTab === 'login' ? 'var(--swiggy-orange)' : 'var(--swiggy-muted)',
                      cursor: 'pointer',
                      boxShadow: authTab === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    ⚡ Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setAuthError('');
                      setAuthSuccessMsg('');
                    }}
                    style={{
                      padding: '8px',
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: 8,
                      border: 'none',
                      background: authTab === 'register' ? '#fff' : 'transparent',
                      color: authTab === 'register' ? 'var(--swiggy-orange)' : 'var(--swiggy-muted)',
                      cursor: 'pointer',
                      boxShadow: authTab === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    📝 Register
                  </button>
                </div>

                {authTab === 'login' ? (
                  /* ── TAB 1: LOGIN WITH PASSWORD (ZERO SMS COST) ── */
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Mobile Number or Email *
                      </label>
                      <input
                        type="text"
                        placeholder="10-digit mobile or email"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 13.5, fontWeight: 700, outline: 'none' }}
                        autoFocus
                        required
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase' }}>
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab('forgot');
                            setAuthStep(1);
                            setAuthError('');
                            setAuthSuccessMsg('');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--swiggy-orange)', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          style={{ width: '100%', padding: '11px 36px 11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 13.5, fontWeight: 700, outline: 'none' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || !authPhone.trim() || !authPassword}
                      style={{
                        background: 'var(--swiggy-orange)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        padding: '13px',
                        fontSize: 14,
                        fontWeight: 900,
                        cursor: authLoading ? 'wait' : 'pointer',
                        marginTop: 4,
                        boxShadow: '0 4px 14px rgba(252,128,25,0.35)',
                      }}
                    >
                      {authLoading ? 'Logging In…' : 'Log In to Momanto →'}
                    </button>
                  </form>
                ) : (
                  /* ── TAB 2: REGISTER WITH NAME, PHONE, EMAIL, PASSWORD ── */
                  <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none' }}
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        10-Digit Mobile Number *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #CBD5E1', borderRadius: 10, padding: '0 10px' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--swiggy-black)', paddingRight: 6, borderRight: '1px solid #CBD5E1' }}>
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="98XXXXXXXX"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ''))}
                          style={{ flex: 1, padding: '10px 8px', border: 'none', outline: 'none', fontSize: 13, fontWeight: 800 }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Create Password * (min 6 characters)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          style={{ width: '100%', padding: '10px 36px 10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || !authName.trim() || authPhone.replace(/\D/g, '').length < 10 || !authEmail.trim() || authPassword.length < 6}
                      style={{
                        background: 'var(--swiggy-orange)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        padding: '12px',
                        fontSize: 13.5,
                        fontWeight: 900,
                        cursor: authLoading ? 'wait' : 'pointer',
                        marginTop: 4,
                        boxShadow: '0 4px 14px rgba(252,128,25,0.35)',
                      }}
                    >
                      {authLoading ? 'Creating Account…' : 'Create Free Account & Continue →'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              /* ── FORGOT PASSWORD FLOW (OTP IS ONLY SENT HERE) ── */
              <div>
                {authStep === 1 ? (
                  <form onSubmit={handleForgotSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Registered 10-Digit Mobile Number *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #CBD5E1', borderRadius: 10, padding: '0 10px' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--swiggy-black)', paddingRight: 6, borderRight: '1px solid #CBD5E1' }}>
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="98XXXXXXXX"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ''))}
                          style={{ flex: 1, padding: '11px 8px', border: 'none', outline: 'none', fontSize: 14, fontWeight: 800 }}
                          required
                          autoFocus
                        />
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--swiggy-muted)', marginTop: 4 }}>
                        We will send a 4-digit verification code to this number via SMS & WhatsApp.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || authPhone.replace(/\D/g, '').length < 10}
                      style={{
                        background: 'var(--swiggy-orange)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        padding: '13px',
                        fontSize: 14,
                        fontWeight: 900,
                        cursor: authLoading ? 'wait' : 'pointer',
                        boxShadow: '0 4px 14px rgba(252,128,25,0.35)',
                      }}
                    >
                      {authLoading ? 'Sending Reset Code…' : 'Send Reset Code (OTP) →'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('login');
                        setAuthError('');
                        setAuthSuccessMsg('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--swiggy-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
                    >
                      ← Back to Login
                    </button>
                  </form>
                ) : (
                  /* FORGOT PASSWORD STEP 2 */
                  <form onSubmit={handleForgotReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF3E9', padding: '8px 12px', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--swiggy-orange)' }}>
                        📱 +91 {authPhone.slice(-10)}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setAuthStep(1); setAuthError(''); }}
                        style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-orange)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block', textAlign: 'center' }}>
                        Enter 4-Digit Reset OTP Code *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="• • • •"
                        value={authOtp}
                        onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid var(--swiggy-orange)', fontSize: 20, fontWeight: 900, textAlign: 'center', letterSpacing: 6, outline: 'none' }}
                        autoFocus
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--swiggy-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Set New Password * (min 6 characters)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={authNewPassword}
                          onChange={(e) => setAuthNewPassword(e.target.value)}
                          style={{ width: '100%', padding: '11px 36px 11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 13.5, fontWeight: 700, outline: 'none' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || authOtp.length < 4 || authNewPassword.length < 6}
                      style={{
                        background: '#16A34A',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        padding: '13px',
                        fontSize: 14,
                        fontWeight: 900,
                        cursor: authLoading ? 'wait' : 'pointer',
                        boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
                      }}
                    >
                      {authLoading ? 'Resetting…' : 'Reset Password & Log In ✓'}
                    </button>

                    <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--swiggy-muted)', fontWeight: 700 }}>
                      {otpTimer > 0 ? (
                        <span>Resend OTP in <strong>{otpTimer}s</strong></span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleForgotSendOtp}
                          style={{ background: 'none', border: 'none', color: 'var(--swiggy-orange)', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          🔄 Resend Reset Code
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('login');
                        setAuthStep(1);
                        setAuthError('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--swiggy-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
                    >
                      ← Back to Login
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const css = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :root {
    --swiggy-orange: #FC8019;
    --swiggy-orange-hover: #E55A00;
    --swiggy-black: #02060C;
    --swiggy-dark: #1C1C24;
    --swiggy-muted: #686B78;
    --swiggy-sub: #93959F;
    --swiggy-border: #E8E8E8;
    --swiggy-bg: #F4F6F8;
    --swiggy-search-bg: #F0F0F5;
    --swiggy-green: #1BA672;
    --swiggy-green-bg: #DCFCE7;
    --swiggy-coral: #FF5200;
    --swiggy-card-shadow: 0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  body {
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #FFFFFF;
    color: var(--swiggy-black);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    letter-spacing: -0.1px;
  }
  a { text-decoration: none; color: inherit; }

  /* ═══════════════════════════════════════════════════════
     SWIGGY TOP HEADER / NAVBAR (MATCHING IMAGE 1)
  ═══════════════════════════════════════════════════════ */
  .swiggy-nav {
    position: sticky;
    top: 0;
    z-index: 500;
    background: #FFFFFF;
    border-bottom: 1px solid var(--swiggy-border);
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .swiggy-nav-inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .swiggy-nav-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
  }
  .swiggy-brand-logo-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .swiggy-logo-icon {
    font-size: 24px;
    display: inline-block;
    filter: drop-shadow(0 2px 4px rgba(252,128,25,0.3));
  }
  .swiggy-logo-text {
    font-size: 22px;
    font-weight: 900;
    color: var(--swiggy-orange);
    letter-spacing: -0.6px;
  }
  .swiggy-nav-divider {
    width: 1.5px;
    height: 22px;
    background: #E2E8F0;
  }
  .swiggy-location-selector {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 8px;
    transition: background 0.2s;
  }
  .swiggy-location-selector:hover {
    background: #F8FAFC;
  }
  .swiggy-loc-icon {
    font-size: 16px;
    color: var(--swiggy-orange);
  }
  .swiggy-loc-title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--swiggy-black);
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .swiggy-loc-chevron {
    font-size: 11px;
    color: var(--swiggy-orange);
    font-weight: 900;
  }

  .swiggy-nav-search {
    flex: 1;
    max-width: 440px;
    background: var(--swiggy-search-bg);
    border-radius: 12px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  @media (max-width: 768px) {
    .swiggy-nav-search { display: none; }
  }
  .swiggy-search-icon {
    font-size: 14px;
    color: var(--swiggy-muted);
  }
  .swiggy-search-input {
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--swiggy-black);
    font-family: inherit;
  }

  .swiggy-nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .swiggy-sound-pill {
    background: #F8FAFC;
    border: 1px solid var(--swiggy-border);
    border-radius: 50px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    color: var(--swiggy-dark);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }
  .swiggy-sound-pill:hover {
    background: #FFF3E9;
    border-color: var(--swiggy-orange);
    color: var(--swiggy-orange-hover);
  }
  .swiggy-back-btn {
    background: #FFF3E9;
    border: 1px solid #FFE4D6;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 800;
    color: var(--swiggy-orange-hover);
    cursor: pointer;
  }
  .swiggy-user-avatar, .swiggy-user-avatar-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #02060C;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .swiggy-user-avatar-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(2,6,12,0.25);
  }
  .avatar-initial-badge {
    font-size: 15px;
    font-weight: 900;
    color: var(--swiggy-orange);
  }

  /* ════ PROFILE DRAWER & AUTH MODAL ════ */
  .drawer-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: flex-end;
    animation: fadeIn 0.2s ease;
  }
  .drawer-panel {
    width: 100%;
    max-width: 440px;
    background: #FFFFFF;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    animation: slideDrawer 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: -10px 0 40px rgba(0,0,0,0.25);
  }
  @keyframes slideDrawer {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .drawer-header-peach {
    background: linear-gradient(180deg, #FFF3EB 0%, #FFF9F6 100%);
    padding: 24px 20px 18px;
    border-bottom: 1px solid #FFE4D6;
    position: relative;
  }
  .drawer-close-btn {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0,0,0,0.06);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 900;
    color: #1C1C1C;
    cursor: pointer;
  }
  .user-name-title {
    font-size: 22px;
    font-weight: 900;
    color: #1C1C1C;
    margin-bottom: 3px;
  }
  .user-contact-sub {
    font-size: 12px;
    font-weight: 700;
    color: #64748B;
  }
  .momanto-one-card {
    margin: 16px 20px 0;
    background: #FFFFFF;
    border: 1.5px solid #FEE2E2;
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.08);
  }
  .one-badge {
    background: #EF4444;
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    padding: 2px 7px;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 3px;
  }
  .drawer-tiles-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 18px 20px;
  }
  .drawer-tile-btn {
    background: #FFFFFF;
    border: 1.5px solid var(--swiggy-border);
    border-radius: 16px;
    padding: 12px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .drawer-tile-btn:hover {
    border-color: var(--swiggy-orange);
    background: #FFF3E9;
  }
  .dtile-icon {
    font-size: 20px;
  }
  .dtile-label {
    font-size: 10.5px;
    font-weight: 800;
    color: var(--swiggy-black);
    line-height: 1.2;
  }
  .drawer-menu-list {
    padding: 0 20px 80px;
    display: flex;
    flex-direction: column;
  }
  .drawer-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 4px;
    border-bottom: 1px solid #F1F1F4;
    cursor: pointer;
    transition: background 0.15s;
  }
  .drawer-menu-item:hover {
    padding-left: 8px;
  }
  .drawer-item-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ditem-icon {
    font-size: 18px;
    width: 28px;
    display: flex;
    justify-content: center;
  }
  .ditem-text {
    font-size: 14px;
    font-weight: 800;
    color: var(--swiggy-black);
  }
  .ditem-arrow {
    font-size: 16px;
    color: #94A3B8;
    font-weight: 900;
  }
  .auth-modal-card {
    background: #FFFFFF;
    border-radius: 24px;
    width: 100%;
    max-width: 440px;
    padding: 28px 24px;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  /* Step Bar */
  .step-bar {
    max-width: 820px;
    margin: 14px auto 0;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .step-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #E2E8F0;
    color: var(--swiggy-muted);
    font-size: 12px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  .step-dot.on {
    background: var(--swiggy-orange);
    color: #fff;
    box-shadow: 0 2px 8px rgba(252,128,25,0.35);
  }
  .step-line {
    width: 50px;
    height: 3px;
    border-radius: 4px;
    background: #E2E8F0;
    transition: all 0.3s;
  }
  .step-line.on { background: var(--swiggy-orange); }

  .page-wrap {
    max-width: 820px;
    margin: 0 auto;
    padding-bottom: 30px;
  }

  /* ═══════════════════════════════════════════════════════
     STEP 1: SWIGGY DINEOUT / RESTAURANT DETAILS PAGE
  ═══════════════════════════════════════════════════════ */
  .swiggy-details-page {
    padding: 10px 16px;
  }

  /* Savings Toast Top */
  .savings-toast-top {
    background: linear-gradient(135deg, #FFF6EE, #FFEADB);
    border: 1px solid #FFD8BA;
    border-radius: 12px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: #92400E;
    margin-bottom: 14px;
  }
  .savings-toast-top strong { color: #78350F; font-weight: 900; }

  /* Hero Container */
  .swiggy-hero-container {
    margin-bottom: 16px;
  }
  .swiggy-hero-media-wrap {
    position: relative;
    height: 280px;
    border-radius: 24px;
    overflow: hidden;
    background: #02060C;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  @media (min-width: 600px) {
    .swiggy-hero-media-wrap { height: 340px; }
  }
  .swiggy-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .swiggy-hero-overlay-grad {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%), linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%);
  }

  /* Top Right Action Chips on Image (Image 1) */
  .swiggy-hero-top-actions {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 10;
  }
  .swiggy-open-pill {
    background: rgba(220, 252, 231, 0.95);
    color: #15803D;
    font-size: 12px;
    font-weight: 800;
    padding: 6px 12px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .open-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #16A34A;
  }
  .swiggy-action-pill {
    background: rgba(255, 255, 255, 0.95);
    color: #02060C;
    font-size: 12px;
    font-weight: 800;
    padding: 6px 12px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 5px;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.2s;
  }
  .swiggy-action-pill:hover { transform: scale(1.04); }
  .action-icon { font-size: 13px; font-weight: 900; }

  /* Show all images frosted button (Image 1) */
  .swiggy-show-all-btn {
    position: absolute;
    bottom: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(255,255,255,0.6);
    backdrop-filter: blur(12px);
    color: #02060C;
    font-size: 12.5px;
    font-weight: 800;
    padding: 8px 16px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    transition: transform 0.2s, background 0.2s;
  }
  .swiggy-show-all-btn:hover {
    background: #FFFFFF;
    transform: scale(1.03);
  }

  /* Thumbnails */
  .swiggy-thumb-strip {
    display: flex;
    gap: 10px;
    margin-top: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .swiggy-thumb-item {
    flex: 0 0 72px;
    height: 72px;
    border-radius: 14px;
    overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer;
    opacity: 0.65;
    transition: all 0.2s;
  }
  .swiggy-thumb-item.is-active {
    border-color: var(--swiggy-orange);
    opacity: 1;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(252,128,25,0.25);
  }
  .swiggy-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .swiggy-video-thumb-btn {
    background: #02060C;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  /* Package Info & Primary CTA Box */
  .swiggy-info-cta-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 20px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    box-shadow: var(--swiggy-card-shadow);
    margin-bottom: 16px;
  }
  @media (max-width: 640px) {
    .swiggy-info-cta-card { flex-direction: column; align-items: stretch; }
  }
  .swiggy-info-left {
    flex: 1;
    min-width: 0;
  }
  .swiggy-vendor-subtitle {
    font-size: 11.5px;
    font-weight: 800;
    color: var(--swiggy-muted);
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .swiggy-pkg-main-title {
    font-size: 24px;
    font-weight: 900;
    color: var(--swiggy-black);
    letter-spacing: -0.5px;
    line-height: 1.25;
    margin-bottom: 8px;
  }
  .swiggy-meta-pills-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .swiggy-verified-pill {
    background: #DCFCE7;
    color: #15803D;
    font-size: 12px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
  }
  .swiggy-meta-count, .swiggy-meta-location {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--swiggy-muted);
  }
  .swiggy-desc-quote {
    margin-top: 10px;
    font-size: 13px;
    color: var(--swiggy-muted);
    font-style: italic;
    line-height: 1.45;
  }

  .swiggy-pricing-cta-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    flex-shrink: 0;
  }
  @media (max-width: 640px) {
    .swiggy-pricing-cta-box { align-items: stretch; margin-top: 6px; }
  }
  .swiggy-price-header {
    text-align: right;
  }
  @media (max-width: 640px) {
    .swiggy-price-header { text-align: left; display: flex; align-items: baseline; gap: 8px; }
  }
  .swiggy-main-price {
    font-size: 26px;
    font-weight: 900;
    color: var(--swiggy-black);
    display: block;
    line-height: 1.15;
  }
  .swiggy-strike-price {
    font-size: 13px;
    color: var(--swiggy-sub);
    text-decoration: line-through;
    font-weight: 700;
    margin-right: 6px;
  }
  .swiggy-save-tag {
    background: #FEE2E2;
    color: #DC2626;
    font-size: 11px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .swiggy-inclusive-tag {
    font-size: 11px;
    color: var(--swiggy-muted);
    display: block;
    font-weight: 600;
  }

  .swiggy-primary-cta-btn {
    background: var(--swiggy-orange);
    color: #FFFFFF;
    font-size: 14.5px;
    font-weight: 900;
    padding: 13px 26px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(252,128,25,0.35);
    transition: transform 0.2s, background 0.2s;
    letter-spacing: -0.2px;
  }
  .swiggy-primary-cta-btn:hover {
    background: var(--swiggy-orange-hover);
    transform: scale(1.03);
  }

  /* Chips Strip */
  .swiggy-chips-strip {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .swiggy-feature-chip {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    padding: 7px 14px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 800;
    color: #334155;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  /* ═══════════════════════════════════════════════════════
     SWIGGY "OFFERS FOR YOU" SECTION (MATCHING IMAGE 1)
  ═══════════════════════════════════════════════════════ */
  .swiggy-offers-section {
    margin-bottom: 24px;
  }
  .swiggy-offers-heading {
    font-size: 19px;
    font-weight: 900;
    color: var(--swiggy-black);
    letter-spacing: -0.4px;
    margin-bottom: 12px;
  }
  .swiggy-offers-tab-row {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
  }
  .swiggy-offers-tab {
    background: transparent;
    border: 1px solid transparent;
    padding: 7px 18px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 800;
    color: var(--swiggy-black);
    cursor: pointer;
    transition: all 0.2s;
  }
  .swiggy-offers-tab.is-active {
    background: #02060C;
    color: #FFFFFF;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .swiggy-offers-grid-layout {
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: 14px;
  }
  @media (max-width: 680px) {
    .swiggy-offers-grid-layout { grid-template-columns: 1fr; }
  }

  /* Left Card: One Exclusive */
  .swiggy-one-exclusive-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 20px;
    padding: 18px 20px;
    box-shadow: var(--swiggy-card-shadow);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .swiggy-one-badge-row { margin-bottom: 6px; }
  .swiggy-one-badge {
    background: #FFF1EB;
    color: #FF5200;
    font-size: 11px;
    font-weight: 900;
    padding: 3px 8px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }
  .one-text { font-style: italic; font-weight: 900; }
  .swiggy-one-title-row { cursor: pointer; }
  .swiggy-one-main-offer {
    font-size: 17px;
    font-weight: 900;
    color: var(--swiggy-black);
    letter-spacing: -0.3px;
    margin-bottom: 2px;
  }
  .swiggy-one-sub-offer {
    font-size: 11.5px;
    color: var(--swiggy-muted);
    font-weight: 600;
  }

  .swiggy-connected-cashback-row {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 10px 12px;
    margin: 14px 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .swiggy-mini-offer-box {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    font-size: 11.5px;
  }
  .swiggy-mini-offer-box strong { font-weight: 800; color: var(--swiggy-black); display: block; }
  .swiggy-mini-offer-box p { font-size: 10.5px; color: var(--swiggy-muted); }
  .swiggy-connector-plus {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #02060C;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 900;
    flex-shrink: 0;
  }
  .swiggy-pager-dots {
    font-size: 10px;
    color: var(--swiggy-muted);
    font-weight: 800;
  }

  .swiggy-coupon-action-bar {
    margin-top: 6px;
  }
  .swiggy-coupon-applied-pill {
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-radius: 10px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #166534;
    font-weight: 700;
  }
  .swiggy-remove-link {
    background: none;
    border: none;
    color: #DC2626;
    font-weight: 800;
    font-size: 11.5px;
    cursor: pointer;
  }
  .swiggy-inline-coupon-input-wrap {
    display: flex;
    gap: 8px;
  }
  .swiggy-inline-coupon-input {
    flex: 1;
    background: #F0F0F5;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 800;
    color: var(--swiggy-black);
    text-transform: uppercase;
    outline: none;
  }
  .swiggy-inline-apply-btn {
    background: #02060C;
    color: #FFFFFF;
    border: none;
    border-radius: 10px;
    padding: 0 16px;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }
  .swiggy-coupon-err-msg {
    font-size: 11px;
    color: #DC2626;
    font-weight: 700;
    margin-top: 4px;
  }

  /* Right Card: Dineout QR Card (Image 1) */
  .swiggy-dineout-qr-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 20px;
    padding: 18px 20px;
    box-shadow: var(--swiggy-card-shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-content: space-between;
  }
  .swiggy-dineout-title {
    font-size: 13.5px;
    font-weight: 800;
    color: var(--swiggy-black);
    margin-bottom: 6px;
  }
  .swiggy-dineout-brand-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }
  .dineout-logo-icon { font-size: 20px; }
  .dineout-brand-name {
    font-size: 18px;
    font-weight: 900;
    color: #FF5200;
    letter-spacing: -0.4px;
  }
  .swiggy-qr-code-box {
    background: #F8FAFC;
    border: 1.5px solid #E2E8F0;
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 8px;
  }
  .swiggy-qr-matrix {
    width: 90px;
    height: 90px;
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .qr-center-icon { font-size: 28px; }
  .swiggy-qr-subtext {
    font-size: 11px;
    color: var(--swiggy-muted);
    font-weight: 600;
  }

  /* Inclusions & Add-ons Section Blocks */
  .swiggy-section-block {
    margin-bottom: 24px;
  }
  .swiggy-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .swiggy-block-title {
    font-size: 18px;
    font-weight: 900;
    color: var(--swiggy-black);
    letter-spacing: -0.3px;
  }
  .swiggy-block-sub {
    font-size: 12px;
    color: var(--swiggy-muted);
    font-weight: 600;
    margin-top: 1px;
  }
  .swiggy-count-badge {
    background: #FFF3E9;
    color: var(--swiggy-orange-hover);
    font-size: 11px;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 50px;
  }
  .swiggy-addon-active-pill {
    background: var(--swiggy-green);
    color: #fff;
    font-size: 11.5px;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 50px;
  }

  /* Inclusions List */
  .swiggy-inclusions-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .swiggy-inclusion-item {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .swiggy-inc-check {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #DCFCE7;
    color: #15803D;
    font-size: 12px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .swiggy-inc-text { flex: 1; }
  .swiggy-inc-label { font-size: 13.5px; font-weight: 800; color: var(--swiggy-black); }
  .swiggy-inc-sub { font-size: 11px; color: var(--swiggy-muted); font-weight: 600; }

  /* Add-ons Stack */
  .swiggy-addons-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .swiggy-addon-item-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 16px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .swiggy-addon-item-card:hover {
    border-color: var(--swiggy-orange);
    background: #FFFDFB;
  }
  .swiggy-addon-item-card.is-selected {
    border-color: var(--swiggy-orange);
    background: #FFF7ED;
    box-shadow: 0 4px 14px rgba(252,128,25,0.15);
  }
  .swiggy-addon-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  .swiggy-addon-emoji {
    font-size: 26px;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #F1F5F9;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .swiggy-addon-name { font-size: 13.5px; font-weight: 800; color: var(--swiggy-black); }
  .swiggy-addon-sub { font-size: 11px; color: var(--swiggy-muted); font-weight: 600; }
  .swiggy-addon-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .swiggy-addon-price { font-size: 13.5px; font-weight: 900; color: var(--swiggy-black); }
  .swiggy-addon-add-btn {
    border: 1.5px solid var(--swiggy-border);
    background: #FFFFFF;
    color: var(--swiggy-orange-hover);
    font-size: 12px;
    font-weight: 900;
    padding: 7px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .swiggy-addon-add-btn.is-added {
    background: var(--swiggy-orange);
    color: #fff;
    border-color: var(--swiggy-orange);
  }

  /* Specifications Grid */
  .swiggy-specs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (max-width: 500px) {
    .swiggy-specs-grid { grid-template-columns: 1fr; }
  }
  .swiggy-spec-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .spec-icon { font-size: 20px; flex-shrink: 0; }
  .spec-title { font-size: 13px; font-weight: 800; color: var(--swiggy-black); }
  .spec-sub { font-size: 11px; color: var(--swiggy-muted); font-weight: 600; }

  /* Promises Grid */
  .swiggy-promise-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (max-width: 500px) {
    .swiggy-promise-grid { grid-template-columns: 1fr; }
  }
  .swiggy-promise-tile {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 16px;
    padding: 14px 16px;
    text-align: center;
  }
  .promise-icon { font-size: 24px; display: block; margin-bottom: 4px; }
  .promise-title { font-size: 13px; font-weight: 800; color: var(--swiggy-black); margin-bottom: 2px; }
  .promise-sub { font-size: 11px; color: var(--swiggy-muted); font-weight: 600; line-height: 1.35; }

  /* Sticky Bottom Bar */
  .swiggy-sticky-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(16px);
    border-top: 1px solid var(--swiggy-border);
    padding: 12px 24px calc(12px + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 400;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
  }
  .swiggy-sticky-total { font-size: 21px; font-weight: 900; color: var(--swiggy-black); }
  .swiggy-sticky-sub { font-size: 11.5px; color: var(--swiggy-muted); font-weight: 700; }
  .swiggy-sticky-cta {
    background: var(--swiggy-orange);
    color: #FFFFFF;
    font-size: 14.5px;
    font-weight: 900;
    padding: 13px 26px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(252,128,25,0.35);
    transition: transform 0.2s;
  }
  .swiggy-sticky-cta:hover { transform: scale(1.03); }

  /* ═══════════════════════════════════════════════════════
     STEP 2: SWIGGY CHECKOUT FORM STYLES
  ═══════════════════════════════════════════════════════ */
  ::placeholder {
    font-weight: 400 !important;
    color: #94A3B8 !important;
    opacity: 1 !important;
    font-size: 13.5px !important;
  }
  input::placeholder, textarea::placeholder {
    font-weight: 400 !important;
    color: #94A3B8 !important;
    opacity: 1 !important;
  }

  .swiggy-checkout-container {
    padding: 12px 16px 40px;
    max-width: 720px;
    margin: 0 auto;
  }
  .swiggy-progress-track {
    height: 4px;
    background: #E2E8F0;
    border-radius: 6px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .swiggy-progress-fill {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #FC8019, #FF9E42);
  }

  /* Cart Recap Strip */
  .swiggy-cart-recap-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 18px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    box-shadow: var(--swiggy-card-shadow);
  }
  .swiggy-cart-recap-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }
  .swiggy-cart-recap-img {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid var(--swiggy-border);
  }
  .swiggy-cart-recap-fallback {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    background: #FFF3E9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }
  .swiggy-cart-recap-details { flex: 1; min-width: 0; }
  .swiggy-vendor-pill {
    font-size: 11px;
    font-weight: 800;
    color: var(--swiggy-orange-hover);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 2px;
  }
  .dot-live {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #16A34A;
    display: inline-block;
  }
  .swiggy-cart-pkg-title {
    font-size: 15.5px;
    font-weight: 900;
    color: var(--swiggy-black);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
  }
  .swiggy-cart-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    flex-wrap: wrap;
  }
  .swiggy-rating-badge {
    background: #DCFCE7;
    color: #15803D;
    font-size: 11px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .swiggy-city-tag { font-size: 11.5px; color: var(--swiggy-muted); font-weight: 700; }
  .swiggy-coupon-chip {
    background: #DBEAFE;
    color: #1E40AF;
    font-size: 10.5px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .swiggy-meta-sep { color: #CBD5E1; font-size: 12px; }
  .swiggy-cart-recap-pricing { text-align: right; flex-shrink: 0; }
  .swiggy-cart-total-label {
    display: block;
    font-size: 10.5px;
    color: var(--swiggy-muted);
    font-weight: 700;
    text-transform: uppercase;
  }
  .swiggy-cart-total-val {
    font-size: 17px;
    font-weight: 900;
    color: var(--swiggy-black);
    display: block;
    line-height: 1.2;
  }
  .swiggy-cart-savings-pill {
    background: #DCFCE7;
    color: #15803D;
    font-size: 10px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 6px;
    display: inline-block;
    margin-top: 2px;
  }

  /* Form Cards */
  .swiggy-checkout-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .swiggy-section-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 20px;
    padding: 18px 20px;
    box-shadow: var(--swiggy-card-shadow);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .swiggy-section-card:hover {
    border-color: #CBD5E1;
  }
  .swiggy-section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 16px;
  }
  .swiggy-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .swiggy-header-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .swiggy-header-title {
    font-size: 15px;
    font-weight: 900;
    color: var(--swiggy-black);
    line-height: 1.25;
  }
  .swiggy-header-sub {
    font-size: 11.5px;
    color: var(--swiggy-muted);
    font-weight: 600;
    margin-top: 1px;
  }
  .swiggy-step-badge {
    background: #F1F5F9;
    color: #475569;
    font-size: 10.5px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 6px;
    text-transform: uppercase;
  }
  .swiggy-badge-green {
    background: #DCFCE7;
    color: #15803D;
    font-size: 11px;
    font-weight: 900;
    padding: 3px 9px;
    border-radius: 50px;
    border: 1px solid #BBF7D0;
  }
  .swiggy-badge-orange {
    background: #FFF3E9;
    color: var(--swiggy-orange-hover);
    font-size: 11px;
    font-weight: 900;
    padding: 3px 9px;
    border-radius: 50px;
    border: 1px solid #FFE4D6;
  }
  .swiggy-badge-purple {
    background: #FAF5FF;
    color: #7E22CE;
    font-size: 11px;
    font-weight: 900;
    padding: 3px 9px;
    border-radius: 50px;
    border: 1px solid #F3E8FF;
  }

  /* Fields & Inputs */
  .swiggy-fields-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .swiggy-input-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .swiggy-label {
    font-size: 12px;
    font-weight: 800;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .swiggy-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .swiggy-label-optional {
    font-size: 11px;
    color: var(--swiggy-sub);
    font-weight: 600;
  }
  .swiggy-input-wrap {
    background: #F8FAFC;
    border: 1.5px solid #CBD5E1;
    border-radius: 12px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
  }
  .swiggy-input-wrap:focus-within {
    border-color: var(--swiggy-orange);
    background: #FFFFFF;
    box-shadow: 0 0 0 3.5px rgba(252,128,25,0.18);
  }
  .swiggy-input-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
  .swiggy-text-input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 12px 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--swiggy-black);
    font-family: inherit;
  }
  .swiggy-phone-prefix {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-right: 8px;
    border-right: 1.5px solid #E2E8F0;
    font-size: 13px;
    font-weight: 800;
    color: #334155;
    flex-shrink: 0;
  }
  .swiggy-phone-input { letter-spacing: 0.5px; }
  .swiggy-date-input { font-weight: 800; color: var(--swiggy-black); }

  /* WhatsApp Opt-in */
  .swiggy-whatsapp-box {
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-radius: 14px;
    padding: 12px 14px;
  }
  .swiggy-whatsapp-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  .swiggy-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--swiggy-green);
    cursor: pointer;
  }
  .swiggy-whatsapp-label {
    font-size: 12.5px;
    font-weight: 800;
    color: #166534;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    line-height: 1.35;
  }

  /* Address Tags */
  .swiggy-address-type-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .swiggy-addr-tag {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 800;
    color: #475569;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .swiggy-addr-tag.selected {
    border-color: var(--swiggy-orange);
    background: #FFF3E9;
    color: var(--swiggy-orange-hover);
    box-shadow: 0 2px 8px rgba(252,128,25,0.15);
  }

  /* GPS button */
  .swiggy-location-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .swiggy-location-wrap { flex: 1; }
  .swiggy-gps-btn {
    background: #FFF3E9;
    border: 1px solid #FFE4D6;
    color: var(--swiggy-orange-hover);
    font-size: 12px;
    font-weight: 900;
    padding: 11px 14px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .swiggy-gps-btn:hover { background: #FFEAD9; border-color: var(--swiggy-orange); }
  .swiggy-gps-btn.is-loading { opacity: 0.7; cursor: wait; }
  .gps-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--swiggy-orange);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .swiggy-gps-live-hint {
    font-size: 11.5px;
    color: var(--swiggy-orange-hover);
    font-weight: 800;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--swiggy-orange);
    animation: pulse 1s infinite alternate;
  }
  @keyframes pulse { to { opacity: 0.3; transform: scale(1.4); } }

  /* Slots Grid */
  .swiggy-slots-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (max-width: 500px) {
    .swiggy-slots-grid { grid-template-columns: 1fr; }
  }
  .swiggy-slot-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 14px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .swiggy-slot-card:hover {
    border-color: var(--swiggy-orange);
    background: #FFFDFB;
  }
  .swiggy-slot-card.is-selected {
    border-color: var(--swiggy-orange);
    background: #FFF7ED;
    box-shadow: 0 4px 14px rgba(252,128,25,0.18);
  }
  .slot-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .slot-icon-title { display: flex; align-items: center; gap: 6px; }
  .slot-emoji { font-size: 16px; }
  .slot-name { font-size: 13px; font-weight: 900; color: var(--swiggy-black); }
  .slot-radio-circle {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid #CBD5E1;
    transition: all 0.2s;
  }
  .slot-radio-circle.active {
    border-color: var(--swiggy-orange);
    background: var(--swiggy-orange);
    box-shadow: inset 0 0 0 3px #FFFFFF;
  }
  .slot-timing { font-size: 11.5px; color: #475569; font-weight: 700; }
  .slot-bottom-meta { margin-top: 2px; }
  .slot-badge {
    font-size: 10px;
    font-weight: 900;
    color: var(--swiggy-muted);
    background: #F1F5F9;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .slot-badge.active { background: #FFEDD5; color: #C2410C; }

  /* Chef Customization Notes & Tags */
  .swiggy-tags-container {
    background: #F8FAFC;
    border: 1px dashed #CBD5E1;
    border-radius: 14px;
    padding: 12px 14px;
  }
  .swiggy-tags-hint {
    font-size: 11.5px;
    font-weight: 800;
    color: #475569;
    margin-bottom: 8px;
  }
  .swiggy-chips-flex {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  .swiggy-chip-pill {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 50px;
    padding: 5px 11px;
    font-size: 11.5px;
    font-weight: 800;
    color: #334155;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s;
  }
  .swiggy-chip-pill:hover {
    border-color: #9333EA;
    background: #FAF5FF;
    color: #7E22CE;
  }
  .swiggy-chip-pill.chip-active {
    background: #02060C;
    border-color: #02060C;
    color: #FFFFFF;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .chip-plus { font-weight: 900; }
  .swiggy-textarea-wrap {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 14px;
    padding: 12px 14px;
    transition: all 0.2s;
  }
  .swiggy-textarea-wrap:focus-within {
    border-color: var(--swiggy-orange);
    box-shadow: 0 0 0 3.5px rgba(252,128,25,0.15);
  }
  .swiggy-note-textarea {
    width: 100%;
    border: none;
    outline: none;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--swiggy-black);
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    line-height: 1.5;
  }
  .swiggy-textarea-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #F1F5F9;
  }
  .swiggy-char-counter { font-size: 11px; color: var(--swiggy-sub); font-weight: 700; }
  .swiggy-clear-btn {
    background: none;
    border: none;
    font-size: 11.5px;
    font-weight: 800;
    color: #DC2626;
    cursor: pointer;
  }

  /* Bill Summary */
  .swiggy-bill-card { background: #FFFFFF; }
  .swiggy-bill-table { display: flex; flex-direction: column; gap: 10px; }
  .swiggy-bill-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13.5px;
    color: #334155;
    font-weight: 700;
  }
  .swiggy-bill-item-name { flex: 1; }
  .swiggy-bill-item-price { font-weight: 800; color: var(--swiggy-black); }
  .swiggy-bill-addon {
    color: #475569;
    padding-left: 8px;
    border-left: 2px solid #CBD5E1;
  }
  .swiggy-price-strike-wrap { display: flex; align-items: center; gap: 6px; }
  .strike-amount { font-size: 12px; color: var(--swiggy-sub); text-decoration: line-through; }
  .free-tag {
    background: #DCFCE7;
    color: #15803D;
    font-size: 10.5px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .swiggy-discount-highlight-row {
    background: #F0FDF4;
    border-radius: 8px;
    padding: 6px 8px;
  }
  .discount-color { color: #15803D !important; font-weight: 900 !important; }
  .swiggy-receipt-tear {
    display: flex;
    align-items: center;
    margin: 6px -20px;
    position: relative;
  }
  .tear-notch-left, .tear-notch-right {
    width: 14px;
    height: 24px;
    background: #FFFFFF;
    flex-shrink: 0;
  }
  .tear-notch-left { border-radius: 0 14px 14px 0; border: 1px solid var(--swiggy-border); border-left: none; }
  .tear-notch-right { border-radius: 14px 0 0 14px; border: 1px solid var(--swiggy-border); border-right: none; }
  .tear-dashed-line { flex: 1; border-bottom: 1.5px dashed #CBD5E1; margin: 0 6px; }
  .swiggy-bill-grand-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 4px;
  }
  .grand-total-label { font-size: 16px; font-weight: 900; color: var(--swiggy-black); }
  .grand-total-sub { font-size: 11px; color: var(--swiggy-muted); font-weight: 600; }
  .grand-total-value { font-size: 22px; font-weight: 900; color: var(--swiggy-black); }
  .swiggy-savings-celebration-strip {
    background: linear-gradient(135deg, #DCFCE7, #BBF7D0);
    border: 1px solid #86EFAC;
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
  }
  .savings-emoji { font-size: 18px; }
  .savings-text { font-size: 12.5px; color: #14532D; font-weight: 700; }

  /* Payment Stack */
  .swiggy-payment-methods-stack { display: flex; flex-direction: column; gap: 10px; }
  .swiggy-pay-card {
    background: #FFFFFF;
    border: 1px solid var(--swiggy-border);
    border-radius: 16px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .swiggy-pay-card.is-selected.green-theme {
    border-color: #16A34A;
    box-shadow: 0 4px 16px rgba(22,163,74,0.14);
  }
  .swiggy-pay-card.is-selected.blue-theme {
    border-color: #2563EB;
    box-shadow: 0 4px 16px rgba(37,99,235,0.14);
  }
  .swiggy-pay-card.is-selected.orange-theme {
    border-color: var(--swiggy-orange);
    box-shadow: 0 4px 16px rgba(252,128,25,0.14);
  }
  .pay-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .pay-card-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  .pay-method-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .pay-method-title {
    font-size: 13.5px;
    font-weight: 900;
    color: var(--swiggy-black);
    display: block;
  }
  .pay-method-desc { font-size: 11.5px; color: var(--swiggy-muted); font-weight: 600; }
  .pay-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .pay-badge-fast {
    background: #DCFCE7;
    color: #15803D;
    font-size: 10px;
    font-weight: 900;
    padding: 3px 7px;
    border-radius: 6px;
  }
  .pay-badge-trust {
    background: #FFF3E9;
    color: #C2410C;
    font-size: 10px;
    font-weight: 900;
    padding: 3px 7px;
    border-radius: 6px;
  }
  .pay-radio-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #CBD5E1;
    transition: all 0.2s;
  }
  .pay-radio-dot.active {
    border-color: #16A34A;
    background: #16A34A;
    box-shadow: inset 0 0 0 3px #FFFFFF;
  }
  .swiggy-pay-card.blue-theme .pay-radio-dot.active {
    border-color: #2563EB;
    background: #2563EB;
  }
  .swiggy-pay-card.orange-theme .pay-radio-dot.active {
    border-color: var(--swiggy-orange);
    background: var(--swiggy-orange);
  }

  .swiggy-upi-expanded-drawer {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #F1F5F9;
    text-align: center;
  }
  .upi-qr-box {
    display: inline-block;
    background: #F8FAFC;
    padding: 12px;
    border-radius: 14px;
    border: 1px dashed #CBD5E1;
  }
  .upi-qr-card {
    width: 130px;
    height: 130px;
    background: #FFFFFF;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid #E2E8F0;
    gap: 4px;
  }
  .qr-pay-text { font-size: 10.5px; font-weight: 900; color: var(--swiggy-black); }
  .upi-vpa-text { font-size: 11px; color: #475569; margin-top: 8px; }
  .upi-app-pills { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
  .upi-pill {
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 900;
    border: 1px solid transparent;
  }
  .upi-pill.gpay { background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; }
  .upi-pill.phonepe { background: #FAF5FF; border-color: #E9D5FF; color: #6B21A8; }
  .upi-pill.paytm { background: #F0FDF4; border-color: #BBF7D0; color: #15803D; }
  .upi-pill.cred { background: #FFF1F2; border-color: #FECDD3; color: #BE123C; }

  .swiggy-cards-expanded-drawer {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #F1F5F9;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .card-num-input {
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-radius: 10px;
    padding: 10px 12px;
  }
  .card-sub-inputs { display: flex; gap: 8px; }
  .cvv-input { max-width: 90px; }

  /* Trust Policy */
  .swiggy-trust-card {
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .trust-point {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: #1E40AF;
    line-height: 1.4;
  }
  .trust-icon { font-size: 15px; }

  /* Submit CTA */
  .swiggy-submit-wrap { margin-top: 6px; }
  .swiggy-checkout-submit-btn {
    width: 100%;
    background: var(--swiggy-orange);
    color: #FFFFFF;
    border: none;
    border-radius: 16px;
    padding: 16px 20px;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(252,128,25,0.35);
    transition: transform 0.2s, background 0.2s;
  }
  .swiggy-checkout-submit-btn:hover {
    background: var(--swiggy-orange-hover);
    transform: translateY(-2px);
  }
  .swiggy-checkout-submit-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }
  .submit-content-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 15.5px;
    font-weight: 900;
  }
  .submit-arrow {
    background: rgba(255,255,255,0.25);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 14px;
  }
  .submit-spinner-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 900;
  }
  .btn-spinner {
    width: 18px;
    height: 18px;
    border: 2.5px solid #FFFFFF;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
  }

  /* Coupons Drawer Modal */
  .coupons-modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  @media (min-width: 600px) {
    .coupons-modal-overlay { align-items: center; padding: 20px; }
  }
  .coupons-modal-sheet {
    background: #fff; width: 100%; max-width: 540px;
    max-height: 80vh; border-radius: 24px 24px 0 0;
    overflow-y: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.25);
    padding: 20px;
  }
  @media (min-width: 600px) {
    .coupons-modal-sheet { border-radius: 24px; }
  }
  .coupons-sheet-head {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 14px; border-bottom: 1px solid var(--swiggy-border); margin-bottom: 16px;
  }
  .coupons-sheet-title { font-size: 17px; font-weight: 900; color: var(--swiggy-black); }
  .coupons-sheet-sub { font-size: 12px; color: var(--swiggy-muted); font-weight: 700; margin-top: 2px; }
  .coupons-sheet-close {
    width: 32px; height: 32px; border-radius: 50%;
    background: #F1F5F9; border: none; font-size: 14px; font-weight: 900;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
  .coupons-list { display: flex; flex-direction: column; gap: 12px; }
  .coupon-tile {
    background: #F8FAFC; border: 1.5px dashed #CBD5E1;
    border-radius: 14px; padding: 14px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .coupon-tile.applied {
    background: #F0FDF4; border-color: #86EFAC; border-style: solid;
  }
  .coupon-tile-left { flex: 1; }
  .coupon-code-badge {
    display: inline-block; background: #DBEAFE; color: #1E40AF;
    font-size: 11.5px; font-weight: 900; padding: 3px 8px; border-radius: 6px;
    margin-bottom: 4px; letter-spacing: 0.5px;
  }
  .coupon-tile-title { font-size: 13.5px; font-weight: 900; color: var(--swiggy-black); margin-bottom: 2px; }
  .coupon-tile-desc { font-size: 11.5px; color: var(--swiggy-muted); font-weight: 600; }
  .coupon-apply-action-btn {
    background: var(--swiggy-orange); color: #fff; border: none;
    border-radius: 10px; padding: 8px 16px; font-size: 12px; font-weight: 900;
    cursor: pointer; transition: transform 0.2s;
  }
  .coupon-apply-action-btn.is-applied {
    background: #16A34A;
  }

  /* Center loader */
  .center-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 60vh; gap: 12px;
  }
  .loader-ring {
    width: 40px; height: 40px; border: 3.5px solid var(--swiggy-border);
    border-top-color: var(--swiggy-orange); border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 13px; font-weight: 800; color: var(--swiggy-muted); }

  /* ═══════════════════════════════════════════════════════
     COMPREHENSIVE MOBILE VIEWPORT OPTIMIZATION
  ═══════════════════════════════════════════════════════ */
  @media (max-width: 768px) {
    .hide-on-mobile {
      display: none !important;
    }
    body {
      width: 100% !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
    }
    .swiggy-nav {
      width: 100% !important;
    }
    .swiggy-nav-inner {
      width: 100% !important;
      padding: 10px 14px !important;
      gap: 8px !important;
    }
    .swiggy-brand-logo-wrap .swiggy-logo-text {
      font-size: 19px !important;
    }
    .swiggy-sound-pill {
      padding: 5px 8px !important;
      font-size: 13px !important;
    }
    .swiggy-back-btn {
      padding: 5px 10px !important;
      font-size: 12px !important;
    }
    .swiggy-user-avatar {
      width: 32px !important;
      height: 32px !important;
      font-size: 14px !important;
    }
    .page-wrap {
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 10px 40px !important;
      box-sizing: border-box !important;
    }
    .swiggy-checkout-container, .swiggy-details-page {
      width: 100% !important;
      max-width: 100% !important;
      padding: 6px 0 40px !important;
      box-sizing: border-box !important;
    }
    .swiggy-section-card {
      width: 100% !important;
      padding: 14px 12px !important;
      border-radius: 16px !important;
      margin-bottom: 10px !important;
      box-sizing: border-box !important;
    }
    .swiggy-cart-recap-card {
      padding: 12px 10px !important;
      border-radius: 16px !important;
    }
    .swiggy-cart-recap-img, .swiggy-cart-recap-fallback {
      width: 44px !important;
      height: 44px !important;
    }
    .swiggy-cart-pkg-title {
      font-size: 14px !important;
    }
    .swiggy-cart-total-val {
      font-size: 15px !important;
    }
    .swiggy-slots-grid {
      grid-template-columns: 1fr !important;
    }
    .swiggy-address-type-row {
      gap: 6px !important;
    }
    .swiggy-addr-tag {
      padding: 6px 10px !important;
      font-size: 11.5px !important;
    }
    .swiggy-chips-flex {
      gap: 5px !important;
    }
    .swiggy-chip-pill {
      padding: 4px 9px !important;
      font-size: 11px !important;
    }
    .swiggy-receipt-tear {
      margin: 6px -12px !important;
    }
    .swiggy-info-cta-card {
      padding: 16px 14px !important;
      border-radius: 16px !important;
    }
    .swiggy-pkg-main-title {
      font-size: 20px !important;
    }
    .swiggy-main-price {
      font-size: 22px !important;
    }
    .swiggy-hero-media-wrap {
      height: 240px !important;
      border-radius: 18px !important;
    }
    .swiggy-offers-grid-layout {
      grid-template-columns: 1fr !important;
    }
    .swiggy-specs-grid, .swiggy-promise-grid {
      grid-template-columns: 1fr !important;
    }
    .swiggy-sticky-bottom-bar {
      padding: 10px 16px calc(10px + env(safe-area-inset-bottom)) !important;
    }
    .swiggy-sticky-total {
      font-size: 18px !important;
    }
    .swiggy-sticky-cta {
      padding: 11px 20px !important;
      font-size: 13.5px !important;
    }
  }
`;
