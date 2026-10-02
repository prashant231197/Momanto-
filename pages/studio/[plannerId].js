import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo3D from '../../components/Logo3D';

export default function PlannerStudio() {
  const router = useRouter();
  const { plannerId } = router.query;

  const [studioData, setStudioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (plannerId) fetchStudio();
  }, [plannerId]);

  async function fetchStudio() {
    try {
      const res = await fetch(`/api/planners/${plannerId}`);
      if (res.ok) {
        const data = await res.json();
        setStudioData(data);
      } else {
        // Fallback demo data
        setStudioData({
          planner: {
            planner_id: plannerId,
            business_name: 'Royal Events Bhopal',
            city: 'Bhopal',
            phone: '916204507166',
            whatsapp_number: '916204507166',
            rating: 4.9,
            reviews_count: 142,
            setup_speed: '2 Hours Arrival',
            specialties: ['Balloon Sculpting', 'Gourmet Cakes', 'Fairy Lighting', 'DSLR Photoshoots', 'Flower Decors']
          },
          packages: [
            {
              package_id: 'PKG1787474991642',
              package_name: 'SUSHANT BIRTHDAY',
              description: 'Exclusive 3D birthday celebration with balloon arch, fresh gourmet cake and fairy ambient lights.',
              price: 989,
              original_price: 1499,
              discount_percent: 34,
              photos: ['/images/categories/birthday.jpg'],
              included_items: ['🎂 1kg Gourmet Fresh Cake', '🎈 100 Metallic Balloon Arch', '💡 10m Fairy LED Lights'],
              occasion_tags: ['Birthday', 'Celebration']
            },
            {
              package_id: 'p1',
              package_name: 'Royal 3D Birthday Bash',
              description: 'Complete 3D balloon arch, gourmet cake, photography, fairy lights & personalized entrance banner.',
              price: 4999,
              original_price: 6999,
              discount_percent: 28,
              photos: ['/images/categories/birthday.jpg'],
              included_items: ['Complete 3D Balloon Arch', '1kg Fondant Cake', 'LED Name Banner', '10m Fairy Lights'],
              occasion_tags: ['Birthday']
            },
            {
              package_id: 'p2',
              package_name: 'Candlelight Anniversary Setup',
              description: 'Fresh red roses, glowing golden candles, luxury table setting & romantic couple photoshoot.',
              price: 7999,
              original_price: 10999,
              discount_percent: 27,
              photos: ['/images/categories/anniversary.jpg'],
              included_items: ['100 Fresh Red Roses', 'Candlelight Pathway', 'Romantic Canopy Setup'],
              occasion_tags: ['Anniversary']
            }
          ]
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const planner = studioData?.planner || {
    business_name: 'Royal Events Bhopal',
    city: 'Bhopal',
    rating: 4.9,
    reviews_count: 140,
    phone: '916204507166'
  };

  const allPackages = studioData?.packages || [];

  // Filter packages
  const filteredPackages = allPackages.filter((pkg) => {
    const matchesSearch =
      (pkg.package_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;

    const tags = Array.isArray(pkg.occasion_tags) ? pkg.occasion_tags.map(t => t.toLowerCase()) : [];
    return tags.some(t => t.includes(selectedCategory.toLowerCase())) || (pkg.package_name || '').toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const categories = [
    { key: 'all', label: 'All Celebrations', count: allPackages.length, emoji: '✨' },
    { key: 'birthday', label: 'Birthdays', count: allPackages.filter(p => JSON.stringify(p).toLowerCase().includes('birth')).length, emoji: '🎂' },
    { key: 'anniversary', label: 'Anniversaries', count: allPackages.filter(p => JSON.stringify(p).toLowerCase().includes('anniv')).length, emoji: '💍' },
    { key: 'baby', label: 'Baby Showers', count: allPackages.filter(p => JSON.stringify(p).toLowerCase().includes('baby')).length, emoji: '🍼' },
    { key: 'custom', label: 'Custom Setups', count: allPackages.filter(p => JSON.stringify(p).toLowerCase().includes('custom')).length, emoji: '🎉' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 12 }}>
        <div style={{ width: 44, height: 44, border: '4px solid #E2E8F0', borderTopColor: '#FC8019', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 14, fontWeight: 800, color: '#64748B' }}>Opening Studio Menu…</p>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{planner.business_name} | Momanto Celebration Studio</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #F4F6F9; color: #02060C;
          overflow-x: hidden; -webkit-font-smoothing: antialiased;
        }
        a { text-decoration: none; color: inherit; }

        /* Navbar */
        .studio-nav {
          position: sticky; top: 0; z-index: 300;
          background: rgba(255,255,255,0.98); backdrop-filter: blur(16px);
          border-bottom: 1.5px solid #E2E8F0; box-shadow: 0 2px 14px rgba(0,0,0,0.03);
        }
        .studio-nav-inner {
          max-width: 900px; margin: 0 auto;
          padding: 12px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-back-btn {
          background: #FFF3E9; border: 1.5px solid #FFD1B3;
          border-radius: 10px; padding: 6px 14px;
          font-size: 13px; font-weight: 800; color: #E55A00;
          cursor: pointer; display: flex; align-items: center; gap: 4px;
          transition: all 0.2s;
        }
        .nav-back-btn:hover { background: #FFE5D1; }

        .studio-main-wrap {
          max-width: 900px; margin: 0 auto;
          padding: 16px 16px 80px;
        }

        /* ── SWIGGY RESTAURANT / PLANNER SHOWCASE CARD ── */
        .planner-hero-card {
          background: #FFFFFF;
          border-radius: 24px;
          border: 1.5px solid #E2E8F0;
          padding: 22px 24px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.04);
          margin-bottom: 20px;
          position: relative; overflow: hidden;
        }
        .planner-hero-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px;
          background: linear-gradient(90deg, #FC8019, #FF9E42, #10B981);
        }
        .planner-header-row {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .planner-title-block { flex: 1; min-width: 260px; }
        .planner-studio-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #FFF3E9, #FFEADB);
          border: 1px solid #FFD8BA; color: #C2410C;
          font-size: 11px; font-weight: 900; letter-spacing: 0.5px;
          padding: 4px 10px; border-radius: 50px; margin-bottom: 8px;
        }
        .planner-main-title {
          font-size: clamp(22px, 5vw, 28px); font-weight: 900; color: #02060C; line-height: 1.2;
        }
        .planner-tags-line {
          font-size: 13.5px; color: #64748B; font-weight: 600; margin-top: 6px; line-height: 1.45;
        }

        .rating-badge-box {
          background: #118439; color: #FFFFFF;
          font-size: 14px; font-weight: 900;
          padding: 6px 12px; border-radius: 10px;
          display: inline-flex; align-items: center; gap: 5px;
          box-shadow: 0 3px 8px rgba(17,132,57,0.3);
        }

        /* Clean Score Strip */
        .planner-info-strip {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          margin-top: 16px; padding-top: 14px; border-top: 1px solid #F1F5F9;
          font-size: 13px; font-weight: 700; color: #475569;
        }
        .info-dot { color: #CBD5E1; }
        .info-highlight { color: #E55A00; font-weight: 800; }

        /* WhatsApp Connect */
        .studio-actions-row {
          margin-top: 16px;
        }
        .whatsapp-studio-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: #25D366; color: #FFFFFF;
          border: none; border-radius: 12px; padding: 10px 18px;
          font-size: 13px; font-weight: 900; cursor: pointer;
          box-shadow: 0 4px 12px rgba(37,211,102,0.3);
          transition: transform 0.2s;
        }
        .whatsapp-studio-btn:hover { transform: scale(1.03); }

        /* ── SEARCH & CATEGORIES BAR ── */
        .search-bar-wrap {
          margin-bottom: 16px;
        }
        .search-input-box {
          display: flex; align-items: center; gap: 10px;
          background: #FFFFFF; border: 1.5px solid #E2E8F0;
          border-radius: 16px; padding: 0 16px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.03);
          transition: border 0.2s;
        }
        .search-input-box:focus-within {
          border-color: #FC8019; box-shadow: 0 0 0 3px rgba(252,128,25,0.15);
        }
        .search-input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 13px 0; font-size: 14px; font-weight: 700; color: #02060C;
        }

        .category-filter-strip {
          display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 20px;
          scrollbar-width: none;
        }
        .category-filter-strip::-webkit-scrollbar { display: none; }
        .cat-tab-btn {
          flex-shrink: 0; background: #FFFFFF; border: 1.5px solid #E2E8F0;
          padding: 9px 18px; border-radius: 50px;
          font-size: 13.5px; font-weight: 800; color: #475569;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          transition: all 0.2s;
        }
        .cat-tab-btn.active {
          background: #02060C; border-color: #02060C; color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(2,6,12,0.25);
        }
        .cat-count-pill {
          background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 900;
          padding: 2px 7px; border-radius: 50px;
        }
        .cat-tab-btn:not(.active) .cat-count-pill {
          background: #F1F5F9; color: #64748B;
        }

        /* ── SWIGGY RESTAURANT MENU ITEMS LIST ── */
        .menu-items-list {
          display: flex; flex-direction: column; gap: 16px;
        }
        .swiggy-menu-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.03);
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .swiggy-menu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(0,0,0,0.07);
          border-color: #CBD5E1;
        }

        .menu-card-left {
          flex: 1; min-width: 0;
        }
        .bestseller-badge {
          display: inline-flex; align-items: center; gap: 4px;
          color: #E55A00; font-size: 11.5px; font-weight: 900; letter-spacing: 0.4px;
          margin-bottom: 6px; text-transform: uppercase;
        }
        .item-name-title {
          font-size: 18.5px; font-weight: 900; color: #02060C; margin-bottom: 6px; line-height: 1.25;
        }
        .item-price-line {
          display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;
        }
        .item-price-now { font-size: 17.5px; font-weight: 900; color: #02060C; }
        .item-price-mrp { font-size: 13px; color: #94A3B8; text-decoration: line-through; font-weight: 700; }
        .item-disc-tag {
          background: #DCFCE7; color: #15803D; font-size: 11.5px; font-weight: 900;
          padding: 2px 8px; border-radius: 4px;
        }

        .item-desc-text {
          font-size: 13px; color: #64748B; line-height: 1.5; margin-bottom: 12px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .item-inclusions-strip {
          display: flex; gap: 6px; flex-wrap: wrap;
        }
        .mini-inc-chip {
          background: #F8FAFC; border: 1px solid #E2E8F0;
          font-size: 11.5px; font-weight: 700; color: #475569;
          padding: 4px 9px; border-radius: 6px;
        }

        /* Menu Card Right Image & 3D Add Button */
        .menu-card-right {
          position: relative; width: 140px; flex-shrink: 0;
          display: flex; flex-direction: column; align-items: center;
        }
        @media (max-width: 540px) {
          .menu-card-right { width: 118px; }
        }
        .item-thumb-box {
          width: 100%; height: 116px; border-radius: 16px; overflow: hidden;
          background: #F1F5F9; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          position: relative;
        }
        .item-thumb-3d {
          width: 100%; height: 100%; object-fit: cover;
        }
        .floating-book-cta {
          margin-top: -14px; position: relative; z-index: 2;
          background: linear-gradient(135deg, #FC8019, #FF9E42);
          color: #FFFFFF; border: none;
          font-size: 12px; font-weight: 900; letter-spacing: 0.5px;
          padding: 8px 20px; border-radius: 10px;
          cursor: pointer; box-shadow: 0 4px 12px rgba(252,128,25,0.4);
          transition: transform 0.2s; white-space: nowrap;
        }
        .floating-book-cta:hover { transform: scale(1.06); }
        .custom-tag-note {
          font-size: 10.5px; color: #94A3B8; font-weight: 700; margin-top: 6px;
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav className="studio-nav">
        <div className="studio-nav-inner">
          <button className="nav-back-btn" onClick={() => router.push('/')}>
            ← Back to Explore
          </button>
          <Logo3D size="sm" />
          <span style={{ fontSize: 11.5, fontWeight: 900, color: '#16A34A', background: '#DCFCE7', padding: '4px 10px', borderRadius: 50 }}>
            ● LIVE STUDIO
          </span>
        </div>
      </nav>

      <main className="studio-main-wrap">
        {/* ── SWIGGY PLANNER STUDIO SHOWCASE CARD ── */}
        <section className="planner-hero-card">
          <div className="planner-header-row">
            <div className="planner-title-block">
              <span className="planner-studio-badge">
                👑 VERIFIED PRO CELEBRATION STUDIO
              </span>
              <h1 className="planner-main-title">{planner.business_name}</h1>
              <p className="planner-tags-line">
                🎈 3D Balloon Sculpting · 🎂 Gourmet Cakes · 🕯️ Romantic Canopies · 📸 DSLR Shoots
              </p>
            </div>

            <div>
              <span className="rating-badge-box">
                ★ {planner.rating || '4.9'}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: '#64748B', fontWeight: 700, marginTop: 4, textAlign: 'right' }}>
                {planner.reviews_count || 142}+ Reviews
              </span>
            </div>
          </div>

          {/* Clean Info Strip */}
          <div className="planner-info-strip">
            <span>⏱️ 2 Hours Setup Arrival</span>
            <span className="info-dot">•</span>
            <span>📍 {planner.city || 'Bhopal'} Doorstep Service</span>
            <span className="info-dot">•</span>
            <span className="info-highlight">🏷️ 20% OFF Coupon Available</span>
          </div>

          {/* Contact Studio */}
          <div className="studio-actions-row">
            <a
              href={`https://wa.me/${(planner.whatsapp_number || planner.phone || '916204507166').replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hi ${planner.business_name}! I am exploring your celebration packages on Momanto 🎉.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="whatsapp-studio-btn"
            >
              💬 WhatsApp Studio Directly
            </a>
          </div>
        </section>

        {/* ── SEARCH BAR ── */}
        <div className="search-bar-wrap">
          <div className="search-input-box">
            <span style={{ fontSize: 16 }}>🔍</span>
            <input
              type="text"
              placeholder={`Search in ${planner.business_name}'s celebration menu...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* ── CATEGORY FILTER STRIP ── */}
        <div className="category-filter-strip">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`cat-tab-btn${selectedCategory === cat.key ? ' active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <span>{cat.emoji} {cat.label}</span>
              <span className="cat-count-pill">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* ── SWIGGY MENU CARDS LIST ── */}
        <div className="menu-items-list">
          {filteredPackages.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, padding: 36, textAlign: 'center', border: '1.5px solid #E2E8F0' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🎁</span>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>No matching celebrations found</h3>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Try searching for birthdays, cakes or balloon setups</p>
            </div>
          ) : (
            filteredPackages.map((pkg, idx) => {
              const price = Number(pkg.price) || 4999;
              const origPrice = pkg.original_price ? Number(pkg.original_price) : Math.round(price * 1.35);
              const discount = pkg.discount_percent || Math.round(((origPrice - price) / origPrice) * 100);

              const rawPhoto = (pkg.photos && pkg.photos[0]) ? pkg.photos[0] : null;
              const getStudioFallback = (tags) => {
                const occ = (Array.isArray(tags) ? tags.join(' ') : String(tags || '')).toLowerCase();
                if (occ.includes('anniversary') || occ.includes('romantic')) return '/images/categories/anniversary.jpg';
                if (occ.includes('wedding')) return '/images/categories/wedding.jpg';
                if (occ.includes('baby')) return '/images/categories/babyshower.jpg';
                if (occ.includes('balloon')) return '/images/categories/balloons.jpg';
                if (occ.includes('corporate')) return '/images/categories/corporate.jpg';
                if (occ.includes('surprise')) return '/images/categories/surprise.jpg';
                return '/images/categories/birthday.jpg';
              };

              let photo = getStudioFallback(pkg.occasion_tags);
              if (typeof rawPhoto === 'string' && rawPhoto.trim()) {
                let clean = rawPhoto.trim().replace(/\\/g, '/');
                if (clean.startsWith('public/')) clean = clean.replace(/^public\//, '/');
                if (clean.startsWith('uploads/')) clean = '/' + clean;
                if (clean.startsWith('/') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
                  photo = clean;
                }
              }
              const items = Array.isArray(pkg.included_items) ? pkg.included_items.slice(0, 3) : [];

              return (
                <div key={pkg.package_id || idx} className="swiggy-menu-card">
                  <div className="menu-card-left">
                    <span className="bestseller-badge">
                      ⭐ {idx === 0 ? '👑 STUDIO SIGNATURE' : '🔥 BESTSELLER'}
                    </span>
                    <h3 className="item-name-title">{pkg.package_name}</h3>
                    
                    <div className="item-price-line">
                      <span className="item-price-now">₹{price.toLocaleString('en-IN')}</span>
                      {origPrice > price && (
                        <span className="item-price-mrp">₹{origPrice.toLocaleString('en-IN')}</span>
                      )}
                      {discount > 0 && (
                        <span className="item-disc-tag">{discount}% OFF</span>
                      )}
                    </div>

                    <p className="item-desc-text">
                      {pkg.description || 'Full premium doorstep setup with decorations, cake and lighting.'}
                    </p>

                    {items.length > 0 && (
                      <div className="item-inclusions-strip">
                        {items.map((item, i) => (
                          <span key={i} className="mini-inc-chip">{item}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="menu-card-right">
                    <div className="item-thumb-box" style={{ position: 'relative' }}>
                      <img
                        src={photo}
                        alt={pkg.package_name}
                        className="item-thumb-3d"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getStudioFallback(pkg.occasion_tags);
                        }}
                      />
                      {pkg.video_url && (
                        <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                          🎥 Video
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="floating-book-cta"
                      onClick={() => router.push(`/checkout/${pkg.package_id}`)}
                    >
                      + BOOK NOW
                    </button>
                    <span className="custom-tag-note">Customizable</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
