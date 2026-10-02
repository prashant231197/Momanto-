import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo3D from '../components/Logo3D';

const occasions = [
  { label: 'Birthday', emoji: '🎂', image: '/images/categories/birthday.jpg', tag: 'From ₹1,999' },
  { label: 'Anniversary', emoji: '🥂', image: '/images/categories/anniversary.jpg', tag: 'Flat ₹500 OFF' },
  { label: 'Wedding', emoji: '💍', image: '/images/categories/wedding.jpg', tag: 'Grand Mandap' },
  { label: 'Surprise Party', emoji: '❤️', image: '/images/categories/surprise.jpg', tag: '60s Booking' },
  { label: 'Balloon Décor', emoji: '🎈', image: '/images/categories/balloons.jpg', tag: 'Trending' },
  { label: 'Baby Shower', emoji: '🍼', image: '/images/categories/babyshower.jpg', tag: 'Pastel Theme' },
  { label: 'Corporate', emoji: '💼', image: '/images/categories/corporate.jpg', tag: 'Stage Setup' },
  { label: 'Festive Sweets', emoji: '🍬', image: '/images/categories/sweets.jpg', tag: 'Free Hamper' },
];

const subNavTabs = [
  { id: 'all', label: 'ALL CELEBRATIONS', icon: '🎉' },
  { id: 'express', label: '2-HR EXPRESS', icon: '⚡' },
  { id: 'offers', label: 'MEGA OFFERS', icon: '🏷️' },
  { id: 'weddings', label: 'LUXURY WEDDINGS', icon: '💍' },
  { id: 'balloons', label: 'BALLOON STORE', icon: '🎈' },
  { id: 'midnight', label: 'MIDNIGHT SURPRISE', icon: '🌙' },
];

const promotionalSlides = [
  {
    id: 1,
    title: 'Get Flat ₹500 OFF*',
    subtitle: 'On luxury celebration & candlelight setups today!',
    btnText: 'BOOK NOW →',
    bg: 'linear-gradient(135deg, #5B247A 0%, #1B1B48 100%)',
    img: '/images/categories/anniversary.jpg',
    badge: '⚡ FLASH DEAL',
    filterQuery: 'Anniversary'
  },
  {
    id: 2,
    title: 'CELEBRATION GULLY 🎉',
    subtitle: 'All your birthday, balloon & surprise themes in one place!',
    btnText: 'EXPLORE ALL →',
    bg: 'linear-gradient(135deg, #E65100 0%, #F57C00 100%)',
    img: '/images/hero/celebration.jpg',
    badge: '🔥 BESTSELLERS',
    filterQuery: 'Birthday'
  },
  {
    id: 3,
    title: 'Midnight Surprise Express 🌙',
    subtitle: 'Doorstep decor & cake delivered at 11:59 PM sharp!',
    btnText: 'BOOK MIDNIGHT →',
    bg: 'linear-gradient(135deg, #0A192F 0%, #172A45 100%)',
    img: '/images/categories/surprise.jpg',
    badge: '⏱ 11:59 PM DELIVERY',
    filterQuery: 'Surprise'
  }
];

const liveTickers = [
  '🔥 Rohit S. from Arera Colony booked "Candlelight Anniversary" 2m ago',
  '⚡ Priya V. booked "Royal Birthday Bash" in MP Nagar 4m ago',
  '🎉 18 celebrations being set up in Bhopal right now',
  '⭐ Bloom Events rated 5.0★ by Amit K. for Midnight Surprise',
  '🎈 New Pastel Baby Shower theme added in Kolar Road'
];

const searchPlaceholders = [
  "Search for 'Birthday Balloon Arch & Cake'",
  "Search for 'Candlelight Romantic Dinner'",
  "Search for 'Midnight Surprise Party'",
  "Search for 'Grand Wedding Mandap'",
  "Search for 'Baby Shower Teddy Theme'"
];

const dealCards = [
  {
    title: 'Delightful Deals',
    sub: 'GET 40% OFF',
    img: '/images/categories/birthday.jpg',
    query: 'Birthday'
  },
  {
    title: 'Flat ₹500 OFF',
    sub: '& Luxury Decor',
    img: '/images/categories/anniversary.jpg',
    query: 'Anniversary'
  },
  {
    title: 'Pick Your Surprise!',
    sub: 'Book in 60s',
    img: '/images/categories/surprise.jpg',
    query: 'Surprise'
  },
  {
    title: 'Free Sweet Platter',
    sub: 'On Orders ₹3K+',
    img: '/images/categories/sweets.jpg',
    query: 'Festive Sweets'
  }
];

const pricePresets = [
  { label: 'Under ₹5K', min: 0, max: 5000 },
  { label: '₹5K–₹15K', min: 5000, max: 15000 },
  { label: '₹15K–₹30K', min: 15000, max: 30000 },
  { label: '₹50K+', min: 50000, max: Infinity },
];

const WIZARD_STEPS = [
  {
    id: 'occasion',
    title: 'What are you celebrating?',
    subtitle: 'Pick your celebration type',
    options: [
      { label: 'Birthday', emoji: '🎂', color: '#FF6B6B' },
      { label: 'Anniversary', emoji: '💍', color: '#FC8019' },
      { label: 'Party', emoji: '🎉', color: '#FFC107' },
      { label: 'Baby Shower', emoji: '🍼', color: '#4CAF50' },
      { label: 'Surprise', emoji: '❤️', color: '#E91E63' },
      { label: 'Corporate', emoji: '🏢', color: '#2196F3' },
      { label: 'Graduation', emoji: '🎓', color: '#9C27B0' },
      { label: 'Other', emoji: '✏️', color: '#607D8B' },
    ],
  },
  {
    id: 'budget',
    title: "What's your budget?",
    subtitle: "We'll tailor the best verified planners",
    options: [
      { label: 'Under ₹5K', emoji: '💵', color: '#4CAF50', min: 0, max: 5000 },
      { label: '₹5K–₹15K', emoji: '💰', color: '#FC8019', min: 5000, max: 15000 },
      { label: '₹15K–₹30K', emoji: '💎', color: '#2196F3', min: 15000, max: 30000 },
      { label: '₹50K+', emoji: '👑', color: '#9C27B0', min: 50000, max: Infinity },
    ],
  },
  {
    id: 'guests',
    title: 'How many guests are attending?',
    subtitle: 'Helps estimate food, cake & seating',
    options: [
      { label: '1–10 (Intimate)', emoji: '👥', color: '#2196F3' },
      { label: '10–25 (Family)', emoji: '👨‍👩‍👧‍👦', color: '#9C27B0' },
      { label: '25–50 (Party)', emoji: '🎊', color: '#E91E63' },
      { label: '50–100 (Grand)', emoji: '🎭', color: '#FF9800' },
      { label: '100+ (Gala)', emoji: '🏟️', color: '#F44336' },
    ],
  },
  {
    id: 'mode',
    title: 'Where should we set up?',
    subtitle: 'Select celebration venue',
    options: [
      { label: 'Home / Flat', emoji: '🏠', color: '#4CAF50', key: 'home' },
      { label: 'Restaurant / Café', emoji: '🍽️', color: '#FF9800', key: 'restaurant' },
      { label: 'Custom Destination', emoji: '✨', color: '#9C27B0', key: 'custom' },
    ],
  },
];

const MOCK_PACKAGES = [
  { 
    package_id: 'p1', 
    package_name: 'Royal Birthday Bash', 
    business_name: 'Bloom Events Bhopal', 
    description: 'Complete 3D balloon arch, gourmet cake, photography, fairy lights & personalized banner.', 
    price: 4999, 
    original_price: 6999,
    photos: ['/images/categories/birthday.jpg'],
    rating: '4.9',
    reviews_count: 142,
    setup_time: '2–3 hrs',
    category: 'Birthday',
    discount_tag: '30% OFF'
  },
  { 
    package_id: 'p2', 
    package_name: 'Candlelight Anniversary Setup', 
    business_name: 'Dreamy Setups', 
    description: 'Fresh red roses, glowing golden candles, luxury dinner canopy & romantic couple photoshoot.', 
    price: 7999, 
    original_price: 10999,
    photos: ['/images/categories/anniversary.jpg'],
    rating: '4.9',
    reviews_count: 98,
    setup_time: '2 hrs',
    category: 'Anniversary',
    discount_tag: 'FLAT ₹500 OFF'
  },
  { 
    package_id: 'p3', 
    package_name: 'Baby Shower Pastel Delight', 
    business_name: 'Pink Ribbon Events', 
    description: 'Teddy bear cradle theme, organic pastel balloons, cupcake tower & custom welcome easel.', 
    price: 6499, 
    original_price: 8999,
    photos: ['/images/categories/babyshower.jpg'],
    rating: '4.8',
    reviews_count: 76,
    setup_time: '3 hrs',
    category: 'Baby Shower',
    discount_tag: '28% OFF'
  },
  { 
    package_id: 'p4', 
    package_name: 'Corporate Gala & Stage Setup', 
    business_name: 'Elite Occasions', 
    description: 'Illuminated stage setup, podium microphone, awards coordination & ambient LED backdrop.', 
    price: 24999, 
    original_price: 32000,
    photos: ['/images/categories/corporate.jpg'],
    rating: '5.0',
    reviews_count: 54,
    setup_time: '4 hrs',
    category: 'Corporate',
    discount_tag: '22% OFF'
  },
  { 
    package_id: 'p5', 
    package_name: 'Surprise Party Hamper & Decor', 
    business_name: 'Love & Light Co.', 
    description: 'Glowing neon hearts, helium balloon ceiling, explosion gift box & professional photographer.', 
    price: 3999, 
    original_price: 5499,
    photos: ['/images/categories/surprise.jpg'],
    rating: '4.8',
    reviews_count: 112,
    setup_time: '2 hrs',
    category: 'Surprise',
    discount_tag: '27% OFF'
  },
  { 
    package_id: 'p6', 
    package_name: 'Grand Indian Wedding Mandap', 
    business_name: 'Bloom Events Bhopal', 
    description: 'Royal floral mandap, brass lamps, entrance tunnel arch, lighting & bridal suite decor.', 
    price: 54999, 
    original_price: 75000,
    photos: ['/images/categories/wedding.jpg'],
    rating: '5.0',
    reviews_count: 89,
    setup_time: '5 hrs',
    category: 'Wedding',
    discount_tag: 'BESTSELLER'
  },
];

