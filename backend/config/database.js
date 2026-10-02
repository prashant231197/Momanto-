require('dotenv').config();
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const PLANNERS = require('./planners');

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MOMANTO DUAL-MODE DATABASE ADAPTER
 * • Mode 1: Supabase PostgreSQL (if DATABASE_URL is set in .env)
 * • Mode 2: Local SQLite (fallback for offline / local testing)
 * ═══════════════════════════════════════════════════════════════════════
 */

const isPostgres = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  console.log('🐘 Initializing Supabase / Railway PostgreSQL Connection Pool...');
  pgPool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  pgPool.query('SELECT NOW()', async (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection error:', err.message);
    } else {
      console.log('✅ Connected to PostgreSQL at:', res.rows[0].now);
      await initializePostgresDatabase();
    }
  });
} else {
  const dbDir = path.join(process.cwd(), 'database');
  const dbPath = path.join(dbDir, 'momanto.db');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening SQLite database:', err);
    } else {
      console.log('✅ Connected to local SQLite database (Add DATABASE_URL in .env to switch to Supabase)');
      initializeSqliteDatabase();
    }
  });
}

// ── SQL Syntax Translator (Converts ? placeholders to $1, $2 for Postgres) ──
function formatQueryForEngine(sql) {
  if (!isPostgres) return sql;

  let paramIndex = 1;
  // Replace ? with $1, $2, etc.
  let converted = sql.replace(/\?/g, () => `$${paramIndex++}`);
  // Replace SQLite INSERT OR IGNORE with Postgres ON CONFLICT DO NOTHING
  converted = converted.replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO');
  if (sql.includes('INSERT OR IGNORE') && !converted.includes('ON CONFLICT')) {
    converted += ' ON CONFLICT DO NOTHING';
  }
  return converted;
}

// ── UNIVERSAL DB HELPERS ──────────────────────────────────────────────
const dbHelpers = {
  run: async (sql, params = []) => {
    if (isPostgres) {
      const formattedSql = formatQueryForEngine(sql);
      const res = await pgPool.query(formattedSql, params);
      return { id: res.rows[0]?.id, changes: res.rowCount };
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    }
  },

  get: async (sql, params = []) => {
    if (isPostgres) {
      const formattedSql = formatQueryForEngine(sql);
      const res = await pgPool.query(formattedSql, params);
      return res.rows[0] || null;
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  },

  all: async (sql, params = []) => {
    if (isPostgres) {
      const formattedSql = formatQueryForEngine(sql);
      const res = await pgPool.query(formattedSql, params);
      return res.rows;
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    }
  }
};

// ── SQLITE INITIALIZATION & SEEDING ──────────────────────────────────
function initializeSqliteDatabase() {
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS planners (
        planner_id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        business_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        telegram_chat_id TEXT,
        whatsapp_number TEXT,
        city TEXT NOT NULL,
        type TEXT DEFAULT 'planner',
        role TEXT DEFAULT 'planner',
        status TEXT DEFAULT 'approved',
        rating REAL DEFAULT 4.9,
        total_ratings INTEGER DEFAULT 140,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      console.log('✅ Planners table ready');
      seedSqlitePlanners();
    });

    sqliteDb.run(`ALTER TABLE planners ADD COLUMN role TEXT DEFAULT 'planner'`, () => {});
    sqliteDb.run(`ALTER TABLE planners ADD COLUMN status TEXT DEFAULT 'approved'`, () => {});

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS packages (
        package_id TEXT PRIMARY KEY,
        planner_id TEXT NOT NULL,
        package_name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        original_price REAL,
        discount_percent INTEGER DEFAULT 25,
        photos TEXT,
        included_items TEXT,
        custom_addons TEXT,
        occasion_tags TEXT,
        supported_modes TEXT DEFAULT 'home,custom',
        setup_time TEXT DEFAULT '2–3 hrs setup',
        whatsapp_number TEXT,
        gallery_url TEXT,
        video_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (planner_id) REFERENCES planners(planner_id)
      )
    `, () => {
      console.log('✅ Packages table ready');
    });

    sqliteDb.run(`ALTER TABLE packages ADD COLUMN coupon_code TEXT`, () => {});
    sqliteDb.run(`ALTER TABLE packages ADD COLUMN coupon_discount REAL`, () => {});

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        planner_id TEXT NOT NULL,
        package_id TEXT NOT NULL,
        package_name TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_whatsapp TEXT,
        customer_email TEXT,
        event_date TEXT NOT NULL,
        event_time TEXT NOT NULL,
        event_location TEXT NOT NULL,
        event_for_whom TEXT,
        occasion TEXT,
        age_milestone TEXT,
        theme_preference TEXT,
        num_guests INTEGER,
        special_requests TEXT,
        dietary_restrictions TEXT,
        selected_addons TEXT,
        total_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'upi',
        payment_status TEXT DEFAULT 'pending',
        payment_id TEXT,
        status TEXT DEFAULT 'pending',
        celebration_mode TEXT DEFAULT 'home',
        call_made_at DATETIME,
        confirmed_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (planner_id) REFERENCES planners(planner_id),
        FOREIGN KEY (package_id) REFERENCES packages(package_id)
      )
    `, () => {
      console.log('✅ Orders table ready');
    });

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      console.log('✅ Users table ready');
    });

    sqliteDb.run(`ALTER TABLE users ADD COLUMN password_hash TEXT`, () => {});

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id TEXT PRIMARY KEY,
        order_id TEXT,
        planner_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        tags TEXT,
        comment TEXT,
        photo_urls TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      console.log('✅ Reviews table ready');
    });

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS payouts (
        payout_id TEXT PRIMARY KEY,
        planner_id TEXT NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        details TEXT NOT NULL,
        status TEXT DEFAULT 'processing',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      console.log('✅ Payouts table ready');
      seedSqlitePackages();
    });
  });
}

