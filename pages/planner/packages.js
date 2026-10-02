import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const QUICK_INCLUSION_SUGGESTIONS = [
  '🎂 1kg Gourmet Fresh Cake',
  '🎈 100+ Metallic Balloon Arch',
  '💡 10m Warm Fairy LED Lights',
  '🏷️ Custom Name LED Banner',
  '📸 1 Hr Pro Photographer (30 Edited Photos)',
  '👨‍🎨 2-Hour Pro Decorator Setup & Teardown',
  '💥 Party Confetti Cannon Poppers',
  '🌹 20 Red Dutch Velvet Roses',
  '🕯️ Scented Glass Candlelight Pathway',
  '🍼 Teddy Bear / Baby Props Décor',
];

const PRESET_PHOTOS = [
  { label: '🎂 Cake', url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=800' },
  { label: '🎈 Balloon Arch', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800' },
  { label: '🕯️ Candlelight', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800' },
  { label: '🍼 Baby Shower', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800' },
  { label: '💍 Wedding Mandap', url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800' },
  { label: '🎉 Birthday Party', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800' }
];

const DEFAULT_ADDON_PRESETS = [
  { id: 'add_photo', name: 'DSLR Photographer (1 Hr Coverage)', price: 999, emoji: '📸', sub: '30+ High-res digital photos' },
  { id: 'add_cake', name: 'Upgrade to 1.5kg Pinata Hammer Cake', price: 499, emoji: '🎂', sub: 'Custom design & wooden hammer' },
  { id: 'add_guitar', name: 'Live Acoustic Guitarist (30 Mins)', price: 1499, emoji: '🎶', sub: 'Top romantic & celebration songs' },
  { id: 'add_pyro', name: 'Cold Firework Pyro Entry (4 Pcs)', price: 599, emoji: '💥', sub: 'Safe indoor/outdoor sparklers' },
  { id: 'add_roses', name: 'Bouquet of 20 Red Dutch Roses', price: 399, emoji: '🌹', sub: 'Fresh premium cut roses' },
];

export default function PlannerPackages() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);

  const [formData, setFormData] = useState({
    package_name: '',
    description: '',
    price: '',
    original_price: '',
    discount_percent: '',
    coupon_code: '',
    coupon_discount: '',
    photos: [],
    video_url: '',
    included_items: '',
    custom_addons: DEFAULT_ADDON_PRESETS,
    occasion_tags: 'Birthday, Celebration',
    supported_modes: ['home', 'custom'],
    setup_time: '2–3 hrs',
    is_active: true,
    whatsapp_number: '',
    gallery_url: '',
  });

  const [photoUrl, setPhotoUrl] = useState('');
  const [photoInputMode, setPhotoInputMode] = useState('file'); // 'file' | 'url'
  const [videoInputMode, setVideoInputMode] = useState('file'); // 'file' | 'url'
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // 👁️ Detailed Live Showcase Modal State
  const [showcasePkg, setShowcasePkg] = useState(null);
  const [showcaseActivePhotoIdx, setShowcaseActivePhotoIdx] = useState(0);
  const [showcaseTab, setShowcaseTab] = useState('photos'); // 'photos' | 'video'

  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonEmoji, setNewAddonEmoji] = useState('🎁');
  const [newAddonSub, setNewAddonSub] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 📸 Safe Media Helpers
  function getSafeMediaUrl(src, tags) {
    if (!src || typeof src !== 'string') return getCategoryFallback(tags);
    let clean = src.trim().replace(/\\/g, '/');
    if (clean.startsWith('public/')) clean = clean.replace(/^public\//, '/');
    if (clean.startsWith('uploads/')) clean = '/' + clean;
    if (clean.startsWith('/') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
      return clean;
    }
    return getCategoryFallback(tags);
  }

  function getCategoryFallback(tags) {
    const occ = (Array.isArray(tags) ? tags.join(' ') : String(tags || '')).toLowerCase();
    if (occ.includes('anniversary') || occ.includes('romantic')) return '/images/categories/anniversary.jpg';
    if (occ.includes('wedding')) return '/images/categories/wedding.jpg';
    if (occ.includes('baby')) return '/images/categories/babyshower.jpg';
    if (occ.includes('balloon')) return '/images/categories/balloons.jpg';
    if (occ.includes('corporate')) return '/images/categories/corporate.jpg';
    if (occ.includes('surprise')) return '/images/categories/surprise.jpg';
    return '/images/categories/birthday.jpg';
  }

  function getVideoEmbed(url) {
    if (!url) return null;
    let clean = url.trim().replace(/\\/g, '/');
    if (clean.startsWith('public/')) clean = clean.replace(/^public\//, '/');
    if (clean.startsWith('uploads/')) clean = '/' + clean;

    if (clean.includes('youtube.com/watch?v=')) {
      const id = clean.split('v=')[1]?.split('&')[0];
      return { isDirect: false, embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1` };
    }
    if (clean.includes('youtu.be/')) {
      const id = clean.split('youtu.be/')[1]?.split('?')[0];
      return { isDirect: false, embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1` };
    }
    return { isDirect: true, embedUrl: clean };
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('planner_token');
    const plannerStr = localStorage.getItem('planner_data');
    if (!token) {
      router.push('/planner/login');
      return;
    }
    if (plannerStr) {
      try {
        setPlanner(JSON.parse(plannerStr));
      } catch {}
    }
    fetchPackages();
  }

  async function fetchPackages() {
    try {
      const token = localStorage.getItem('planner_token');
      const res = await fetch('/api/planner/packages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  }

  function handlePriceChange(priceVal, origVal) {
    const p = parseFloat(priceVal) || 0;
    const op = parseFloat(origVal) || 0;
    let disc = '';
    if (p > 0 && op > p) {
      disc = Math.round(((op - p) / op) * 100);
    }
    setFormData((prev) => ({
      ...prev,
      price: priceVal,
      original_price: origVal,
      discount_percent: disc,
    }));
  }

  // 📱 Device Photo Upload (Phone / PC / Camera)
  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingPhoto(true);
    setError('');

    const token = localStorage.getItem('planner_token');
    const uploadData = new FormData();
    files.forEach((f) => uploadData.append('files', f));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();
        const newUrls = data.urls || (data.url ? [data.url] : []);
        setFormData((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), ...newUrls],
        }));
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to upload photo(s)');
      }
    } catch {
      setError('Photo upload failed. Check network connection.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  }

  // 🎬 Device Video Upload (MP4 / MOV / WebM)
  async function handleVideoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setError('');

    const token = localStorage.getItem('planner_token');
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          video_url: data.url,
        }));
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to upload video');
      }
    } catch {
      setError('Video upload failed. Check network connection.');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  }

  function setAsCoverPhoto(idx) {
    if (idx === 0) return;
    setFormData((prev) => {
      const copy = [...prev.photos];
      const [selected] = copy.splice(idx, 1);
      return {
        ...prev,
        photos: [selected, ...copy],
      };
    });
  }

  function addPhotoUrl() {
    if (photoUrl.trim()) {
      let clean = photoUrl.trim();
      setFormData({
        ...formData,
        photos: [...formData.photos, clean],
      });
      setPhotoUrl('');
    }
  }

  function removePhotoUrl(index) {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    });
  }

  function openShowcase(pkg) {
    setShowcasePkg(pkg);
    setShowcaseActivePhotoIdx(0);
    setShowcaseTab(pkg.photos && pkg.photos.length > 0 ? 'photos' : (pkg.video_url ? 'video' : 'photos'));
  }

  function addCustomAddon() {
    if (!newAddonName.trim() || !newAddonPrice) return;
    const item = {
      id: 'addon_' + Date.now(),
      name: newAddonName.trim(),
      price: parseFloat(newAddonPrice),
      emoji: newAddonEmoji || '🎁',
      sub: newAddonSub.trim() || 'Optional celebration add-on',
    };
    setFormData({
      ...formData,
      custom_addons: [...(formData.custom_addons || []), item],
    });
    setNewAddonName('');
    setNewAddonPrice('');
    setNewAddonSub('');
  }

  function removeCustomAddon(idx) {
    setFormData({
      ...formData,
      custom_addons: formData.custom_addons.filter((_, i) => i !== idx),
    });
  }

  function openNewForm() {
    setEditingPkg(null);
    setFormData({
      package_name: '',
      description: '',
      price: '',
      original_price: '',
      discount_percent: '',
      coupon_code: '',
      coupon_discount: '',
      photos: [
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
        'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=800',
      ],
      video_url: '',
      included_items: [
        '🎂 1kg Gourmet Fresh Celebration Cake',
        '🎈 100+ Metallic Balloon Arch & Entrance Ring',
        '💡 10m Warm Fairy LED Lights & Spotlights',
        '🏷️ Custom Name & Age Milestone LED Banner',
        '👨‍🎨 2-Hour On-Site Decorator Setup & Teardown',
      ].join('\n'),
      custom_addons: DEFAULT_ADDON_PRESETS,
      occasion_tags: 'Birthday, Celebration',
      supported_modes: ['home', 'custom'],
      setup_time: '2–3 hrs',
      is_active: true,
      whatsapp_number: planner?.phone || '',
      gallery_url: '',
    });
    setPhotoUrl('');
    setShowForm(true);
    setError('');
  }

  function openEditForm(pkg) {
    setEditingPkg(pkg);
    const p = pkg.price || '';
    const op = pkg.original_price || (p ? Math.round(p * 1.35) : '');
    const disc = p && op > p ? Math.round(((op - p) / op) * 100) : '';

    setFormData({
      package_name: pkg.package_name || '',
      description: pkg.description || '',
      price: p,
      original_price: op,
      discount_percent: disc,
      coupon_code: pkg.coupon_code || '',
      coupon_discount: pkg.coupon_discount || '',
      included_items: Array.isArray(pkg.included_items) ? pkg.included_items.join('\n') : '',
      custom_addons: Array.isArray(pkg.custom_addons) && pkg.custom_addons.length > 0 ? pkg.custom_addons : DEFAULT_ADDON_PRESETS,
      occasion_tags: Array.isArray(pkg.occasion_tags) ? pkg.occasion_tags.join(', ') : '',
      supported_modes: Array.isArray(pkg.supported_modes) ? pkg.supported_modes : ['home', 'custom'],
      setup_time: pkg.setup_time || '2–3 hrs',
      video_url: pkg.video_url || '',
      is_active: pkg.is_active !== false && pkg.is_active !== 0,
      whatsapp_number: pkg.whatsapp_number || '',
      gallery_url: pkg.gallery_url || '',
      photos: Array.isArray(pkg.photos) && pkg.photos.length > 0 ? pkg.photos : [],
    });
    setPhotoUrl('');
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const included_items = formData.included_items.split('\n').filter((i) => i.trim());
    const occasion_tags = formData.occasion_tags.split(',').map((t) => t.trim()).filter((t) => t);

    const payload = {
      package_name: formData.package_name,
      description: formData.description,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : null,
      coupon_code: formData.coupon_code ? formData.coupon_code.trim().toUpperCase() : null,
      coupon_discount: formData.coupon_discount ? parseFloat(formData.coupon_discount) : null,
      included_items,
      custom_addons: formData.custom_addons || [],
      occasion_tags,
      supported_modes: formData.supported_modes,
      setup_time: formData.setup_time || '2–3 hrs',
      video_url: formData.video_url,
      is_active: formData.is_active,
      whatsapp_number: formData.whatsapp_number,
      gallery_url: formData.gallery_url,
      photos: formData.photos,
    };

    try {
      const token = localStorage.getItem('planner_token');
      const url = editingPkg
        ? `/api/planner/packages/${editingPkg.package_id}`
        : '/api/planner/packages';
      const res = await fetch(url, {
        method: editingPkg ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        fetchPackages();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save package');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(pkgId) {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const token = localStorage.getItem('planner_token');
      const res = await fetch(`/api/planner/packages/${pkgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchPackages();
      } else {
        alert('Failed to delete package');
      }
    } catch {
      alert('Error deleting package');
    }
  }

  function handleLogout() {
    localStorage.removeItem('planner_token');
    localStorage.removeItem('planner_data');
    router.push('/');
  }

  const modeOptions = [
    { key: 'home', label: '🏠 At Home / Flat' },
    { key: 'restaurant', label: '🍽️ Café & Restaurant' },
    { key: 'custom', label: '📍 Destination / Banquet' },
  ];

  return (
    <>
      <Head>
        <title>Packages & Pricing Manager | Momanto Planner</title>
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        body {
          font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #F8F9FA; color: #1C1C1C;
          -webkit-font-smoothing: antialiased;
        }
        a { text-decoration: none; color: inherit; }
        input, select, textarea, button { font-family: inherit; }

        .nav {
          position: sticky; top: 0; z-index: 200;
          background: #0A1633; color: #fff;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .nav-inner {
          max-width: 1100px; margin: 0 auto;
          padding: 12px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo-text { font-size: 20px; font-weight: 900; color: #fff; }
        .logo-text span { color: #FC8019; }
        .nav-links { display: flex; align-items: center; gap: 14px; }
        .nav-link {
          font-size: 13px; font-weight: 800; color: #94A3B8; padding: 6px 12px; border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-link:hover, .nav-link.active {
          background: rgba(255,255,255,0.12); color: #fff;
        }
        .logout-btn {
          background: #EF4444; color: #fff; border: none; font-size: 12px; font-weight: 900;
          padding: 6px 14px; border-radius: 8px; cursor: pointer;
        }

        .planner-stat-bar {
          background: linear-gradient(135deg, #0E1F44, #182C58);
          color: #fff; padding: 22px 16px 26px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .stat-container {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;
        }
        .planner-title-row { display: flex; align-items: center; gap: 12px; }
        .planner-avatar {
          width: 48px; height: 48px; border-radius: 12px; background: #FC8019;
          display: flex; align-items: center; justify-content: center; font-size: 24px;
        }
        .planner-name { font-size: 22px; font-weight: 900; color: #fff; }
        .planner-rating-pill {
          display: inline-flex; align-items: center; gap: 4px;
          background: #1DB954; color: #fff; font-size: 11.5px; font-weight: 900;
          padding: 3px 8px; border-radius: 6px; margin-top: 4px;
        }

        .btn-add-new-pkg {
          background: linear-gradient(135deg, #FC8019, #FF9E42);
          color: #fff; border: none; font-size: 13.5px; font-weight: 900;
          padding: 11px 22px; border-radius: 12px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(252,128,25,0.4);
          transition: transform 0.2s;
        }
        .btn-add-new-pkg:hover { transform: scale(1.04); }

        .packages-grid-container {
          max-width: 1100px; margin: 20px auto 40px; padding: 0 16px;
        }
        .grid-cards {
          display: grid; grid-template-columns: 1fr; gap: 18px;
        }
        @media (min-width: 640px) {
          .grid-cards { grid-template-columns: repeat(2, 1fr); gap: 20px; }
        }
        @media (min-width: 960px) {
          .grid-cards { grid-template-columns: repeat(3, 1fr); gap: 24px; }
        }

        .pkg-dash-card {
          background: #fff; border: 1.5px solid #ECECF0; border-radius: 20px;
          overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          display: flex; flex-direction: column;
        }
        .pkg-card-media {
          position: relative; height: 180px; width: 100%; background: #000;
        }
        .pkg-card-media img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .media-disc-badge {
          position: absolute; top: 12px; left: 12px;
          background: #EF4444; color: #fff; font-size: 11px; font-weight: 900;
          padding: 4px 10px; border-radius: 6px;
        }
        .media-video-badge {
          position: absolute; bottom: 12px; left: 12px;
          background: rgba(0,0,0,0.75); color: #fff; font-size: 11px; font-weight: 800;
          padding: 3px 8px; border-radius: 6px; backdrop-filter: blur(4px);
        }
        .pkg-card-content {
          padding: 16px; display: flex; flex-direction: column; flex: 1;
        }
        .pkg-name-title { font-size: 17px; font-weight: 900; color: #1C1C1C; margin-bottom: 4px; }
        .pkg-desc-text { font-size: 12.5px; color: #64748B; margin-bottom: 12px; line-height: 1.4; flex: 1; }
        .pkg-price-row {
          display: flex; align-items: baseline; justify-content: space-between;
          padding-top: 10px; border-top: 1px solid #ECECF0; margin-top: auto;
        }
        .price-text-box { display: flex; align-items: baseline; gap: 6px; }
        .price-bold { font-size: 20px; font-weight: 900; color: #1C1C1C; }
        .price-strike { font-size: 12.5px; color: #94A3B8; text-decoration: line-through; }
        
        .card-actions-row {
          display: flex; gap: 8px; margin-top: 12px;
        }
        .btn-edit-action {
          flex: 1; background: #FFF3E9; color: #E55A00; border: 1.5px solid #FFD1B3;
          border-radius: 10px; padding: 8px; font-size: 12.5px; font-weight: 900; cursor: pointer;
        }
        .btn-delete-action {
          background: #FEE2E2; color: #DC2626; border: 1.5px solid #FECACA;
          border-radius: 10px; padding: 8px 12px; font-size: 12.5px; font-weight: 900; cursor: pointer;
        }
        .btn-showcase-action {
          background: #0A1633; color: #fff; border: 1.5px solid #0A1633;
          border-radius: 10px; padding: 8px 12px; font-size: 12.5px; font-weight: 900;
          cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
          transition: all 0.2s;
        }
        .btn-showcase-action:hover {
          background: #182C58; border-color: #182C58; transform: translateY(-1px);
        }

        .media-badge-top-left {
          position: absolute; top: 12px; left: 12px; display: flex; gap: 6px; z-index: 2;
        }
        .media-photo-count-badge {
          background: rgba(10,22,51,0.85); color: #fff; font-size: 11px; font-weight: 900;
          padding: 4px 9px; border-radius: 6px; backdrop-filter: blur(4px);
        }
        .media-video-badge {
          position: absolute; bottom: 12px; left: 12px; z-index: 2;
          background: rgba(0,0,0,0.85); color: #fff; font-size: 11px; font-weight: 900;
          padding: 4px 10px; border-radius: 6px; backdrop-filter: blur(4px);
          display: flex; align-items: center; gap: 5px; border: 1px solid rgba(255,255,255,0.2);
        }

        /* ── DUAL-MODE MEDIA TOGGLES & UPLOAD DROPZONES ── */
        .media-mode-toggle {
          display: flex; gap: 6px; margin-bottom: 12px; background: #F1F5F9;
          padding: 4px; border-radius: 12px;
        }
        .media-mode-btn {
          flex: 1; border: none; padding: 8px 12px; border-radius: 9px;
          font-size: 12px; font-weight: 800; cursor: pointer; background: transparent; color: #64748B;
          transition: all 0.2s;
        }
        .media-mode-btn.active {
          background: #0A1633; color: #fff; box-shadow: 0 2px 8px rgba(10,22,51,0.2);
        }

        .upload-dropzone {
          border: 2px dashed #CBD5E1; border-radius: 16px; padding: 22px 16px;
          text-align: center; cursor: pointer; background: #F8FAFC; transition: all 0.2s;
          display: block; position: relative;
        }
        .upload-dropzone:hover {
          border-color: #FC8019; background: #FFF7ED;
        }
        .upload-dropzone.video-dropzone:hover {
          border-color: #8B5CF6; background: #F5F3FF;
        }
        .upload-dropzone-inner {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .dropzone-icon { font-size: 32px; display: block; }
        .dropzone-title { font-size: 13.5px; font-weight: 900; color: #1E293B; }
        .dropzone-sub { font-size: 11px; font-weight: 600; color: #64748B; }

        .upload-status-bar {
          background: #EFF6FF; border: 1.5px solid #BFDBFE; color: #1D4ED8;
          padding: 8px 12px; border-radius: 10px; font-size: 12px; font-weight: 800;
          display: flex; align-items: center; gap: 8px; margin-top: 8px;
        }

        /* 📸 Photo Management Grid */
        .photo-preview-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
          gap: 10px; margin-top: 12px;
        }
        .photo-preview-card {
          position: relative; height: 92px; border-radius: 12px; overflow: hidden;
          border: 1.5px solid #E2E8F0; background: #000;
        }
        .photo-preview-card img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .cover-photo-badge {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(252,128,25,0.95); color: #fff; font-size: 9px; font-weight: 900;
          text-align: center; padding: 2px 0; text-transform: uppercase; letter-spacing: 0.3px;
        }
        .btn-set-cover-action {
          position: absolute; bottom: 4px; left: 4px; right: 4px;
          background: rgba(0,0,0,0.72); color: #fff; border: none; font-size: 8.5px; font-weight: 800;
          padding: 3px 0; border-radius: 4px; cursor: pointer; text-align: center;
        }
        .btn-set-cover-action:hover { background: #FC8019; }
        .btn-remove-photo-corner {
          position: absolute; top: 4px; right: 4px;
          background: rgba(0,0,0,0.75); color: #fff; border: none; border-radius: 50%;
          width: 20px; height: 20px; font-size: 11px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .btn-remove-photo-corner:hover { background: #DC2626; }

        /* 🎥 Video Preview Player Box */
        .video-preview-box {
          margin-top: 12px; background: #0F172A; border-radius: 16px;
          overflow: hidden; border: 1.5px solid #1E293B;
        }
        .video-preview-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 14px; background: #1E293B; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .preview-video-element {
          width: 100%; height: 200px; display: block; object-fit: contain; background: #000;
        }
        .btn-remove-video {
          background: #EF4444; color: #fff; border: none; font-size: 11px; font-weight: 800;
          padding: 4px 10px; border-radius: 6px; cursor: pointer;
        }

        /* ── DETAILED LIVE SHOWCASE MODAL ── */
        .showcase-overlay {
          position: fixed; inset: 0; z-index: 2500;
          background: rgba(2, 6, 12, 0.85); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .showcase-box {
          background: #fff; width: 100%; max-width: 820px; max-height: 92vh;
          border-radius: 24px; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.4);
          display: flex; flex-direction: column;
        }
        .showcase-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px; border-bottom: 1px solid #ECECF0; background: #FAFBFD;
          position: sticky; top: 0; z-index: 10;
        }
        .showcase-media-viewport {
          position: relative; height: 320px; width: 100%; background: #02060C;
          overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        .showcase-hero-img {
          width: 100%; height: 100%; object-fit: contain;
        }
        .showcase-nav-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.9); color: #02060C; border: none;
          width: 36px; height: 36px; border-radius: 50%; font-size: 16px; font-weight: 900;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 3; transition: transform 0.15s;
        }
        .showcase-nav-btn:hover { transform: translateY(-50%) scale(1.1); }
        .showcase-nav-btn.prev { left: 14px; }
        .showcase-nav-btn.next { right: 14px; }

        .showcase-media-tabs {
          display: flex; gap: 8px; padding: 12px 22px; background: #F8FAFC;
          border-bottom: 1px solid #ECECF0;
        }
        .showcase-tab-btn {
          background: #fff; border: 1.5px solid #E2E8F0; padding: 6px 14px; border-radius: 20px;
          font-size: 12.5px; font-weight: 800; color: #475569; cursor: pointer;
        }
        .showcase-tab-btn.active {
          background: #FC8019; border-color: #FC8019; color: #fff;
        }
        .showcase-thumb-row {
          display: flex; gap: 8px; padding: 10px 22px; overflow-x: auto; background: #fff;
          border-bottom: 1px solid #ECECF0;
        }
        .showcase-thumb-item {
          width: 60px; height: 60px; border-radius: 8px; overflow: hidden;
          flex-shrink: 0; cursor: pointer; border: 2px solid transparent; opacity: 0.6;
          transition: all 0.2s;
        }
        .showcase-thumb-item.active {
          border-color: #FC8019; opacity: 1; transform: scale(1.05);
        }
        .showcase-thumb-item img {
          width: 100%; height: 100%; object-fit: cover;
        }

        .showcase-body {
          padding: 22px; display: flex; flex-direction: column; gap: 20px;
        }
        .showcase-inclusions-list {
          display: flex; flex-direction: column; gap: 8px;
        }
        .showcase-inc-row {
          display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;
          font-weight: 700; color: #1E293B; background: #F8FAFC; padding: 8px 12px;
          border-radius: 10px; border: 1px solid #F1F5F9;
        }
        .showcase-addon-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;
        }
        .showcase-addon-card {
          background: #FAFBFD; border: 1.5px solid #E2E8F0; border-radius: 12px;
          padding: 10px 12px; display: flex; align-items: center; justify-content: space-between;
        }

        /* ── MODAL FORM ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .modal-box {
          background: #fff; width: 100%; max-width: 680px; max-height: 90vh;
          border-radius: 24px; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          padding: 24px;
        }
        .modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 14px; border-bottom: 1px solid #ECECF0; margin-bottom: 18px;
        }
        .modal-title { font-size: 20px; font-weight: 900; color: #1C1C1C; }
        .modal-close {
          width: 32px; height: 32px; border-radius: 50%; background: #F1F5F9; border: none;
          display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer;
        }

        .form-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;
        }
        .form-group {
          margin-bottom: 14px;
        }
        .form-label {
          display: block; font-size: 12px; font-weight: 900; color: #1C1C1C;
          text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px;
        }
        .form-input {
          width: 100%; border: 1.5px solid #ECECF0; border-radius: 12px;
          padding: 10px 14px; font-size: 14px; font-weight: 700; color: #1C1C1C;
          outline: none; transition: border 0.2s;
        }
        .form-input:focus { border-color: #FC8019; }
        .form-textarea { resize: vertical; min-height: 80px; }

        .addon-item-row {
          display: flex; align-items: center; gap: 8px; background: #F8F9FA;
          border: 1px solid #ECECF0; border-radius: 10px; padding: 8px 12px; margin-bottom: 6px;
        }
        .addon-item-name { font-size: 13px; font-weight: 800; color: #1C1C1C; flex: 1; }
        .addon-item-price { font-size: 13px; font-weight: 900; color: #16A34A; }
        .btn-remove-addon {
          background: #FEE2E2; color: #EF4444; border: none; border-radius: 6px;
          padding: 4px 8px; font-size: 11px; font-weight: 900; cursor: pointer;
        }

        .modal-foot-actions {
          display: flex; gap: 12px; margin-top: 20px; padding-top: 14px; border-top: 1px solid #ECECF0;
        }
        .btn-save-pkg {
          flex: 1; background: linear-gradient(135deg, #FC8019, #FF9E42);
          color: #fff; border: none; font-size: 14px; font-weight: 900;
          padding: 13px; border-radius: 12px; cursor: pointer;
        }
        .btn-cancel-modal {
          background: #F1F5F9; color: #64748B; border: none; font-size: 13.5px; font-weight: 800;
          padding: 13px 20px; border-radius: 12px; cursor: pointer;
        }
      `}</style>

      {/* ── Top Navigation ── */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo-text">
            Moman<span>to</span> Planner
          </Link>
          <div className="nav-links">
            <Link href="/planner/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link href="/planner/orders" className="nav-link">
              Orders
            </Link>
            <Link href="/planner/packages" className="nav-link active">
              Packages & Pricing
            </Link>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Planner Stats & Rating Banner ── */}
      <div className="planner-stat-bar">
        <div className="stat-container">
          <div className="planner-title-row">
            <div className="planner-avatar">👨‍🎨</div>
            <div>
              <h1 className="planner-name">{planner?.business_name || 'Verified Planner Studio'}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="planner-rating-pill">⭐ 4.9 Verified Host</span>
                <span style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 700 }}>
                  📍 {planner?.city || 'Bhopal'} · 140+ Celebrations Completed
                </span>
              </div>
            </div>
          </div>

          <button className="btn-add-new-pkg" onClick={openNewForm}>
            ➕ Create New Package
          </button>
        </div>
      </div>

      {/* ── Packages Grid ── */}
      <div className="packages-grid-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>Your Live Celebration Packages ({packages.length})</h2>
          <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 800 }}>● Instant Sync to Homepage</span>
        </div>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 50, textAlign: 'center', border: '1.5px solid #ECECF0' }}>
            <div style={{ width: 36, height: 36, border: '3.5px solid #E2E8F0', borderTopColor: '#FC8019', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, fontWeight: 800, color: '#64748B' }}>Loading your celebration packages…</p>
          </div>
        ) : packages.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', border: '1.5px solid #ECECF0' }}>
            <span style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>🎁</span>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>No celebration packages added yet</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Create your first package with photos, cake, decor items and discounts!</p>
            <button className="btn-add-new-pkg" onClick={openNewForm}>+ Add First Package</button>
          </div>
        ) : (
          <div className="grid-cards">
            {packages.map((pkg) => {
              const p = Number(pkg.price) || 0;
              const op = Number(pkg.original_price) || Math.round(p * 1.35);
              const disc = pkg.discount_percent || Math.round(((op - p) / op) * 100);

              return (
                <div key={pkg.package_id} className="pkg-dash-card">
                  <div className="pkg-card-media">
                    <img
                      src={getSafeMediaUrl(pkg.photos?.[0], pkg.occasion_tags)}
                      alt={pkg.package_name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getCategoryFallback(pkg.occasion_tags);
                      }}
                    />
                    <div className="media-badge-top-left">
                      {disc > 0 && <span className="media-disc-badge">{disc}% OFF</span>}
                      <span className="media-photo-count-badge">
                        📸 {pkg.photos?.length || 1} {pkg.photos?.length === 1 ? 'Photo' : 'Photos'}
                      </span>
                    </div>
                    {pkg.video_url && (
                      <span className="media-video-badge">
                        🎥 Video Setup Attached
                      </span>
                    )}
                  </div>

                  <div className="pkg-card-content">
                    <h3 className="pkg-name-title">{pkg.package_name}</h3>
                    <p className="pkg-desc-text">{pkg.description || 'No description provided'}</p>

                    <div className="pkg-price-row">
                      <div className="price-text-box">
                        <span className="price-bold">₹{p.toLocaleString('en-IN')}</span>
                        {op > p && <span className="price-strike">₹{op.toLocaleString('en-IN')}</span>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 4 }}>
                        {pkg.is_active ? 'Active' : 'Draft'}
                      </span>
                    </div>

                    <div className="card-actions-row">
                      <button
                        className="btn-showcase-action"
                        type="button"
                        onClick={() => openShowcase(pkg)}
                        title="View Full Detailed Customer Showcase"
                      >
                        👁️ Live Showcase
                      </button>
                      <button className="btn-edit-action" type="button" onClick={() => openEditForm(pkg)}>
                        ✏️ Edit
                      </button>
                      <button className="btn-delete-action" type="button" onClick={() => handleDelete(pkg.package_id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ADD / EDIT PACKAGE MODAL ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">
                {editingPkg ? '✏️ Edit Celebration Package' : '➕ Create New Package'}
              </h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 800, marginBottom: 14 }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Package Name *</label>
                <input
                  required
                  type="text"
                  value={formData.package_name}
                  onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                  placeholder="e.g. Royal 3D Birthday Bash"
                  className="form-input"
                />
              </div>

              {/* 💰 PRICING & DISCOUNT SECTION */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Selling Price (₹) *</label>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => handlePriceChange(e.target.value, formData.original_price)}
                    placeholder="e.g. 4999"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Original MRP (₹) (For Discount %)</label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => handlePriceChange(formData.price, e.target.value)}
                    placeholder="e.g. 6999"
                    className="form-input"
                  />
                </div>
              </div>

              {/* 🎟️ PLANNER CUSTOM COUPON CODE CONFIGURATION */}
              <div className="form-grid-2" style={{ background: '#FFF7ED', padding: 12, borderRadius: 14, border: '1.5px dashed #FDBA74', marginBottom: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#C2410C' }}>🎟️ Custom Promo / Coupon Code</label>
                  <input
                    type="text"
                    value={formData.coupon_code || ''}
                    onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="e.g. ROYAL20 or PARTY500"
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontWeight: 900, letterSpacing: 1 }}
                  />
                  <span style={{ fontSize: 10.5, color: '#9A3412', fontWeight: 600 }}>Only this code will work at checkout for this package</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#C2410C' }}>Discount Amount (₹) or %</label>
                  <input
                    type="number"
                    value={formData.coupon_discount || ''}
                    onChange={(e) => setFormData({ ...formData, coupon_discount: e.target.value })}
                    placeholder="e.g. 500 (Flat ₹) or 20 (%)"
                    className="form-input"
                  />
                  <span style={{ fontSize: 10.5, color: '#9A3412', fontWeight: 600 }}>Discount subtracted when customer applies code</span>
                </div>
              </div>

              {formData.discount_percent > 0 && (
                <div style={{ background: '#FFF3E9', border: '1px solid #FFE4D6', color: '#E55A00', padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800, marginBottom: 14 }}>
                  🏷️ Active Customer Discount: <strong>{formData.discount_percent}% OFF</strong> (Customer saves ₹{(parseFloat(formData.original_price) - parseFloat(formData.price)).toLocaleString('en-IN')})
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Package Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe theme colors, setup duration, and what makes this celebration special..."
                  className="form-input form-textarea"
                />
              </div>

              {/* 📸 MULTI-PHOTO GALLERY & UPLOAD */}
              <div className="form-group" style={{ background: '#FAFBFD', padding: 16, borderRadius: 16, border: '1.5px solid #E2E8F0', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>📸 Celebration Photos ({formData.photos?.length || 0})</label>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#FC8019' }}>First Photo is Cover</span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="media-mode-toggle">
                  <button
                    type="button"
                    className={`media-mode-btn ${photoInputMode === 'file' ? 'active' : ''}`}
                    onClick={() => setPhotoInputMode('file')}
                  >
                    📱 Upload from Phone / PC
                  </button>
                  <button
                    type="button"
                    className={`media-mode-btn ${photoInputMode === 'url' ? 'active' : ''}`}
                    onClick={() => setPhotoInputMode('url')}
                  >
                    🌐 Paste URL & Presets
                  </button>
                </div>

                {photoInputMode === 'file' ? (
                  <div>
                    <label className="upload-dropzone">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingPhoto}
                      />
                      <div className="upload-dropzone-inner">
                        <span className="dropzone-icon">{uploadingPhoto ? '⏳' : '📷'}</span>
                        <p className="dropzone-title">
                          {uploadingPhoto ? 'Uploading Photos...' : 'Tap or Drop Photos from Phone / Computer'}
                        </p>
                        <span className="dropzone-sub">
                          Supports high-res JPG, PNG, WEBP from your camera gallery or file system
                        </span>
                      </div>
                    </label>

                    {uploadingPhoto && (
                      <div className="upload-status-bar">
                        <span>⏳</span> Uploading photo(s) to server... please wait
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="Paste image URL (https://...)"
                        className="form-input"
                      />
                      <button
                        type="button"
                        onClick={addPhotoUrl}
                        style={{ background: '#0A1633', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', fontWeight: 900, cursor: 'pointer' }}
                      >
                        + Add
                      </button>
                    </div>

                    {/* Quick Photo Presets */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, alignSelf: 'center' }}>Presets:</span>
                      {PRESET_PHOTOS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            if (!formData.photos.includes(p.url)) {
                              setFormData({ ...formData, photos: [...formData.photos, p.url] });
                            }
                          }}
                          style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Previews & Management Grid */}
                {formData.photos.length > 0 ? (
                  <div className="photo-preview-grid">
                    {formData.photos.map((url, i) => (
                      <div key={i} className="photo-preview-card">
                        <img
                          src={getSafeMediaUrl(url, formData.occasion_tags)}
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getCategoryFallback(formData.occasion_tags);
                          }}
                        />
                        {i === 0 ? (
                          <div className="cover-photo-badge">⭐ Cover Photo</div>
                        ) : (
                          <button
                            type="button"
                            className="btn-set-cover-action"
                            onClick={() => setAsCoverPhoto(i)}
                            title="Make this the main cover photo for homepage display"
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-remove-photo-corner"
                          onClick={() => removePhotoUrl(i)}
                          title="Remove Photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
                    No photos added yet. Upload at least one photo for customer showcase.
                  </p>
                )}
              </div>

              {/* 🎥 SETUP VIDEO / REEL UPLOAD */}
              <div className="form-group" style={{ background: '#F8FAFC', padding: 16, borderRadius: 16, border: '1.5px solid #E2E8F0', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>🎥 Sample Setup Video / Reel</label>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#8B5CF6' }}>High Engagement Showcase</span>
                </div>

                <div className="media-mode-toggle">
                  <button
                    type="button"
                    className={`media-mode-btn ${videoInputMode === 'file' ? 'active' : ''}`}
                    onClick={() => setVideoInputMode('file')}
                  >
                    📱 Upload Video File
                  </button>
                  <button
                    type="button"
                    className={`media-mode-btn ${videoInputMode === 'url' ? 'active' : ''}`}
                    onClick={() => setVideoInputMode('url')}
                  >
                    🔗 Video / Reel Link
                  </button>
                </div>

                {videoInputMode === 'file' ? (
                  <div>
                    <label className="upload-dropzone video-dropzone">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={handleVideoUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingVideo}
                      />
                      <div className="upload-dropzone-inner">
                        <span className="dropzone-icon">{uploadingVideo ? '⏳' : '🎬'}</span>
                        <p className="dropzone-title">
                          {uploadingVideo ? 'Uploading Video...' : 'Tap to Upload Real Setup Video / Reel'}
                        </p>
                        <span className="dropzone-sub">
                          Upload directly from phone or system (MP4, MOV, WebM - Up to 100MB)
                        </span>
                      </div>
                    </label>

                    {uploadingVideo && (
                      <div className="upload-status-bar" style={{ background: '#FAF5FF', borderColor: '#DDD6FE', color: '#7C3AED' }}>
                        <span>⏳</span> Uploading video file... please wait
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="e.g. YouTube / Reel / MP4 link (https://www.youtube.com/watch?v=...)"
                      className="form-input"
                    />
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 4, display: 'block' }}>
                      Paste YouTube, Instagram reel, or direct video URL
                    </span>
                  </div>
                )}

                {/* Live Video Preview in Form */}
                {formData.video_url && (
                  <div className="video-preview-box">
                    <div className="video-preview-header">
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#10B981' }}>
                        ▶ Setup Video Attached & Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, video_url: '' })}
                        className="btn-remove-video"
                      >
                        ✕ Remove Video
                      </button>
                    </div>
                    {(() => {
                      const v = getVideoEmbed(formData.video_url);
                      if (!v) return null;
                      return v.isDirect ? (
                        <video src={v.embedUrl} controls className="preview-video-element" />
                      ) : (
                        <iframe
                          src={v.embedUrl}
                          title="Celebration Video"
                          className="preview-video-element"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* ✨ ITEMIZED INCLUSIONS */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label">✨ What's Included ("Kya Kya Dega")</label>
                  <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 800 }}>Itemized Inclusions</span>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, alignSelf: 'center' }}>+ Add:</span>
                  {QUICK_INCLUSION_SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const cur = formData.included_items ? formData.included_items.split('\n').filter(Boolean) : [];
                        if (!cur.includes(item)) {
                          setFormData({ ...formData, included_items: [...cur, item].join('\n') });
                        }
                      }}
                      style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#15803D', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      + {item}
                    </button>
                  ))}
                </div>

                <textarea
                  value={formData.included_items}
                  onChange={(e) => setFormData({ ...formData, included_items: e.target.value })}
                  placeholder="One item per line (e.g. 🎂 1kg Gourmet Cake&#10;🎈 100 Balloon Arch&#10;💡 Fairy LED Lights)"
                  className="form-input form-textarea"
                  style={{ minHeight: 100 }}
                />
              </div>

              {/* 🎁 CUSTOM ADD-ONS BUILDER */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label">🎁 Celebration Add-ons & Extra Pricing</label>
                  <span style={{ fontSize: 11, color: '#FC8019', fontWeight: 800 }}>Swiggy Customizations</span>
                </div>

                {formData.custom_addons?.map((addon, idx) => (
                  <div key={idx} className="addon-item-row">
                    <span style={{ fontSize: 18 }}>{addon.emoji || '🎁'}</span>
                    <div className="addon-item-name">
                      {addon.name}
                      <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, display: 'block' }}>{addon.sub}</span>
                    </div>
                    <span className="addon-item-price">+₹{addon.price}</span>
                    <button type="button" className="btn-remove-addon" onClick={() => removeCustomAddon(idx)}>✕</button>
                  </div>
                ))}

                {/* Add new addon inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px auto', gap: 6, marginTop: 8 }}>
                  <input
                    type="text"
                    value={newAddonEmoji}
                    onChange={(e) => setNewAddonEmoji(e.target.value)}
                    placeholder="🎁"
                    className="form-input"
                    style={{ textAlign: 'center', padding: '8px' }}
                  />
                  <input
                    type="text"
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    placeholder="Addon Title (e.g. Live Singer)"
                    className="form-input"
                  />
                  <input
                    type="number"
                    value={newAddonPrice}
                    onChange={(e) => setNewAddonPrice(e.target.value)}
                    placeholder="₹ Price"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={addCustomAddon}
                    style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '0 14px', fontWeight: 900, cursor: 'pointer' }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Supported Modes */}
              <div className="form-group">
                <label className="form-label">Supported Setup Locations</label>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {modeOptions.map((m) => (
                    <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                      <input
                        type="checkbox"
                        checked={formData.supported_modes?.includes(m.key)}
                        onChange={(e) => {
                          const modes = e.target.checked
                            ? [...(formData.supported_modes || []), m.key]
                            : (formData.supported_modes || []).filter((k) => k !== m.key);
                          setFormData({ ...formData, supported_modes: modes });
                        }}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-foot-actions">
                <button type="submit" disabled={saving} className="btn-save-pkg">
                  {saving ? '⏳ Saving...' : editingPkg ? '✅ Update Package & Addons' : '➕ Save Package & Publish'}
                </button>
                <button type="button" className="btn-cancel-modal" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAILED LIVE SHOWCASE MODAL ── */}
      {showcasePkg && (
        <div className="showcase-overlay" onClick={() => setShowcasePkg(null)}>
          <div className="showcase-box" onClick={(e) => e.stopPropagation()}>
            <div className="showcase-header">
              <div>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#FC8019', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  👑 Live Customer Showcase
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                  {showcasePkg.package_name}
                </h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4, fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                  <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: 6, fontWeight: 900 }}>
                    ★ 4.9 Verified Host
                  </span>
                  <span>📍 {planner?.city || 'Bhopal'}</span>
                  <span>⏱️ {showcasePkg.setup_time || '2–3 hrs setup'}</span>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowcasePkg(null)}
                style={{ cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Media Navigation Tabs */}
            <div className="showcase-media-tabs">
              <button
                type="button"
                className={`showcase-tab-btn ${showcaseTab === 'photos' ? 'active' : ''}`}
                onClick={() => setShowcaseTab('photos')}
              >
                📸 Celebration Photos ({showcasePkg.photos?.length || 1})
              </button>
              {showcasePkg.video_url && (
                <button
                  type="button"
                  className={`showcase-tab-btn ${showcaseTab === 'video' ? 'active' : ''}`}
                  onClick={() => setShowcaseTab('video')}
                >
                  🎥 Watch Real Setup Video
                </button>
              )}
            </div>

            {/* Media Viewport */}
            <div className="showcase-media-viewport">
              {showcaseTab === 'video' && showcasePkg.video_url ? (
                (() => {
                  const v = getVideoEmbed(showcasePkg.video_url);
                  return v?.isDirect ? (
                    <video src={v.embedUrl} controls autoPlay className="showcase-hero-img" />
                  ) : (
                    <iframe
                      src={v?.embedUrl}
                      title="Setup Video"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                })()
              ) : (
                <>
                  <img
                    src={getSafeMediaUrl(
                      (showcasePkg.photos && showcasePkg.photos[showcaseActivePhotoIdx]) || showcasePkg.photos?.[0],
                      showcasePkg.occasion_tags
                    )}
                    alt={showcasePkg.package_name}
                    className="showcase-hero-img"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getCategoryFallback(showcasePkg.occasion_tags);
                    }}
                  />
                  {showcasePkg.photos?.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="showcase-nav-btn prev"
                        onClick={() =>
                          setShowcaseActivePhotoIdx(
                            (showcaseActivePhotoIdx - 1 + showcasePkg.photos.length) % showcasePkg.photos.length
                          )
                        }
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="showcase-nav-btn next"
                        onClick={() =>
                          setShowcaseActivePhotoIdx((showcaseActivePhotoIdx + 1) % showcasePkg.photos.length)
                        }
                      >
                        ›
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Thumbnail Row */}
            {showcaseTab === 'photos' && showcasePkg.photos?.length > 1 && (
              <div className="showcase-thumb-row">
                {showcasePkg.photos.map((pUrl, idx) => (
                  <div
                    key={idx}
                    className={`showcase-thumb-item ${showcaseActivePhotoIdx === idx ? 'active' : ''}`}
                    onClick={() => setShowcaseActivePhotoIdx(idx)}
                  >
                    <img
                      src={getSafeMediaUrl(pUrl, showcasePkg.occasion_tags)}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getCategoryFallback(showcasePkg.occasion_tags);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Showcase Details & Information */}
            <div className="showcase-body">
              {/* Pricing & Savings Box */}
              <div style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#C2410C' }}>
                      ₹{Number(showcasePkg.price).toLocaleString('en-IN')}
                    </span>
                    {showcasePkg.original_price > showcasePkg.price && (
                      <span style={{ fontSize: 16, color: '#94A3B8', textDecoration: 'line-through', fontWeight: 700 }}>
                        ₹{Number(showcasePkg.original_price).toLocaleString('en-IN')}
                      </span>
                    )}
                    {showcasePkg.discount_percent > 0 && (
                      <span style={{ background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 900, padding: '3px 8px', borderRadius: 6 }}>
                        {showcasePkg.discount_percent}% OFF
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#9A3412', fontWeight: 700 }}>
                    Inclusive of full decoration, cake delivery & setup arrival
                  </span>
                </div>

                {showcasePkg.coupon_code && (
                  <div style={{ background: '#fff', border: '1.5px dashed #F97316', padding: '8px 14px', borderRadius: 12, textAlign: 'center' }}>
                    <span style={{ fontSize: 11, color: '#C2410C', fontWeight: 800, display: 'block' }}>🎟️ PROMO CODE</span>
                    <strong style={{ fontSize: 14, color: '#EA580C', letterSpacing: 1 }}>{showcasePkg.coupon_code}</strong>
                    {showcasePkg.coupon_discount && (
                      <span style={{ fontSize: 11, color: '#16A34A', display: 'block', fontWeight: 800 }}>
                        Extra ₹{showcasePkg.coupon_discount} OFF
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {showcasePkg.description && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>
                    About This Celebration
                  </h4>
                  <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{showcasePkg.description}</p>
                </div>
              )}

              {/* What's Included */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#16A34A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✨ What's Included ("Kya Kya Dega")
                </h4>
                <div className="showcase-inclusions-list">
                  {(Array.isArray(showcasePkg.included_items) ? showcasePkg.included_items : (showcasePkg.included_items || '').split('\n')).filter(Boolean).map((inc, i) => (
                    <div key={i} className="showcase-inc-row">
                      <span style={{ color: '#16A34A', fontWeight: 900 }}>✓</span>
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              {Array.isArray(showcasePkg.custom_addons) && showcasePkg.custom_addons.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#FC8019', marginBottom: 8 }}>
                    🎁 Celebration Add-ons & Extra Upgrades
                  </h4>
                  <div className="showcase-addon-grid">
                    {showcasePkg.custom_addons.map((ad, i) => (
                      <div key={i} className="showcase-addon-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>{ad.emoji || '🎁'}</span>
                          <div>
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1E293B', display: 'block' }}>{ad.name}</span>
                            {ad.sub && <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>{ad.sub}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#16A34A' }}>+₹{ad.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supported Locations */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #ECECF0' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#64748B' }}>Supported Locations:</span>
                {(showcasePkg.supported_modes || ['home', 'custom']).map((mode) => (
                  <span key={mode} style={{ background: '#F1F5F9', color: '#334155', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>
                    {mode === 'home' ? '🏠 At Home' : mode === 'restaurant' ? '🍽️ Café & Restaurant' : '📍 Destination / Banquet'}
                  </span>
                ))}
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const target = showcasePkg;
                    setShowcasePkg(null);
                    openEditForm(target);
                  }}
                  style={{ flex: 1, background: '#FFF3E9', color: '#E55A00', border: '1.5px solid #FFD1B3', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
                >
                  ✏️ Edit This Package
                </button>
                <Link
                  href={`/checkout/${showcasePkg.package_id}`}
                  target="_blank"
                  style={{ flex: 1, background: '#0A1633', color: '#fff', textAlign: 'center', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 900, textDecoration: 'none' }}
                >
                  🔗 Open Customer Checkout
                </Link>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Check out this celebration package on Momanto! 🎉\n\n*${showcasePkg.package_name}*\nPrice: ₹${showcasePkg.price}\nBook here: http://localhost:3000/checkout/${showcasePkg.package_id}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 18px', borderRadius: 12, fontSize: 14, fontWeight: 900, textDecoration: 'none' }}
                >
                  💬 Share on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
