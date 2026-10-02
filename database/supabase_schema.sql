-- ═══════════════════════════════════════════════════════════════════════
-- MOMANTO CELEBRATIONS - PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- ═══════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PLANNERS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planners (
  planner_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  telegram_chat_id TEXT,
  city TEXT NOT NULL DEFAULT 'Bhopal',
  type TEXT DEFAULT 'planner',
  rating NUMERIC(3, 1) DEFAULT 4.9,
  total_ratings INTEGER DEFAULT 140,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. PACKAGES TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packages (
  package_id TEXT PRIMARY KEY,
  planner_id TEXT NOT NULL REFERENCES planners(planner_id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  discount_percent INTEGER DEFAULT 25,
  photos JSONB DEFAULT '["/images/categories/birthday.jpg"]'::jsonb,
  included_items JSONB DEFAULT '[]'::jsonb,
  custom_addons JSONB DEFAULT '[]'::jsonb,
  occasion_tags JSONB DEFAULT '["Birthday"]'::jsonb,
  supported_modes TEXT DEFAULT 'home,custom',
  setup_time TEXT DEFAULT '2–3 hrs setup',
  whatsapp_number TEXT,
  gallery_url TEXT,
  video_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. USERS (CUSTOMERS) TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. ORDERS TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  planner_id TEXT NOT NULL REFERENCES planners(planner_id),
  package_id TEXT NOT NULL REFERENCES packages(package_id),
  package_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp TEXT,
  customer_email TEXT,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  event_location TEXT NOT NULL,
  event_for_whom TEXT,
  occasion TEXT,
  age_milestone TEXT,
  theme_preference TEXT,
  num_guests INTEGER,
  special_requests TEXT,
  dietary_restrictions TEXT,
  selected_addons JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'upi',
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  status TEXT DEFAULT 'pending',
  celebration_mode TEXT DEFAULT 'home',
  call_made_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 5. REVIEWS & RATINGS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  review_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  order_id TEXT REFERENCES orders(order_id),
  planner_id TEXT NOT NULL REFERENCES planners(planner_id),
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags JSONB DEFAULT '[]'::jsonb,
  comment TEXT,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 6. PAYOUTS TABLE (PLANNER EARNINGS WITHDRAWALS) ───────────────────
CREATE TABLE IF NOT EXISTS payouts (
  payout_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  planner_id TEXT NOT NULL REFERENCES planners(planner_id),
  amount NUMERIC(10, 2) NOT NULL,
  method TEXT NOT NULL, -- 'upi' | 'bank'
  details JSONB NOT NULL,
  status TEXT DEFAULT 'processing', -- 'processing' | 'completed' | 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── 7. COUPONS TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'flat', -- 'flat' | 'percent'
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  max_discount_amount NUMERIC(10, 2),
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── INDEXES FOR FAST PERFORMANCE ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_packages_planner ON packages(planner_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_planner ON orders(planner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_reviews_planner ON reviews(planner_id);