const DEFAULT_PACKAGES = [
  {
    package_id: 'p1',
    planner_id: 'PLN001',
    package_name: 'Royal Birthday Bash',
    description: 'Complete 3D balloon arch, gourmet cake, photography, fairy lights & personalized banner.',
    price: 4999,
    original_price: 6999,
    discount_percent: 28,
    photos: JSON.stringify(['/images/categories/birthday.jpg', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800']),
    included_items: JSON.stringify([
      'Complete 3D Balloon Arch (100+ Metallic Balloons)',
      'Gourmet 1kg Fresh Fondant Birthday Cake',
      'Personalised LED Name & Age Milestone Banner',
      '2-Hour On-Site Setup by Pro Decorator Team',
      '10m Warm Ambient Fairy Lights & Spotlights',
      '10 High-Res Edited Digital Photoshoots'
    ]),
    custom_addons: JSON.stringify([]),
    occasion_tags: JSON.stringify(['birthday', 'celebration']),
    supported_modes: 'home,restaurant,custom',
    setup_time: '2–3 hrs',
    whatsapp_number: '916204507166',
    is_active: 1
  },
  {
    package_id: 'p2',
    planner_id: 'PLN002',
    package_name: 'Candlelight Anniversary Setup',
    description: 'Fresh red roses, glowing golden candles, luxury dinner canopy & romantic couple photoshoot.',
    price: 7999,
    original_price: 10999,
    discount_percent: 27,
    photos: JSON.stringify(['/images/categories/anniversary.jpg', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800']),
    included_items: JSON.stringify([
      '100 Fresh Red Dutch Velvet Roses',
      'Scented Golden Candlelight & Rose Petals Path',
      'Romantic Couple Canopy with Satin Cushions',
      'Luxury Private Tableware & Centerpiece Setup',
      'Professional Couple Photographer (1 Hour Coverage)'
    ]),
    custom_addons: JSON.stringify([]),
    occasion_tags: JSON.stringify(['anniversary', 'romance']),
    supported_modes: 'home,restaurant,custom',
    setup_time: '2 hrs',
    whatsapp_number: '916204507166',
    is_active: 1
  },
  {
    package_id: 'p3',
    planner_id: 'PLN003',
    package_name: 'Baby Shower Pastel Delight',
    description: 'Teddy bear cradle theme, organic pastel balloons, cupcake tower & custom welcome easel.',
    price: 6499,
    original_price: 8999,
    discount_percent: 28,
    photos: JSON.stringify(['/images/categories/babyshower.jpg']),
    included_items: JSON.stringify([
      'Teddy bear cradle backdrop',
      'Organic pastel balloon garland',
      'Custom baby milestone welcome board',
      'Cupcake stand & fairy lighting'
    ]),
    custom_addons: JSON.stringify([]),
    occasion_tags: JSON.stringify(['baby shower']),
    supported_modes: 'home,custom',
    setup_time: '3 hrs',
    whatsapp_number: '916204507166',
    is_active: 1
  },
  {
    package_id: 'p4',
    planner_id: 'PLN004',
    package_name: 'Corporate Gala & Stage Setup',
    description: 'Illuminated stage setup, podium microphone, awards coordination & ambient LED backdrop.',
    price: 24999,
    original_price: 32000,
    discount_percent: 22,
    photos: JSON.stringify(['/images/categories/corporate.jpg']),
    included_items: JSON.stringify([
      'Illuminated stage & truss',
      'Podium with gooseneck microphone',
      'Ambient LED wall wash lights'
    ]),
    custom_addons: JSON.stringify([]),
    occasion_tags: JSON.stringify(['corporate']),
    supported_modes: 'custom',
    setup_time: '4 hrs',
    whatsapp_number: '916204507166',
    is_active: 1
  },
  {
    package_id: 'p5',
    planner_id: 'PLN005',
    package_name: 'Surprise Party Hamper & Decor',
    description: 'Glowing neon hearts, helium balloon ceiling, explosion gift box & professional photographer.',
    price: 3999,
    original_price: 5499,
    discount_percent: 27,
    photos: JSON.stringify(['/images/categories/surprise.jpg']),
    included_items: JSON.stringify([
      'Glowing neon heart sign',
      '50 Ceiling helium balloons',
      'Custom explosion surprise box'
    ]),
    custom_addons: JSON.stringify([]),
    occasion_tags: JSON.stringify(['surprise']),
    supported_modes: 'home,custom',
    setup_time: '2 hrs',
    whatsapp_number: '916204507166',
    is_active: 1
  },
  {
    package_id: 'p6',
    planner_id: 'PLN001',
    package_name: 'Grand Indian Wedding Mandap',
    description: 'Royal floral mandap, brass lamps, entrance tunnel arch, lighting & bridal suite decor.',
    price: 54999,
    original_price: 75000,
    discount_percent: 27,
    photos: JSON.stringify(['/images/categories/wedding.jpg']),
    included_items: JSON.stringify([
      'Royal floral mandap with fresh blooms',
      'Traditional brass lamps & havan kund setup',
      'Grand entrance tunnel arch'
    ]),
    custom_addons: JSON.stringify([]),
    occasion_tags: JSON.stringify(['wedding']),
    supported_modes: 'custom',
    setup_time: '5 hrs',
    whatsapp_number: '916204507166',
    is_active: 1
  }
];

async function seedSqlitePlanners() {
  console.log('🌱 Syncing planners from config...');
  for (const planner of PLANNERS) {
    const hashedPassword = await bcrypt.hash(planner.password, 10);
    const role = planner.role || (planner.email === 'planner@momanto.in' ? 'admin' : 'planner');
    const status = planner.status || 'approved';
    sqliteDb.run(`
      INSERT INTO planners 
      (planner_id, email, password_hash, business_name, phone, telegram_chat_id, city, type, role, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(planner_id) DO UPDATE SET
        email = excluded.email,
        password_hash = excluded.password_hash,
        business_name = excluded.business_name,
        phone = excluded.phone,
        telegram_chat_id = excluded.telegram_chat_id,
        city = excluded.city,
        type = excluded.type,
        role = excluded.role,
        status = excluded.status,
        is_active = excluded.is_active
    `, [
      planner.planner_id,
      planner.email,
      hashedPassword,
      planner.business_name,
      planner.phone,
      planner.telegram_chat_id,
      planner.city,
      planner.type || role,
      role,
      status,
      planner.is_active ? 1 : 0
    ]);
  }
  console.log(`✅ Synced ${PLANNERS.length} planners successfully`);
}

async function seedSqlitePackages() {
  console.log('🌱 Syncing default packages...');
  for (const pkg of DEFAULT_PACKAGES) {
    sqliteDb.run(`
      INSERT OR IGNORE INTO packages 
      (package_id, planner_id, package_name, description, price, original_price, discount_percent, photos,
       included_items, custom_addons, occasion_tags, supported_modes, setup_time, whatsapp_number, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pkg.package_id,
      pkg.planner_id,
      pkg.package_name,
      pkg.description,
      pkg.price,
      pkg.original_price,
      pkg.discount_percent,
      pkg.photos,
      pkg.included_items,
      pkg.custom_addons,
      pkg.occasion_tags,
      pkg.supported_modes,
      pkg.setup_time,
      pkg.whatsapp_number,
      pkg.is_active
    ]);
  }
  console.log(`✅ Synced default packages successfully`);
}

async function initializePostgresDatabase() {
  try {
    const schemaPath = path.join(process.cwd(), 'database', 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pgPool.query(sql);
      console.log('✅ PostgreSQL Schema initialized successfully');
    }
    await seedPostgresPlanners();
    await seedPostgresPackages();
  } catch (err) {
    console.error('❌ PostgreSQL Schema initialization error:', err.message);
  }
}

async function seedPostgresPlanners() {
  try {
    for (const planner of PLANNERS) {
      const hashedPassword = await bcrypt.hash(planner.password, 10);
      const role = planner.role || (planner.email === 'planner@momanto.in' ? 'admin' : 'planner');
      const status = planner.status || 'approved';
      await pgPool.query(`
        INSERT INTO planners 
        (planner_id, email, password_hash, business_name, phone, telegram_chat_id, city, type, role, status, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (planner_id) DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          business_name = EXCLUDED.business_name,
          phone = EXCLUDED.phone,
          telegram_chat_id = EXCLUDED.telegram_chat_id,
          city = EXCLUDED.city,
          type = EXCLUDED.type,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          is_active = EXCLUDED.is_active
      `, [
        planner.planner_id,
        planner.email,
        hashedPassword,
        planner.business_name,
        planner.phone,
        planner.telegram_chat_id,
        planner.city,
        planner.type || role,
        role,
        status,
        planner.is_active ? 1 : 0
      ]);
    }
    console.log(`✅ Synced ${PLANNERS.length} planners into PostgreSQL successfully`);
  } catch (err) {
    console.error('Postgres planners seeding error:', err.message);
  }
}

async function seedPostgresPackages() {
  try {
    for (const pkg of DEFAULT_PACKAGES) {
      await pgPool.query(`
        INSERT INTO packages 
        (package_id, planner_id, package_name, description, price, original_price, discount_percent, photos,
         included_items, custom_addons, occasion_tags, supported_modes, setup_time, whatsapp_number, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (package_id) DO NOTHING
      `, [
        pkg.package_id,
        pkg.planner_id,
        pkg.package_name,
        pkg.description,
        pkg.price,
        pkg.original_price,
        pkg.discount_percent,
        pkg.photos,
        pkg.included_items,
        pkg.custom_addons,
        pkg.occasion_tags,
        pkg.supported_modes,
        pkg.setup_time,
        pkg.whatsapp_number,
        pkg.is_active
      ]);
    }
    console.log('✅ Synced default packages into PostgreSQL successfully');
  } catch (err) {
    console.error('Postgres packages seeding error:', err.message);
  }
}

module.exports = {
  db: sqliteDb,
  pgPool,
  dbHelpers,
  isPostgres
};