export default function Home({ initialPackages = [] }) {
  const router = useRouter();

  const defaultPkgs = initialPackages && initialPackages.length > 0 ? initialPackages : MOCK_PACKAGES;
  const [allPackages, setAllPackages] = useState(defaultPkgs);
  const [packages, setPackages] = useState(defaultPkgs);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [activeSlide, setActiveSlide] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [favorites, setFavorites] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [appliedFilter, setAppliedFilter] = useState(null);
  const [showTrack, setShowTrack] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizStep, setWizStep] = useState(0);
  const [wizAnswers, setWizAnswers] = useState({});
  const [wizDone, setWizDone] = useState(false);
  const [wizOtherText, setWizOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // ── USER AUTHENTICATION & ORDER STATE ──
  const [currentUser, setCurrentUser] = useState(null);
  const [latestOrder, setLatestOrder] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [authStep, setAuthStep] = useState(1); // For forgot: 1 = send otp, 2 = verify & reset
  const [authPhone, setAuthPhone] = useState('');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNewPassword, setAuthNewPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);
  const [pendingPackageId, setPendingPackageId] = useState(null);

  // ── LOCATION SWITCHER & 24/7 CHAT CONCIERGE ──
  const [selectedCity, setSelectedCity] = useState('Bhopal, MP Nagar');
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const [showChatWidget, setShowChatWidget] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hi! 👋 Looking to plan a celebration? How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const occasionsScrollRef = useRef(null);
  const studiosScrollRef = useRef(null);
  const dealsScrollRef = useRef(null);
  const otpInputRef = useRef(null);

  function loadLatestOrder() {
    try {
      const id = localStorage.getItem('momanto_latest_order_id');
      const infoStr = localStorage.getItem('momanto_latest_order_info');
      if (id) {
        if (infoStr) {
          setLatestOrder(JSON.parse(infoStr));
        } else {
          setLatestOrder({ order_id: id, package_name: 'Recent Celebration Booking' });
        }
      } else {
        setLatestOrder(null);
      }
    } catch {}
  }

  function handleAutoTrack() {
    try {
      const id = localStorage.getItem('momanto_latest_order_id');
      if (id) {
        setShowProfile(false);
        router.push(`/track/${id}`);
        return;
      }
    } catch {}
    setShowProfile(false);
    setShowTrack(true);
  }

  // Dynamic animations & load saved user & orders
  useEffect(() => {
    setMounted(true);
    fetchPackages('all');
    loadLatestOrder();

    // Load saved logged-in user from localStorage
    try {
      const savedUserStr = localStorage.getItem('momanto_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.phone) {
          setCurrentUser(parsed);
        }
      }
    } catch {
      // ignore
    }

    // Auto-rotate promotional banner
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promotionalSlides.length);
    }, 4500);

    // Auto-rotate search placeholder
    const placeholderTimer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 3200);

    // Auto-rotate live notification ticker
    const tickerTimer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % liveTickers.length);
    }, 3800);

    return () => {
      clearInterval(slideTimer);
      clearInterval(placeholderTimer);
      clearInterval(tickerTimer);
    };
  }, []);

  // Reload order on drawer open
  useEffect(() => {
    if (showProfile) {
      loadLatestOrder();
    }
  }, [showProfile]);

  // OTP Countdown timer
  useEffect(() => {
    let t;
    if (authStep === 2 && otpTimer > 0) {
      t = setInterval(() => setOtpTimer((s) => s - 1), 1000);
    }
    return () => clearInterval(t);
  }, [authStep, otpTimer]);

  async function fetchPackages(mode = 'all') {
    try {
      setLoading(true);
      const url = mode && mode !== 'all' ? `/api/packages?mode=${mode}` : '/api/packages';
      const res = await fetch(url);
      const data = await res.json();
      const arr = Array.isArray(data) && data.length > 0 ? data : MOCK_PACKAGES;
      setAllPackages(arr);
      applyFilters(arr, appliedFilter, searchQuery);
    } catch {
      setAllPackages(MOCK_PACKAGES);
      applyFilters(MOCK_PACKAGES, appliedFilter, searchQuery);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(list, filter, query) {
    let out = list;
    if (query?.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (p) =>
          p.package_name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.business_name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }
    if (filter) {
      out = out.filter((p) => {
        const pr = Number(p.price) || 0;
        return pr >= filter.min && (filter.max === Infinity || pr <= filter.max);
      });
    }
    setPackages(out);
  }

  function handleSearch(e) {
    e?.preventDefault();
    applyFilters(allPackages, appliedFilter, searchQuery);
    document.getElementById('celebration-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleOcc(label) {
    const next = searchQuery.toLowerCase() === label.toLowerCase() ? '' : label;
    setSearchQuery(next);
    applyFilters(allPackages, appliedFilter, next);
    document.getElementById('celebration-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleSubTab(tabId) {
    setActiveSubTab(tabId);
    if (tabId === 'all') {
      setSearchQuery('');
      applyFilters(allPackages, appliedFilter, '');
    } else if (tabId === 'express') {
      setSearchQuery('2 hrs');
      applyFilters(allPackages, appliedFilter, '2 hrs');
    } else if (tabId === 'offers') {
      const f = { min: 0, max: 8000 };
      setAppliedFilter(f);
      applyFilters(allPackages, f, searchQuery);
    } else if (tabId === 'weddings') {
      setSearchQuery('Wedding');
      applyFilters(allPackages, appliedFilter, 'Wedding');
    } else if (tabId === 'balloons') {
      setSearchQuery('Balloon');
      applyFilters(allPackages, appliedFilter, 'Balloon');
    } else if (tabId === 'midnight') {
      setSearchQuery('Surprise');
      applyFilters(allPackages, appliedFilter, 'Surprise');
    }
    document.getElementById('celebration-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  function toggleFavorite(pkgId, e) {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }));
  }

  function scrollOccasions(direction) {
    if (occasionsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      occasionsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  function scrollStudios(direction) {
    if (studiosScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      studiosScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  function handleSelectCity(cityName) {
    setSelectedCity(cityName);
    setShowLocationDrawer(false);
    try {
      localStorage.setItem('momanto_selected_city', cityName);
    } catch {}
    // Filter packages matching city
    const cityNameShort = cityName.split(',')[0].trim();
    setSearchQuery(cityNameShort === 'Bhopal' ? '' : cityNameShort);
    applyFilters(allPackages, appliedFilter, cityNameShort === 'Bhopal' ? '' : cityNameShort);
  }

  async function handleGpsDetect() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const detected = data.address?.city || data.address?.town || data.address?.state_district || 'Bhopal';
          const locality = data.address?.suburb || data.address?.neighbourhood || 'Current Location';
          handleSelectCity(`${detected}, ${locality}`);
        } catch {
          handleSelectCity('Bhopal, MP Nagar');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        alert('Location access denied. Please select your city manually.');
      },
      { timeout: 8000 }
    );
  }

  function handleSendChat(textToSend) {
    const text = textToSend || chatInput;
    if (!text || !text.trim()) return;

    const userMsg = { sender: 'user', text: text.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Dynamic smart responses
    setTimeout(() => {
      let reply = "I can help with that! Our verified planners bring 100% setup materials, fresh cakes & lights right to your venue. Would you like to book for Birthday or Anniversary?";
      const lower = text.toLowerCase();
      if (lower.includes('cake') || lower.includes('flavor')) {
        reply = "🎂 Yes! All cakes are 100% fresh gourmet cakes (Chocolate, Pineapple, Red Velvet, Black Forest) and you can customize the name & message on the cake during booking!";
      } else if (lower.includes('early') || lower.includes('time') || lower.includes('fast')) {
        reply = "⚡ Our planner arrives 2 to 3 hours before your celebration time to set up the decor completely before your guests arrive!";
      } else if (lower.includes('discount') || lower.includes('coupon') || lower.includes('offer')) {
        reply = "🏷️ You can use coupon 'MOMANTO500' for flat ₹500 OFF, or 'GET100' for instant discount during checkout!";
      } else if (lower.includes('whatsapp') || lower.includes('call') || lower.includes('phone')) {
        reply = "💬 You can chat with our 24/7 celebration desk directly on WhatsApp at +91 916204507166!";
      }
      setChatMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  }

  // ── BOOK NOW CLICK HANDLER (CHECKS AUTH) ──
  function handleBookNow(pkgId, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentUser) {
      setPendingPackageId(pkgId);
      setAuthTab('login');
      setAuthStep(1);
      setAuthError('');
      setAuthOtp('');
      setShowAuthModal(true);
    } else {
      router.push(`/checkout/${pkgId}`);
    }
  }

  // ── AUTH SUCCESS HELPER ──
  function handleAuthSuccess(userData, token) {
    if (userData) {
      localStorage.setItem('momanto_user', JSON.stringify(userData));
      if (userData.phone) localStorage.setItem('momanto_customer_phone', userData.phone);
      if (userData.name) localStorage.setItem('momanto_customer_name', userData.name);
      setCurrentUser(userData);
    }
    if (token) localStorage.setItem('momanto_token', token);
    setShowAuthModal(false);
    setAuthError('');
    setAuthPassword('');
    setAuthNewPassword('');
    setAuthOtp('');
    if (pendingPackageId) {
      const pid = pendingPackageId;
      setPendingPackageId(null);
      router.push(`/checkout/${pid}`);
    }
  }

  // ── AUTH: LOGIN WITH PASSWORD (ZERO SMS COST) ──
  async function handleLogin(e) {
    e?.preventDefault();
    if (!authPhone.trim()) {
      setAuthError('Please enter your mobile number or email');
      return;
    }
    if (!authPassword) {
      setAuthError('Please enter your password');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
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
    e?.preventDefault();
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
      setAuthError('Password must be at least 6 characters long');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
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
    e?.preventDefault();
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
    e?.preventDefault();
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

  // ── LOGOUT ──
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
    setShowProfile(false);
  }

  function handleApplyFilter() {
    let f = null;
    if (activePreset !== null) f = pricePresets[activePreset];
    else if (priceMin || priceMax) {
      f = { min: Number(priceMin) || 0, max: Number(priceMax) || Infinity };
    }
    setAppliedFilter(f);
    applyFilters(allPackages, f, searchQuery);
    setShowFilter(false);
  }

  function openWizard() {
    setWizStep(0);
    setWizAnswers({});
    setWizDone(false);
    setShowOtherInput(false);
    setWizOtherText('');
    setShowWizard(true);
  }

  function wizSelect(opt) {
    const step = WIZARD_STEPS[wizStep];
    if (opt.label === 'Other' && step.id === 'occasion') {
      setShowOtherInput(true);
      return;
    }
    const newAns = { ...wizAnswers, [step.id]: opt };
    setWizAnswers(newAns);
    setShowOtherInput(false);
    if (wizStep < WIZARD_STEPS.length - 1) {
      setTimeout(() => setWizStep((s) => s + 1), 260);
    } else {
      setTimeout(() => {
        setWizDone(true);
        const budget = newAns.budget;
        if (budget) {
          const f = { min: budget.min, max: budget.max };
          setAppliedFilter(f);
          applyFilters(allPackages, f, newAns.occasion?.label || '');
        }
        if (newAns.occasion?.label && newAns.occasion.label !== 'Other') {
          setSearchQuery(newAns.occasion.label);
        }
        setTimeout(() => {
          setShowWizard(false);
          document.getElementById('celebration-grid')?.scrollIntoView({ behavior: 'smooth' });
        }, 1600);
      }, 300);
    }
  }

  function wizConfirmOther() {
    if (!wizOtherText.trim()) return;
    const step = WIZARD_STEPS[wizStep];
    const newAns = {
      ...wizAnswers,
      [step.id]: { label: wizOtherText.trim(), emoji: '✏️', color: '#607D8B' },
    };
    setWizAnswers(newAns);
    setShowOtherInput(false);
    setWizOtherText('');
    if (wizStep < WIZARD_STEPS.length - 1) {
      setTimeout(() => setWizStep((s) => s + 1), 200);
    } else {
      setWizDone(true);
      setTimeout(() => {
        setShowWizard(false);
        document.getElementById('celebration-grid')?.scrollIntoView({ behavior: 'smooth' });
      }, 1600);
    }
  }

  return (
    <>
      <Head>
        <title>Momanto – India's #1 Celebration & Event Delivery Platform</title>
        <meta
          name="description"
          content="Swiggy-style real-time celebration delivery. Book verified planners in Bhopal for birthdays, anniversaries, balloon decors & weddings in 60 seconds."
        />
      </Head>

      <style jsx global>{`
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        :root {
          --orange: #FC8019;
          --orange-dk: #E55A00;
          --green: #1DB954;
          --green-dk: #15903E;
          --navy-dark: #0A1633;
          --navy-mid: #10234B;
          --ink: #1C1C1C;
          --ink-2: #4A4D5E;
          --muted: #8A8D9B;
          --border: #ECECF0;
          --page-bg: #F8F9FA;
          --card-bg: #FFFFFF;
        }
        html, body {
          font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--page-bg);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; cursor: pointer; border: none; background: none; }
        input { font-family: inherit; }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
          width: 100%;
        }

        .scroll-x {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .scroll-x::-webkit-scrollbar {
          display: none;
        }

        /* Animations */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDrawer { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes floatSlow { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-6px) rotate(2deg); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
        @keyframes tickerSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* ── SEAMLESS LUXURY HERO & HEADER ── */
        .hero-unified-wrapper {
          background: linear-gradient(180deg, #0A1633 0%, #0E1F44 60%, #122855 100%);
          color: #FFFFFF;
          position: relative;
          box-shadow: 0 8px 32px rgba(10, 22, 51, 0.2);
        }

        /* Sticky Top Navbar */
        .site-top-navbar {
          position: sticky;
          top: 0;
          z-index: 500;
          background: rgba(10, 22, 51, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 0 6px;
        }

        .header-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 0 8px;
          gap: 12px;
        }
        .header-brand-only {
          display: flex;
          align-items: center;
        }

        .header-right-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .user-auth-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          font-size: 11.5px;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 50px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .user-auth-pill:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .free-deal-pill {
          background: linear-gradient(135deg, #FF6B00, #FC8019);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 900;
          padding: 6px 14px;
          border-radius: 50px;
          box-shadow: 0 2px 10px rgba(252, 128, 25, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: transform 0.2s;
        }
        .free-deal-pill:hover {
          transform: scale(1.04);
        }
        .menu-round-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #182C58;
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .menu-round-btn:hover {
          background: #233D78;
          transform: scale(1.06);
        }

        /* Full-Width White Pill Search Bar */
        .header-search-row {
          padding: 4px 0 8px;
        }
        .swiggy-white-search {
          background: #FFFFFF;
          border-radius: 16px;
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
        }
        .search-input-field {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          font-weight: 700;
          color: #1C1C1C;
          min-width: 0;
        }
        .search-input-field::placeholder {
          color: #8A8D9B;
          font-weight: 600;
        }
        .search-mic-icon {
          color: #FC8019;
          font-size: 18px;
          flex-shrink: 0;
          cursor: pointer;
        }

        /* Dark Swiggy Category Tabs */
        .header-tabs-row {
          padding: 0 0 2px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .subnav-inner {
          display: flex;
          gap: 22px;
        }
        .subnav-tab {
          padding: 10px 4px 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 900;
          color: #94A3B8;
          cursor: pointer;
          white-space: nowrap;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }
        .subnav-tab:hover {
          color: #FFFFFF;
        }
        .subnav-tab.active {
          color: #FFFFFF;
          border-bottom-color: var(--orange);
          text-shadow: 0 0 10px rgba(252, 128, 25, 0.4);
        }

        /* ── SEAMLESS INTEGRATED LIVE ACTIVITY TICKER ── */
        .live-ticker-seamless {
          background: rgba(255, 255, 255, 0.06);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 8px 0;
        }
        .ticker-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 800;
          color: #FFE4B5;
        }
        .ticker-text {
          animation: tickerSlide 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── DEAL ZONE (SEAMLESS PART OF HERO) ── */
        .deal-zone-seamless {
          padding: 22px 0 26px;
        }
        .deal-zone-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .deal-header-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .deal-3d-floating-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          animation: floatSlow 3s ease-in-out infinite;
        }
        .deal-zone-title {
          font-size: clamp(20px, 3.5vw, 28px);
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #FFFFFF;
        }
        .deal-zone-title span {
          color: #FFD13B;
        }
        .deal-zone-sub {
          font-size: 12.5px;
          color: #94A3B8;
          font-weight: 700;
        }

        /* 4 Yellow Deal Cards */
        .deal-cards-scroll {
          display: flex;
          gap: 14px;
          padding: 4px 4px 8px;
          overflow-x: auto;
        }
        .deal-yellow-card {
          flex: 0 0 160px;
          background: #FFD13B;
          border-radius: 20px;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          position: relative;
        }
        @media (min-width: 600px) {
          .deal-yellow-card {
            flex: 0 0 180px;
            padding: 16px 14px;
          }
        }
        .deal-yellow-card:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 16px 36px rgba(255, 209, 59, 0.35);
        }
        .deal-card-title {
          font-size: 13px;
          font-weight: 900;
          color: #0F172A;
          line-height: 1.2;
        }
        .deal-card-badge {
          background: #0F172A;
          color: #FFD13B;
          font-size: 10px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 50px;
        }
        .deal-3d-thumb {
          width: 90px;
          height: 90px;
          border-radius: 16px;
          object-fit: cover;
          box-shadow: 0 6px 16px rgba(0,0,0,0.18);
          transition: transform 0.25s;
        }
        .deal-yellow-card:hover .deal-3d-thumb {
          transform: scale(1.08) rotate(2deg);
        }

        /* ── AUTO-SLIDING PROMOTIONAL BANNER CAROUSEL ── */
        .promo-slider-section {
          padding: 18px 0 10px;
        }
        .promo-banner-card {
          border-radius: 24px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #FFFFFF;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          position: relative;
          overflow: hidden;
          min-height: 160px;
          transition: all 0.35s ease;
          cursor: pointer;
        }
        .promo-left {
          max-width: 60%;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 2;
        }
        .promo-badge-pill {
          display: inline-block;
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(8px);
          font-size: 10px;
          font-weight: 900;
          padding: 3px 10px;
          border-radius: 50px;
          width: fit-content;
          color: #FFD13B;
        }
        .promo-title {
          font-size: clamp(18px, 3.5vw, 26px);
          font-weight: 900;
          line-height: 1.2;
        }
        .promo-sub {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.88);
          font-weight: 600;
        }
        .promo-cta-btn {
          margin-top: 8px;
          background: #FFFFFF;
          color: #1C1C1C;
          font-size: 13px;
          font-weight: 900;
          padding: 9px 18px;
          border-radius: 12px;
          width: fit-content;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          transition: transform 0.2s;
        }
        .promo-banner-card:hover .promo-cta-btn {
          transform: scale(1.05);
        }
        .promo-right-img {
          width: 140px;
          height: 140px;
          border-radius: 20px;
          object-fit: cover;
          box-shadow: 0 8px 24px rgba(0,0,0,0.28);
          transform: rotate(3deg);
          transition: transform 0.3s;
          flex-shrink: 0;
        }
        .promo-banner-card:hover .promo-right-img {
          transform: scale(1.1) rotate(0deg);
        }

        .promo-dots-row {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
        }
        .promo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #CBD5E1;
          cursor: pointer;
          transition: all 0.25s;
        }
        .promo-dot.active {
          width: 24px;
          border-radius: 20px;
          background: var(--orange);
        }

        /* ── SWIGGY 3D CATEGORIES CAROUSEL ── */
        .categories-section {
          background: #FFFFFF;
          margin-top: 14px;
          padding: 22px 0 26px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .section-title-swiggy {
          font-size: 20px;
          font-weight: 900;
          color: var(--ink);
          letter-spacing: -0.4px;
        }
        .nav-arrow-btns {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .arrow-round-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #ECECF0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: var(--ink);
          font-weight: 900;
          cursor: pointer;
          transition: all 0.2s;
        }
        .arrow-round-btn:hover {
          background: #D8D8E0;
          transform: scale(1.08);
        }

        .cat-3d-list {
          display: flex;
          gap: 16px;
          padding: 12px 6px 16px;
          overflow-x: auto;
        }
        .cat-3d-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100px;
          text-align: center;
        }
        @media (min-width: 600px) {
          .cat-3d-card {
            width: 118px;
          }
        }
        .cat-3d-card:hover {
          transform: translateY(-5px);
        }
        .cat-img-box {
          width: 86px;
          height: 86px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        @media (min-width: 600px) {
          .cat-img-box {
            width: 104px;
            height: 104px;
          }
        }
        .cat-3d-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 20px;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.08));
          transition: all 0.25s;
        }
        .cat-3d-card:hover .cat-3d-img {
          transform: scale(1.08);
          filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.16));
        }
        .cat-3d-card.active .cat-3d-img {
          transform: scale(1.1);
          filter: drop-shadow(0 10px 22px rgba(252, 128, 25, 0.42));
        }
        .cat-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--ink-2);
          line-height: 1.2;
        }
        .cat-tag-pill {
          font-size: 10px;
          font-weight: 800;
          color: var(--orange);
          background: #FFF3E9;
          padding: 2px 8px;
          border-radius: 50px;
        }

        /* ── SWIGGY CELEBRATION PACKAGES SECTION ── */
        .packages-main-section {
          background: #FFFFFF;
          margin-top: 14px;
          padding: 26px 0 36px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .filter-pills-row {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 16px;
        }
        .filter-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 50px;
          background: #FFFFFF;
          border: 1.5px solid var(--border);
          font-size: 12.5px;
          font-weight: 800;
          color: var(--ink);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .filter-chip-btn:hover {
          border-color: var(--orange);
          background: #FFF3E9;
          color: var(--orange-dk);
        }
        .filter-chip-btn.active {
          background: var(--orange);
          border-color: var(--orange);
          color: #fff;
          box-shadow: 0 4px 12px rgba(252,128,25,0.3);
        }

        .packages-swiggy-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px 12px;
          margin-top: 16px;
        }
        @media (max-width: 360px) {
          .packages-swiggy-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        @media (min-width: 720px) {
          .packages-swiggy-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 24px 18px;
          }
        }
        @media (min-width: 1040px) {
          .packages-swiggy-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 32px 22px;
          }
        }

        /* ── AUTHENTIC SWIGGY CARD LAYOUT (MATCHING PRODUCTION SCREENSHOT) ── */
        .swiggy-authentic-card {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          position: relative;
          background: transparent;
          border: none;
          text-decoration: none;
          min-width: 0;
        }
        .swiggy-card-img-banner {
          position: relative;
          width: 100%;
          height: 145px;
          border-radius: 16px;
          overflow: hidden;
          background: #F1F5F9;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease;
        }
        @media (min-width: 600px) {
          .swiggy-card-img-banner {
            height: 175px;
          }
        }
        .swiggy-authentic-card:hover .swiggy-card-img-banner {
          transform: scale(0.96);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }
        .swiggy-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .swiggy-card-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(2, 6, 12, 0) 0%, rgba(2, 6, 12, 0.85) 85%);
          pointer-events: none;
        }
        .swiggy-card-banner-offer {
          position: absolute;
          bottom: 8px;
          left: 10px;
          right: 10px;
          color: #FFFFFF;
          font-size: clamp(14px, 3.5vw, 19px);
          font-weight: 900;
          letter-spacing: -0.5px;
          text-transform: uppercase;
          line-height: 1.1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
          pointer-events: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .swiggy-card-video-pill {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 9px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
          z-index: 2;
          letter-spacing: 0.2px;
        }
        .swiggy-card-video-pill span {
          color: #FC8019;
          font-size: 9px;
        }
        .swiggy-card-fav-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .swiggy-card-fav-btn:hover {
          transform: scale(1.15);
        }

        /* Swiggy Card Body Details */
        .swiggy-card-details {
          padding: 8px 2px 4px;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .swiggy-item-title {
          font-size: 15px;
          font-weight: 800;
          color: #02060C;
          line-height: 1.25;
          margin-top: 2px;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.2px;
        }
        @media (min-width: 600px) {
          .swiggy-item-title { font-size: 17px; }
        }
        .swiggy-rating-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13.5px;
          font-weight: 700;
          color: #02060C;
          margin-bottom: 2px;
        }
        @media (min-width: 600px) {
          .swiggy-rating-row { font-size: 14.5px; }
        }
        .swiggy-green-icon {
          background: #118439;
          color: #FFFFFF;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .swiggy-sub-line-1 {
          font-size: 12.5px;
          color: rgba(2, 6, 12, 0.6);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 1px;
        }
        @media (min-width: 600px) {
          .swiggy-sub-line-1 { font-size: 13.5px; }
        }
        .swiggy-sub-line-2 {
          font-size: 12.5px;
          color: rgba(2, 6, 12, 0.6);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        @media (min-width: 600px) {
          .swiggy-sub-line-2 { font-size: 13.5px; }
        }
        .swiggy-price-cta-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed #E2E8F0;
        }
        @media (min-width: 600px) {
          .swiggy-price-cta-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .swiggy-price-block {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: wrap;
        }
        .swiggy-price-curr {
          font-size: 14.5px;
          font-weight: 900;
          color: #02060C;
          white-space: nowrap;
        }
        @media (min-width: 600px) {
          .swiggy-price-curr { font-size: 16px; }
        }
        .swiggy-price-old {
          font-size: 11px;
          color: #94A3B8;
          text-decoration: line-through;
          font-weight: 600;
          white-space: nowrap;
        }
        .swiggy-book-pill {
          width: 100%;
          text-align: center;
          background: linear-gradient(135deg, #FC8019, #FF9E42);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 11.5px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(252, 128, 25, 0.25);
          transition: transform 0.2s;
          white-space: nowrap;
        }
        @media (min-width: 600px) {
          .swiggy-book-pill { width: auto; padding: 6px 14px; font-size: 12px; }
        }
        .swiggy-book-pill:hover {
          transform: scale(1.03);
        }

        /* ── SWIGGY MOBILE FIXED BOTTOM NAVIGATION BAR ── */
        .bottom-nav-mobile {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #FFFFFF;
          border-top: 1px solid var(--border);
          box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.08);
          z-index: 400;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
        }
        @media (min-width: 768px) {
          .bottom-nav-mobile {
            display: none;
          }
        }
        .bnav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--muted);
          cursor: pointer;
          position: relative;
        }
        .bnav-item.active {
          color: var(--orange);
        }
        .bnav-icon {
          font-size: 20px;
        }
        .bnav-win-pill {
          background: linear-gradient(135deg, #EC4899, #F43F5E);
          color: #fff;
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 900;
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
          animation: pulseGlow 2s infinite;
        }

        /* ── SLIDE-OUT PROFILE DRAWER ── */
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

        /* 4 Quick Drawer Tiles */
        .drawer-tiles-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          padding: 18px 20px;
        }
        .drawer-tile-btn {
          background: #FFFFFF;
          border: 1.5px solid var(--border);
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
          border-color: var(--orange);
          background: #FFF3E9;
        }
        .dtile-icon {
          font-size: 20px;
        }
        .dtile-label {
          font-size: 10.5px;
          font-weight: 800;
          color: var(--ink);
          line-height: 1.2;
        }

        /* Drawer Options List */
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
          color: var(--ink);
        }
        .ditem-arrow {
          font-size: 16px;
          color: #94A3B8;
          font-weight: 900;
        }

        /* ── AUTH OTP MODAL ── */
        .auth-modal-card {
          width: 100%;
          max-width: 440px;
          background: #FFFFFF;
          border-radius: 28px;
          padding: 28px 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
          animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .auth-tab-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: #F4F4F6;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 20px;
        }
        .auth-tab-btn {
          padding: 9px;
          font-size: 12.5px;
          font-weight: 900;
          border-radius: 9px;
          color: var(--muted);
          transition: all 0.2s;
        }
        .auth-tab-btn.active {
          background: #FFFFFF;
          color: var(--orange-dk);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .auth-field-group {
          margin-bottom: 14px;
        }
        .auth-field-label {
          display: block;
          font-size: 12px;
          font-weight: 900;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .auth-input-box {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 11px 14px;
          background: #FAFAFB;
          transition: all 0.2s;
        }
        .auth-input-box:focus-within {
          background: #fff;
          border-color: var(--orange);
          box-shadow: 0 3px 12px rgba(252, 128, 25, 0.18);
        }
        .auth-input-inner {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          font-weight: 800;
          color: var(--ink);
          width: 100%;
        }

        .auth-submit-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--orange), #FF9E42);
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 900;
          padding: 13px;
          border-radius: 14px;
          box-shadow: 0 4px 16px rgba(252, 128, 25, 0.35);
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s;
        }
        .auth-submit-btn:hover {
          transform: scale(1.02);
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── FOOTER ── */
        .site-footer {
          background: #0A1633;
          color: #fff;
          padding: 42px 0 80px;
          margin-top: 24px;
          text-align: center;
        }
        @media (min-width: 768px) {
          .site-footer {
            padding-bottom: 36px;
          }
        }
        .footer-logo-box {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }
        .footer-sub {
          font-size: 13px;
          color: #94A3B8;
          margin-bottom: 20px;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 22px;
          flex-wrap: wrap;
        }
        .footer-link {
          font-size: 13px;
          color: #CBD5E1;
          font-weight: 700;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: #fff;
        }

        /* ── RESPONSIVE MODALS ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 900;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        .modal-card {
          width: 100%;
          max-width: 500px;
          background: #fff;
          border-radius: 24px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* ════ UNIFIED LUXURY HERO SECTION (HEADER + LIVE TICKER + DEAL ZONE) ════ */}
      <div className="hero-unified-wrapper">
        {/* Sticky Top Navbar */}
        <header className="site-top-navbar">
          <div className="page-container">
            {/* Row 1: 3D Momanto Logo + Right Actions */}
            <div className="header-top-row">
              <div className="header-brand-only" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Logo3D size="md" theme="dark" />
                <div
                  onClick={() => setShowLocationDrawer(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 800,
                    maxWidth: '140px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flexShrink: 1
                  }}
                >
                  <span style={{ color: '#FC8019', flexShrink: 0 }}>📍</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCity}</span>
                  <span style={{ fontSize: 9, color: '#94A3B8', flexShrink: 0 }}>▼</span>
                </div>
              </div>

              <div className="header-right-actions">
                <div onClick={openWizard} className="free-deal-pill">
                  <span>FREE GIFT</span>
                  <span style={{ background: '#fff', color: '#1C1C1C', borderRadius: 50, padding: '1px 5px', fontSize: 9 }}>₹500</span>
                </div>

                {/* THREE LINE HAMBURGER MENU BUTTON (All Login & Profile options inside) */}
                <button
                  onClick={() => setShowProfile(true)}
                  className="menu-round-btn"
                  aria-label="Open User & Planner Profile"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Row 2: Full-Width Clean White Search Bar */}
            <div className="header-search-row">
              <form onSubmit={handleSearch} className="swiggy-white-search">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  className="search-input-field"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholders[placeholderIndex]}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FC8019" strokeWidth="2.5" strokeLinecap="round" className="search-mic-icon">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </form>
            </div>

            {/* Row 3: Dark Swiggy Category Tabs */}
            <div className="header-tabs-row">
              <div className="scroll-x subnav-inner">
                {subNavTabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => handleSubTab(tab.id)}
                    className={`subnav-tab${activeSubTab === tab.id ? ' active' : ''}`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Seamless Integrated Live Activity Ticker */}
        <div className="live-ticker-seamless">
          <div className="page-container ticker-inner">
            <div className="ticker-text" key={tickerIndex}>
              <span>{liveTickers[tickerIndex]}</span>
            </div>
            <button
              onClick={openWizard}
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: '#fff',
                background: 'var(--orange)',
                padding: '3px 12px',
                borderRadius: 50,
                boxShadow: '0 2px 6px rgba(252,128,25,0.4)',
                flexShrink: 0,
              }}
            >
              ⚡ 60s Wizard
            </button>
          </div>
        </div>

        {/* Seamless Deal Zone */}
        <section className="deal-zone-seamless">
          <div className="page-container">
            <div className="deal-zone-header">
              <div className="deal-header-main">
                <div className="deal-3d-floating-icon">🎂</div>
                <div>
                  <h2 className="deal-zone-title">
                    UP TO 40% OFF · <span>TODAY'S DEALS</span>
                  </h2>
                  <p className="deal-zone-sub">Handcrafted celebration packages delivered to your venue in 2 hours</p>
                </div>
              </div>
            </div>

            {/* 4 Yellow Deal Cards Carousel */}
            <div ref={dealsScrollRef} className="scroll-x deal-cards-scroll">
              {dealCards.map((dc, i) => (
                <div
                  key={i}
                  onClick={() => handleOcc(dc.query)}
                  className="deal-yellow-card"
                >
                  <div className="deal-card-badge">{dc.sub}</div>
                  <img src={dc.img} alt={dc.title} className="deal-3d-thumb" />
                  <span className="deal-card-title">{dc.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ════ AUTO-SLIDING DYNAMIC HERO PROMOTIONAL BANNER ════ */}
      <section className="promo-slider-section">
        <div className="page-container">
          <div
            className="promo-banner-card"
            style={{ background: promotionalSlides[activeSlide].bg }}
            onClick={() => handleOcc(promotionalSlides[activeSlide].filterQuery)}
          >
            <div className="promo-left">
              <span className="promo-badge-pill">{promotionalSlides[activeSlide].badge}</span>
              <h2 className="promo-title">{promotionalSlides[activeSlide].title}</h2>
              <p className="promo-sub">{promotionalSlides[activeSlide].subtitle}</p>
              <div className="promo-cta-btn">{promotionalSlides[activeSlide].btnText}</div>
            </div>

            <img
              src={promotionalSlides[activeSlide].img}
              alt="Promo"
              className="promo-right-img"
            />
          </div>

          <div className="promo-dots-row">
            {promotionalSlides.map((_, i) => (
              <div
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`promo-dot${activeSlide === i ? ' active' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════ WHAT'S ON YOUR MIND? (3D CUTOUT CAROUSEL) ════ */}
      <section className="categories-section">
        <div className="page-container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title-swiggy">What's on your mind? 🎉</h2>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>
                Explore popular celebration styles & themes
              </span>
            </div>
            <div className="nav-arrow-btns">
              <button onClick={() => scrollOccasions('left')} className="arrow-round-btn" aria-label="Scroll left">
                ←
              </button>
              <button onClick={() => scrollOccasions('right')} className="arrow-round-btn" aria-label="Scroll right">
                →
              </button>
            </div>
          </div>

          <div ref={occasionsScrollRef} className="scroll-x cat-3d-list">
            {occasions.map((o) => {
              const isActive = searchQuery.toLowerCase() === o.label.toLowerCase();
              return (
                <div
                  key={o.label}
                  onClick={() => handleOcc(o.label)}
                  className={`cat-3d-card${isActive ? ' active' : ''}`}
                >
                  <div className="cat-img-box">
                    <img src={o.image} alt={o.label} className="cat-3d-img" />
                  </div>
                  <span className="cat-label">{o.label}</span>
                  <span className="cat-tag-pill">{o.tag}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ TOP CELEBRATION STUDIOS IN BHOPAL (SWIGGY TOP RESTAURANTS CAROUSEL) ════ */}
      <section className="studios-carousel-section" style={{ marginBottom: 36 }}>
        <div className="page-container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title-swiggy">Top celebration studios in Bhopal</h2>
            </div>
            <div className="nav-arrow-btns">
              <button onClick={() => scrollStudios('left')} className="arrow-round-btn" aria-label="Scroll left">
                ←
              </button>
              <button onClick={() => scrollStudios('right')} className="arrow-round-btn" aria-label="Scroll right">
                →
              </button>
            </div>
          </div>

          <div ref={studiosScrollRef} className="scroll-x" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '6px 4px 14px' }}>
            {[
              { id: 'planner1', name: 'Royal Events Bhopal', rating: '4.9', time: '2-3 hrs setup', tag: 'Balloon Sculpting, Gourmet Cakes, Lights', location: 'Arera Colony', offer: '50% OFF', img: '/images/hero/celebration.jpg' },
              { id: 'planner2', name: 'Bloom Events Bhopal', rating: '5.0', time: '2.5 hrs setup', tag: 'Romantic Candlelight, Rose Petals, Canopy', location: 'MP Nagar', offer: '70% OFF UPTO ₹140', img: '/images/categories/anniversary.jpg' },
              { id: 'planner3', name: 'Dreamy Setups & Co.', rating: '4.9', time: '2-3 hrs setup', tag: 'Pastel Baby Showers, Welcome Setups', location: 'Kolar Road', offer: '30% OFF UPTO ₹75', img: '/images/categories/babyshower.jpg' },
              { id: 'planner4', name: 'Love & Light Surprises', rating: '4.8', time: '1-2 hrs setup', tag: 'Midnight Delivery, Balloon Ceilings', location: 'Shahpura', offer: 'ITEMS AT ₹799', img: '/images/categories/surprise.jpg' },
              { id: 'planner5', name: 'Elite Occasions', rating: '4.9', time: '3-4 hrs setup', tag: 'Stage Setup, LED Backdrops, Podiums', location: 'Hoshangabad Rd', offer: 'FLAT ₹500 OFF', img: '/images/categories/corporate.jpg' },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/studio/${p.id}`)}
                className="swiggy-authentic-card"
                style={{ width: 285, flexShrink: 0 }}
              >
                <div className="swiggy-card-img-banner">
                  <img src={p.img} alt={p.name} className="swiggy-card-img" />
                  <div className="swiggy-card-gradient" />
                  <div className="swiggy-card-banner-offer">{p.offer}</div>
                </div>

                <div className="swiggy-card-details">
                  <h3 className="swiggy-item-title">{p.name}</h3>
                  <div className="swiggy-rating-row">
                    <span className="swiggy-green-icon">★</span>
                    <span>{p.rating}</span>
                    <span style={{ color: '#02060C', margin: '0 2px' }}>•</span>
                    <span>{p.time}</span>
                  </div>
                  <p className="swiggy-sub-line-1">{p.tag}</p>
                  <p className="swiggy-sub-line-2">{p.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CELEBRATION PACKAGES SECTION (SWIGGY PRODUCTION GRID) ════ */}
      <section className="packages-main-section" id="celebration-grid">
        <div className="page-container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title-swiggy">
                {loading ? 'Finding top planners…' : `Celebration packages with doorstep setup in Bhopal`}
              </h2>
              {searchQuery && (
                <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700, marginTop: 2 }}>
                  Showing results for "{searchQuery}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Filter Pills Row (Swiggy Filter Chips) */}
          <div className="scroll-x filter-pills-row">
            <button
              onClick={() => setShowFilter(true)}
              className="filter-chip-btn active"
            >
              <span>Sort By</span>
              <span style={{ fontSize: 10 }}>▼</span>
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setAppliedFilter(null);
                setPackages(allPackages);
              }}
              className={`filter-chip-btn${!searchQuery && !appliedFilter ? ' active' : ''}`}
            >
              All Packages
            </button>
            <button
              onClick={() => {
                const f = { min: 0, max: 5000 };
                setAppliedFilter(f);
                applyFilters(allPackages, f, searchQuery);
              }}
              className="filter-chip-btn"
            >
              Less than ₹5000
            </button>
            <button
              onClick={() => handleOcc('Birthday')}
              className="filter-chip-btn"
            >
              🎂 Birthdays
            </button>
            <button
              onClick={() => handleOcc('Anniversary')}
              className="filter-chip-btn"
            >
              💍 Candlelight
            </button>
            <button
              onClick={() => handleOcc('Surprise')}
              className="filter-chip-btn"
            >
              ⚡ Fast 2-Hr Setup
            </button>
            <button
              onClick={() => handleOcc('offers')}
              className="filter-chip-btn"
            >
              🏷️ Offers
            </button>
          </div>

          {/* Package Cards Grid */}
          {loading ? (
            <div className="packages-swiggy-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} style={{ background: '#F1F5F9', borderRadius: 16, height: 280 }} />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 10 }}>🎈</span>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>No celebration packages found</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Try searching for another occasion or clear your filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setAppliedFilter(null);
                  setPackages(allPackages);
                }}
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '10px 24px',
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="packages-swiggy-grid">
              {packages.map((pkg) => {
                const origPrice = pkg.original_price || Math.round(pkg.price * 1.35);
                const isFav = favorites[pkg.package_id];
                const discountTag = pkg.discount_tag || (pkg.discount_percent ? `${pkg.discount_percent}% OFF` : '26% OFF');
                
                // 📸 Bulletproof Photo Resolution
                const rawPhoto = Array.isArray(pkg.photos) ? pkg.photos[0] : pkg.photos;
                const getFallback = (tags) => {
                  const occ = (Array.isArray(tags) ? tags.join(' ') : String(tags || '')).toLowerCase();
                  if (occ.includes('anniversary') || occ.includes('candlelight') || occ.includes('romantic')) return '/images/categories/anniversary.jpg';
                  if (occ.includes('wedding') || occ.includes('mandap')) return '/images/categories/wedding.jpg';
                  if (occ.includes('baby')) return '/images/categories/babyshower.jpg';
                  if (occ.includes('balloon') || occ.includes('arch')) return '/images/categories/balloons.jpg';
                  if (occ.includes('corporate') || occ.includes('office')) return '/images/categories/corporate.jpg';
                  if (occ.includes('surprise') || occ.includes('party')) return '/images/categories/surprise.jpg';
                  if (occ.includes('sweet') || occ.includes('cake')) return '/images/categories/sweets.jpg';
                  return '/images/categories/birthday.jpg';
                };

                let photo = getFallback(pkg.occasion_tags);
                if (typeof rawPhoto === 'string' && rawPhoto.trim()) {
                  let clean = rawPhoto.trim().replace(/\\/g, '/');
                  if (clean.startsWith('public/')) clean = clean.replace(/^public\//, '/');
                  if (clean.startsWith('uploads/')) clean = '/' + clean;
                  if (clean.startsWith('/') || clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
                    photo = clean;
                  }
                }

                const inclusionsText = Array.isArray(pkg.included_items) && pkg.included_items.length > 0
                  ? pkg.included_items.slice(0, 3).join(', ')
                  : (pkg.description || 'Doorstep Celebration Decor & Cake');

                return (
                  <div
                    key={pkg.package_id}
                    onClick={() => handleBookNow(pkg.package_id)}
                    className="swiggy-authentic-card"
                  >
                    <div className="swiggy-card-img-banner">
                      <img
                        src={photo}
                        alt={pkg.package_name}
                        className="swiggy-card-img"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getFallback(pkg.occasion_tags);
                        }}
                      />
                      <div className="swiggy-card-gradient" />
                      <div className="swiggy-card-banner-offer">{discountTag}</div>

                      {pkg.video_url && (
                        <div className="swiggy-card-video-pill">
                          <span>▶</span> Setup Video
                        </div>
                      )}

                      <button
                        onClick={(e) => toggleFavorite(pkg.package_id, e)}
                        className="swiggy-card-fav-btn"
                        aria-label="Save to favorites"
                      >
                        {isFav ? '❤️' : '🤍'}
                      </button>
                    </div>

                    <div className="swiggy-card-details">
                      <h3 className="swiggy-item-title">{pkg.package_name}</h3>

                      <div className="swiggy-rating-row">
                        <span className="swiggy-green-icon">★</span>
                        <span>{pkg.rating || '4.9'}</span>
                        <span style={{ color: '#02060C', margin: '0 2px' }}>•</span>
                        <span>{pkg.setup_time || '2-3 hrs setup'}</span>
                      </div>

                      <p className="swiggy-sub-line-1">{inclusionsText}</p>

                      <div className="swiggy-sub-line-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/studio/${pkg.planner_id || 'planner1'}`);
                          }}
                          style={{ cursor: 'pointer', color: 'inherit' }}
                        >
                          by <strong style={{ color: '#02060C' }}>{pkg.business_name || 'Verified Planner'}</strong>
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/studio/${pkg.planner_id || 'planner1'}`);
                          }}
                          style={{ color: '#E55A00', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                        >
                          Menu ➔
                        </span>
                      </div>

                      <div className="swiggy-price-cta-row">
                        <div className="swiggy-price-block">
                          <span className="swiggy-price-curr">₹{Number(pkg.price).toLocaleString('en-IN')}</span>
                          {origPrice > pkg.price && (
                            <span className="swiggy-price-old">₹{Number(origPrice).toLocaleString('en-IN')}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleBookNow(pkg.package_id, e)}
                          className="swiggy-book-pill"
                        >
                          BOOK NOW →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="site-footer">
        <div className="page-container">
          <div className="footer-logo-box">
            <Logo3D size="lg" theme="dark" />
          </div>
          <p className="footer-sub">© 2026 Momanto · Real-Time Celebrations Delivered in Bhopal & across India</p>
          <div className="footer-links">
            <Link href="/planner/login" className="footer-link">
              Planner Portal
            </Link>
            <a href="#" className="footer-link">
              About Us
            </a>
            <a href="#" className="footer-link">
              Terms & Safety
            </a>
            <a href="https://wa.me/916204507166" target="_blank" rel="noreferrer" className="footer-link">
              24/7 WhatsApp Help
            </a>
          </div>
        </div>
      </footer>

      {/* ════ SWIGGY MOBILE FIXED BOTTOM NAVIGATION BAR ════ */}
      <nav className="bottom-nav-mobile">
        <div
          onClick={() => {
            setSearchQuery('');
            document.getElementById('celebration-grid')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bnav-item active"
        >
          <span className="bnav-icon">🎉</span>
          <span>Celebrations</span>
        </div>

        <div onClick={openWizard} className="bnav-item">
          <span className="bnav-icon">⚡</span>
          <span>60s Wizard</span>
        </div>

        <div onClick={handleAutoTrack} className="bnav-item">
          <span className="bnav-icon">📍</span>
          <span>Track Order</span>
        </div>

        <div onClick={() => setShowProfile(true)} className="bnav-item">
          <span className="bnav-icon">👤</span>
          <span>{currentUser ? currentUser.name.split(' ')[0] : 'Profile'}</span>
        </div>

        <div onClick={openWizard} className="bnav-item">
          <span className="bnav-win-pill">🎁 ₹500 OFF</span>
        </div>
      </nav>

      {/* ════ SWIGGY USER & PLANNER PROFILE DRAWER ════ */}
      {showProfile && (
        <div className="drawer-overlay" onClick={() => setShowProfile(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Peach Top Header with User Info or Guest Login Prompt */}
            <div className="drawer-header-peach">
              <button
                onClick={() => setShowProfile(false)}
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
                      setShowProfile(false);
                      setAuthTab('login');
                      setAuthStep(1);
                      setAuthError('');
                      setShowAuthModal(true);
                    }}
                    style={{
                      background: 'var(--orange)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 900,
                      padding: '8px 18px',
                      borderRadius: 10,
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
                onClick={handleAutoTrack}
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
                      try {
                        localStorage.removeItem('momanto_latest_order_id');
                        localStorage.removeItem('momanto_latest_order_info');
                      } catch {}
                      setLatestOrder(null);
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
              <div className="drawer-tile-btn" onClick={() => alert('Saved Addresses: Bhopal & Indore')}>
                <span className="dtile-icon">📍</span>
                <span className="dtile-label">Saved Address</span>
              </div>
              <div className="drawer-tile-btn" onClick={() => alert('Payment Modes: UPI, Cards, NetBanking')}>
                <span className="dtile-icon">💳</span>
                <span className="dtile-label">Payment Modes</span>
              </div>
              <div className="drawer-tile-btn" onClick={handleAutoTrack}>
                <span className="dtile-icon">🔄</span>
                <span className="dtile-label">{latestOrder ? 'Track Order 🟢' : 'Track Booking'}</span>
              </div>
              <div className="drawer-tile-btn" onClick={() => alert('Momanto Wallet Balance: ₹500.00')}>
                <span className="dtile-icon">👛</span>
                <span className="dtile-label">Momanto Wallet</span>
              </div>
            </div>

            {/* List of Menu Options */}
            <div className="drawer-menu-list">
              <Link href="/planner/login" className="drawer-menu-item" onClick={() => setShowProfile(false)}>
                <div className="drawer-item-left">
                  <span className="ditem-icon">👨‍🎨</span>
                  <div>
                    <span className="ditem-text">Event Planner Portal</span>
                    <p style={{ fontSize: 11, color: 'var(--green-dk)', fontWeight: 700 }}>Log in to accept customer orders & manage packages</p>
                  </div>
                </div>
                <span className="ditem-arrow">→</span>
              </Link>

              {/* 1-Click Track Live Order Option */}
              <div className="drawer-menu-item" onClick={handleAutoTrack}>
                <div className="drawer-item-left">
                  <span className="ditem-icon">📍</span>
                  <div>
                    <span className="ditem-text">Track Live Order</span>
                    {latestOrder && (
                      <p style={{ fontSize: 11, color: 'var(--orange-dk)', fontWeight: 800 }}>
                        Active: {latestOrder.package_name} ({latestOrder.order_id})
                      </p>
                    )}
                  </div>
                </div>
                <span className="ditem-arrow">›</span>
              </div>

              <div className="drawer-menu-item" onClick={() => { setShowProfile(false); openWizard(); }}>
                <div className="drawer-item-left">
                  <span className="ditem-icon">⚡</span>
                  <span className="ditem-text">Book in 60 Seconds Wizard</span>
                </div>
                <span className="ditem-arrow">›</span>
              </div>

              <div className="drawer-menu-item" onClick={() => alert('Your Vouchers: FLAT500 (Applied), BIRTHDAY30 (Active)')}>
                <div className="drawer-item-left">
                  <span className="ditem-icon">🎟️</span>
                  <span className="ditem-text">My Vouchers & Offers</span>
                </div>
                <span className="ditem-arrow">›</span>
              </div>

              <div className="drawer-menu-item" onClick={() => {
                setShowProfile(false);
                document.getElementById('celebration-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                <div className="drawer-item-left">
                  <span className="ditem-icon">❤️</span>
                  <span className="ditem-text">Favourites & Saved Packages</span>
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

              <div className="drawer-menu-item" onClick={() => alert('Momanto 100% On-Time Setup Guarantee: If our planner arrives late, get full refund + ₹500 voucher.')}>
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
                  style={{ borderTop: '2px dashed #F1F1F4', marginTop: 12 }}
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
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#F4F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 900,
                color: '#1C1C1C',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <Logo3D size="md" />
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', marginTop: 10, marginBottom: 4 }}>
                {authTab === 'forgot'
                  ? (authStep === 1 ? 'Reset Password 🔑' : 'Set New Password 🔐')
                  : authTab === 'login'
                    ? 'Welcome Back! 👋'
                    : 'Create Your Account 🎉'}
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 700 }}>
                {authTab === 'forgot'
                  ? (authStep === 1
                    ? 'Enter your registered mobile number to receive a reset OTP'
                    : `Enter the code sent to +91 ${authPhone.slice(-10)} and create a new password`)
                  : authTab === 'login'
                    ? 'Login with your mobile/email and password'
                    : 'Register with Name, Mobile, Email & Password'}
              </p>
            </div>

            {authError && (
              <div
                style={{
                  background: '#FEE2E2',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: 12.5,
                  fontWeight: 800,
                  marginBottom: 14,
                  border: '1px solid #FECACA',
                }}
              >
                ⚠️ {authError}
              </div>
            )}

            {authSuccessMsg && (
              <div
                style={{
                  background: '#DCFCE7',
                  color: '#166534',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: 12.5,
                  fontWeight: 800,
                  marginBottom: 14,
                  border: '1px solid #BBF7D0',
                }}
              >
                ✅ {authSuccessMsg}
              </div>
            )}

            {authTab !== 'forgot' ? (
              <>
                {/* Tabs: Login vs Register */}
                <div className="auth-tab-row">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setAuthError('');
                      setAuthSuccessMsg('');
                    }}
                    className={`auth-tab-btn${authTab === 'login' ? ' active' : ''}`}
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
                    className={`auth-tab-btn${authTab === 'register' ? ' active' : ''}`}
                  >
                    📝 Register
                  </button>
                </div>

                {authTab === 'login' ? (
                  /* ── TAB 1: LOGIN WITH PASSWORD (FREE - NO SMS COST) ── */
                  <form onSubmit={handleLogin}>
                    <div className="auth-field-group">
                      <label className="auth-field-label">Mobile Number or Email *</label>
                      <div className="auth-input-box">
                        <span style={{ fontSize: 16 }}>📱</span>
                        <input
                          required
                          type="text"
                          placeholder="10-digit mobile or email"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          className="auth-input-inner"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label className="auth-field-label" style={{ margin: 0 }}>Password *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab('forgot');
                            setAuthStep(1);
                            setAuthError('');
                            setAuthSuccessMsg('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--orange-dk)',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="auth-input-box">
                        <span style={{ fontSize: 16 }}>🔒</span>
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="auth-input-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || !authPhone.trim() || !authPassword}
                      className="auth-submit-btn"
                    >
                      {authLoading ? 'Logging In…' : 'Log In to Momanto →'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 700 }}>
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab('register');
                            setAuthError('');
                            setAuthSuccessMsg('');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--orange-dk)', fontWeight: 900, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Register Free
                        </button>
                      </span>
                    </div>

                    {pendingPackageId && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = pendingPackageId;
                            setShowAuthModal(false);
                            setPendingPackageId(null);
                            router.push(`/checkout/${targetId}`);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          ⚡ Continue as Guest (Order without Login) →
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  /* ── TAB 2: REGISTER WITH NAME, PHONE, EMAIL, PASSWORD ── */
                  <form onSubmit={handleRegister}>
                    <div className="auth-field-group">
                      <label className="auth-field-label">Full Name *</label>
                      <div className="auth-input-box">
                        <span style={{ fontSize: 16 }}>👤</span>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="auth-input-inner"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label">10-Digit Mobile Number *</label>
                      <div className="auth-input-box">
                        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink)' }}>🇮🇳 +91</span>
                        <input
                          required
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 98XXXXXXXX"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ''))}
                          className="auth-input-inner"
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label">Email Address *</label>
                      <div className="auth-input-box">
                        <span style={{ fontSize: 16 }}>✉️</span>
                        <input
                          required
                          type="email"
                          placeholder="e.g. rahul@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="auth-input-inner"
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label">Create Password * (min 6 characters)</label>
                      <div className="auth-input-box">
                        <span style={{ fontSize: 16 }}>🔒</span>
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="auth-input-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || !authName.trim() || authPhone.replace(/\D/g, '').length < 10 || !authEmail.trim() || authPassword.length < 6}
                      className="auth-submit-btn"
                    >
                      {authLoading ? 'Creating Account…' : 'Create Free Account & Continue →'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 700 }}>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab('login');
                            setAuthError('');
                            setAuthSuccessMsg('');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--orange-dk)', fontWeight: 900, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Log In
                        </button>
                      </span>
                    </div>

                    {pendingPackageId && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = pendingPackageId;
                            setShowAuthModal(false);
                            setPendingPackageId(null);
                            router.push(`/checkout/${targetId}`);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          ⚡ Continue as Guest (Order without Login) →
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </>
            ) : (
              /* ── FORGOT PASSWORD FLOW (OTP IS ONLY SENT HERE) ── */
              <div>
                {authStep === 1 ? (
                  <form onSubmit={handleForgotSendOtp}>
                    <div className="auth-field-group">
                      <label className="auth-field-label">Registered 10-Digit Mobile Number *</label>
                      <div className="auth-input-box">
                        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink)' }}>🇮🇳 +91</span>
                        <input
                          required
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 98XXXXXXXX"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ''))}
                          className="auth-input-inner"
                          autoFocus
                        />
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6, fontWeight: 600 }}>
                        We will send a 4-digit verification code to this number via SMS & WhatsApp.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || authPhone.replace(/\D/g, '').length < 10}
                      className="auth-submit-btn"
                    >
                      {authLoading ? 'Sending Reset Code…' : 'Send Reset Code (OTP) →'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('login');
                          setAuthError('');
                          setAuthSuccessMsg('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </form>
                ) : (
                  /* FORGOT PASSWORD STEP 2: VERIFY OTP + SET NEW PASSWORD */
                  <form onSubmit={handleForgotReset}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#FFF3E9',
                        padding: '8px 12px',
                        borderRadius: 10,
                        marginBottom: 14,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange-dk)' }}>
                        📱 +91 {authPhone.slice(-10)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep(1);
                          setAuthError('');
                        }}
                        style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--orange)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Change
                      </button>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label" style={{ textAlign: 'center' }}>
                        Enter 4-Digit Reset OTP Code *
                      </label>
                      <div className="auth-input-box" style={{ justifyContent: 'center' }}>
                        <input
                          ref={otpInputRef}
                          type="text"
                          maxLength={4}
                          value={authOtp}
                          onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="• • • •"
                          className="auth-input-inner"
                          style={{
                            textAlign: 'center',
                            fontSize: 24,
                            letterSpacing: 8,
                            fontWeight: 900,
                          }}
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label">Set New Password * (min 6 characters)</label>
                      <div className="auth-input-box">
                        <span style={{ fontSize: 16 }}>🔒</span>
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={authNewPassword}
                          onChange={(e) => setAuthNewPassword(e.target.value)}
                          className="auth-input-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || authOtp.length < 4 || authNewPassword.length < 6}
                      className="auth-submit-btn"
                    >
                      {authLoading ? 'Resetting Password…' : 'Reset Password & Log In →'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                      {otpTimer > 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>
                          Resend OTP in <strong>{otpTimer}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleForgotSendOtp}
                          style={{
                            fontSize: 12.5,
                            fontWeight: 900,
                            color: 'var(--orange)',
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Resend Reset Code
                        </button>
                      )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('login');
                          setAuthStep(1);
                          setAuthError('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ← Cancel & Back to Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ TRACK MODAL ════ */}
      {showTrack && (
        <div className="modal-overlay" onClick={() => setShowTrack(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>Track Your Celebration 📍</h2>
              <button
                onClick={() => setShowTrack(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--page-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'var(--ink)',
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Enter the Order ID you received when booking
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value.toUpperCase())}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  trackInput.trim() &&
                  (window.location.href = `/track/${trackInput.trim()}`)
                }
                placeholder="e.g. MOM1234567890"
                autoFocus
                style={{
                  flex: 1,
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 14,
                  fontWeight: 700,
                  outline: 'none',
                  color: 'var(--ink)',
                }}
              />
              <button
                onClick={() => trackInput.trim() && (window.location.href = `/track/${trackInput.trim()}`)}
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Track
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ FILTER MODAL ════ */}
      {showFilter && (
        <div className="modal-overlay" onClick={() => setShowFilter(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '18px 16px 28px' }}>
            <div style={{ width: 36, height: 4, background: '#DDD', borderRadius: 4, margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--ink)' }}>Filter by Budget</h3>
              <button
                onClick={() => setShowFilter(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--page-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'var(--ink)',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Price Range
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {pricePresets.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setActivePreset(i);
                    setPriceMin(String(p.min));
                    setPriceMax(p.max === Infinity ? '' : String(p.max));
                  }}
                  style={{
                    background: activePreset === i ? 'var(--green)' : 'var(--page-bg)',
                    border: `1.5px solid ${activePreset === i ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 50,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    color: activePreset === i ? '#fff' : 'var(--ink)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleApplyFilter}
              style={{
                width: '100%',
                background: 'var(--green)',
                color: '#fff',
                borderRadius: 12,
                padding: '13px',
                fontSize: 14,
                fontWeight: 900,
                boxShadow: '0 4px 14px rgba(29,185,84,0.28)',
              }}
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* ════ WIZARD MODAL ════ */}
      {showWizard && (
        <div className="modal-overlay" onClick={() => setShowWizard(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: '#DDD', borderRadius: 4, margin: '10px auto 0' }} />

            <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #D93B0A, var(--orange))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    color: '#fff',
                  }}
                >
                  ⚡
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--orange)' }}>Book in 60 Seconds</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {WIZARD_STEPS.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          height: 3.5,
                          borderRadius: 4,
                          transition: 'all 0.3s',
                          width: i === wizStep ? 22 : 6,
                          background: i <= wizStep ? 'var(--orange)' : '#E0E0E0',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--page-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: 'var(--ink)',
                }}
              >
                ✕
              </button>
            </div>

            {!wizDone ? (
              <div key={wizStep} style={{ padding: '18px 16px 28px', animation: 'slideUp 0.28s ease' }}>
                <h2 style={{ fontSize: 19, fontWeight: 900, color: 'var(--ink)', marginBottom: 3 }}>
                  {WIZARD_STEPS[wizStep].title}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                  {WIZARD_STEPS[wizStep].subtitle}
                </p>

                {[0, 2].includes(wizStep) ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {WIZARD_STEPS[wizStep].options.map((opt) => {
                      const isSel = wizAnswers[WIZARD_STEPS[wizStep].id]?.label === opt.label;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => wizSelect(opt)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: isSel ? `${opt.color}15` : 'var(--page-bg)',
                            border: `2px solid ${isSel ? opt.color : 'var(--border)'}`,
                            borderRadius: 12,
                            padding: '11px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 9,
                              background: `${opt.color}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              flexShrink: 0,
                            }}
                          >
                            {opt.emoji}
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: isSel ? opt.color : 'var(--ink)',
                              textAlign: 'left',
                            }}
                          >
                            {opt.label}
                          </span>
                          {isSel && (
                            <div
                              style={{
                                marginLeft: 'auto',
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: opt.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {WIZARD_STEPS[wizStep].options.map((opt) => {
                      const isSel = wizAnswers[WIZARD_STEPS[wizStep].id]?.label === opt.label;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => wizSelect(opt)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: isSel ? `${opt.color}12` : 'var(--page-bg)',
                            border: `2px solid ${isSel ? opt.color : 'var(--border)'}`,
                            borderRadius: 12,
                            padding: '13px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: `${opt.color}22`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                              flexShrink: 0,
                            }}
                          >
                            {opt.emoji}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: isSel ? opt.color : 'var(--ink)' }}>
                            {opt.label}
                          </span>
                          {isSel && (
                            <div
                              style={{
                                marginLeft: 'auto',
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: opt.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {wizStep === 0 && showOtherInput && (
                  <div
                    style={{
                      marginTop: 14,
                      background: 'var(--page-bg)',
                      borderRadius: 12,
                      padding: '12px',
                      border: '1.5px solid var(--border)',
                    }}
                  >
                    <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
                      ✏️ Describe your occasion
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        autoFocus
                        value={wizOtherText}
                        onChange={(e) => setWizOtherText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && wizOtherText.trim() && wizConfirmOther()}
                        placeholder="e.g. Retirement party…"
                        style={{
                          flex: 1,
                          border: '1.5px solid var(--border)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          fontSize: 13,
                          outline: 'none',
                          color: 'var(--ink)',
                        }}
                      />
                      <button
                        onClick={wizConfirmOther}
                        style={{
                          background: 'var(--orange)',
                          color: '#fff',
                          borderRadius: 8,
                          padding: '0 14px',
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}

                {wizStep > 0 && (
                  <button
                    onClick={() => setWizStep((s) => s - 1)}
                    style={{
                      marginTop: 16,
                      width: '100%',
                      border: '1.5px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px',
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    ← Back
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '36px 16px 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#E8F9EE,#C8F0D6)',
                    border: '2px solid #A8E6CF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                  }}
                >
                  🎉
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', marginBottom: 4 }}>
                    You're all set!
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                    Finding the best packages for<br />
                    <strong style={{ color: 'var(--orange)' }}>
                      {wizAnswers.occasion?.label || 'your celebration'}
                    </strong>
                    {wizAnswers.budget ? ` · ${wizAnswers.budget.label}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ 24x7 CELEBRATION CONCIERGE FLOATING CHAT ════ */}
      <div
        style={{
          position: 'fixed',
          bottom: 84,
          right: 20,
          zIndex: 900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {/* Floating Trigger Button */}
        {!showChatWidget && (
          <button
            onClick={() => setShowChatWidget(true)}
            style={{
              background: 'linear-gradient(135deg, #FC8019, #FF4D15)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 50,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(252, 128, 25, 0.45)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <span>24/7 Celebration Help</span>
          </button>
        )}

        {/* Interactive Chat Window */}
        {showChatWidget && (
          <div
            style={{
              width: 340,
              maxWidth: '90vw',
              background: '#FFFFFF',
              borderRadius: 22,
              boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
              border: '1.5px solid #E2E8F0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.25s ease',
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #02060C, #1E293B)',
                color: '#FFFFFF',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🎉</span>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Momanto Concierge</h4>
                  <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>● Online · Instant Reply</span>
                </div>
              </div>
              <button
                onClick={() => setShowChatWidget(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 26,
                  height: 26,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>

            {/* Chat Messages Body */}
            <div
              style={{
                padding: '14px',
                height: 260,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: '#F8FAFC',
              }}
            >
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.sender === 'user' ? '#FC8019' : '#FFFFFF',
                    color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                    padding: '10px 14px',
                    borderRadius: 16,
                    fontSize: 12.5,
                    fontWeight: 700,
                    lineHeight: 1.4,
                    maxWidth: '85%',
                    border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Quick Action Chips */}
            <div style={{ padding: '8px 12px', background: '#FFFFFF', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 6, overflowX: 'auto' }}>
              {[
                '🎂 Customize cake?',
                '⚡ Setup arrival time?',
                '🏷️ Discount codes?',
                '💬 WhatsApp Support',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendChat(chip)}
                  style={{
                    flexShrink: 0,
                    background: '#FFF3E9',
                    border: '1px solid #FFD1B3',
                    color: '#C2410C',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 8px',
                    borderRadius: 50,
                    cursor: 'pointer',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              style={{
                padding: '10px 12px',
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: 8,
              }}
            >
              <input
                type="text"
                placeholder="Ask anything about celebrations…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#02060C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ════ SWIGGY LIVE LOCATION & CITY SWITCHER DRAWER ════ */}
      {showLocationDrawer && (
        <div
          className="drawer-overlay"
          onClick={() => setShowLocationDrawer(false)}
        >
          <div
            className="drawer-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#02060C', margin: 0 }}>
                  Select Delivery Location 📍
                </h3>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                  Find certified celebration planners in your city
                </span>
              </div>
              <button
                onClick={() => setShowLocationDrawer(false)}
                style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            {/* GPS Detection Button */}
            <button
              onClick={handleGpsDetect}
              disabled={gpsLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FFF3E9, #FFEADB)',
                border: '1.5px solid #FFD1B3',
                borderRadius: 16,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                marginBottom: 20,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 24 }}>{gpsLoading ? '⏳' : '🎯'}</span>
              <div>
                <strong style={{ fontSize: 14, color: '#C2410C', display: 'block' }}>
                  {gpsLoading ? 'Detecting GPS Coordinates…' : 'Use Current Location (GPS)'}
                </strong>
                <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 700 }}>
                  Using device satellite / network positioning
                </span>
              </div>
            </button>

            {/* Search Location Input */}
            <div style={{ marginBottom: 18 }}>
              <input
                type="text"
                placeholder="Search area, colony or landmark…"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                style={{
                  width: '100%',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '12px 14px',
                  fontSize: 13.5,
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>

            {/* Popular Cities Grid */}
            <p style={{ fontSize: 12, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Popular Celebration Cities
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { name: 'Bhopal, MP Nagar', tag: '⚡ 2-Hr Delivery' },
                { name: 'Indore, Vijay Nagar', tag: '⚡ Fast Arrival' },
                { name: 'Patna, Boring Road', tag: '⚡ Active Studios' },
                { name: 'Delhi NCR, Connaught Place', tag: '👑 Pro Studios' },
                { name: 'Mumbai, Bandra West', tag: '👑 Luxury Setups' },
                { name: 'Jaipur, Malviya Nagar', tag: '⚡ Available' },
                { name: 'Bangalore, Koramangala', tag: '⚡ Fast Arrival' },
              ].map((c) => {
                const isSelected = selectedCity.toLowerCase().includes(c.name.split(',')[0].toLowerCase());
                return (
                  <button
                    key={c.name}
                    onClick={() => handleSelectCity(c.name)}
                    style={{
                      background: isSelected ? '#02060C' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      border: isSelected ? '1.5px solid #02060C' : '1.5px solid #E2E8F0',
                      borderRadius: 14,
                      padding: '12px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(2,6,12,0.2)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 900, display: 'block' }}>{c.name.split(',')[0]}</span>
                    <span style={{ fontSize: 11, color: isSelected ? '#94A3B8' : '#64748B', fontWeight: 600 }}>{c.name.split(',')[1]}</span>
                    <span style={{ fontSize: 10, color: isSelected ? '#10B981' : '#E55A00', fontWeight: 800, display: 'block', marginTop: 4 }}>{c.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export async function getServerSideProps() {
  try {
    const { dbHelpers } = require('../backend/config/database');
    const dbPkgs = await dbHelpers.all(`
      SELECT p.*, pl.business_name, pl.city, pl.phone, 
             pl.whatsapp_number as planner_whatsapp, 
             pl.is_active as planner_is_active
      FROM packages p 
      JOIN planners pl ON p.planner_id = pl.planner_id 
      WHERE p.is_active = 1 AND pl.is_active = 1
      ORDER BY p.created_at DESC
    `);

    const parse = (pkg) => {
      let photos = [];
      try {
        photos = typeof pkg.photos === 'string' ? JSON.parse(pkg.photos) : (pkg.photos || []);
      } catch {
        photos = pkg.photos ? [pkg.photos] : [];
      }
      photos = (Array.isArray(photos) ? photos : [photos]).filter(Boolean).map(p => {
        if (typeof p !== 'string') return '';
        let clean = p.trim().replace(/\\/g, '/');
        if (clean.startsWith('public/')) clean = clean.replace(/^public\//, '/');
        if (clean.startsWith('uploads/')) clean = '/' + clean;
        return clean;
      }).filter(Boolean);

      let occasion_tags = [];
      try {
        occasion_tags = typeof pkg.occasion_tags === 'string' ? JSON.parse(pkg.occasion_tags) : (pkg.occasion_tags || []);
      } catch {
        occasion_tags = [];
      }

      if (!photos || photos.length === 0) {
        let defaultImg = '/images/categories/birthday.jpg';
        const occ = occasion_tags.join(' ').toLowerCase();
        if (occ.includes('anniversary') || occ.includes('romantic')) defaultImg = '/images/categories/anniversary.jpg';
        else if (occ.includes('wedding')) defaultImg = '/images/categories/wedding.jpg';
        else if (occ.includes('baby')) defaultImg = '/images/categories/babyshower.jpg';
        else if (occ.includes('balloon')) defaultImg = '/images/categories/balloons.jpg';
        else if (occ.includes('corporate')) defaultImg = '/images/categories/corporate.jpg';
        else if (occ.includes('surprise') || occ.includes('party')) defaultImg = '/images/categories/surprise.jpg';
        photos = [defaultImg];
      }

      let video_url = (pkg.video_url || '').trim().replace(/\\/g, '/');
      if (video_url.startsWith('public/')) video_url = video_url.replace(/^public\//, '/');
      if (video_url.startsWith('uploads/')) video_url = '/' + video_url;

      let included_items = [];
      try {
        included_items = typeof pkg.included_items === 'string' ? JSON.parse(pkg.included_items) : (pkg.included_items || []);
      } catch {
        included_items = [];
      }

      const price = Number(pkg.price) || 0;
      const original_price = pkg.original_price || Math.round(price * 1.35);

      return {
        ...pkg,
        photos,
        video_url,
        included_items,
        occasion_tags,
        price,
        original_price,
        rating: pkg.rating || '4.9',
        reviews_count: pkg.reviews_count || 48,
        setup_time: pkg.setup_time || '2–3 hrs setup',
        category: occasion_tags[0] || 'Celebration',
        discount_tag: pkg.discount_tag || '30% OFF'
      };
    };

    return {
      props: {
        initialPackages: dbPkgs.map(parse)
      }
    };
  } catch (err) {
    console.error('Error in getServerSideProps:', err);
    return {
      props: {
        initialPackages: []
      }
    };
  }
}
