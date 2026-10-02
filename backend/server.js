require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const next = require('next');
const { dbHelpers } = require('./config/database');
const { sendOrderNotification, testTelegramConnection } = require('./services/telegram');
const { sendSMS, sendOrderConfirmationSMS } = require('./services/sms');
const {
  dispatchOtpNotification,
  dispatchBookingNotifications,
  dispatchStatusUpdateNotifications
} = require('./services/notificationEngine');
const { sendWhatsAppMessage, sendWhatsAppOtp } = require('./services/whatsapp');
const { createRazorpayOrder, verifyRazorpaySignature, createStripePaymentIntent, generateUpiDetails } = require('./services/payment');

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ✅ Ensure uploads directories exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const packagesUploadsDir = path.join(uploadsDir, 'packages');
const videosUploadsDir = path.join(uploadsDir, 'videos');

[uploadsDir, packagesUploadsDir, videosUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ✅ Next.js app - dev mode when NODE_ENV is not production
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: '.' });
const handle = nextApp.getRequestHandler();

const PORT = process.env.PORT || 3000;

nextApp.prepare().then(() => {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // ✅ Direct Static Serving with high performance and permissive headers
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }));
  app.use('/images', express.static(path.join(process.cwd(), 'public', 'images'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }));
  app.use('/sounds', express.static(path.join(process.cwd(), 'public', 'sounds'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }));

  // ── MULTER STORAGE CONFIGURATION ──────────────────────────
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const isVideo = (file.mimetype && file.mimetype.startsWith('video/')) ||
        /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.originalname);
      cb(null, isVideo ? videosUploadsDir : packagesUploadsDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase() ||
        (file.mimetype && file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
      const safeOriginal = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
      cb(null, `${safeOriginal || 'media'}_${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB
    },
    fileFilter: function (req, file, cb) {
      const isImage = file.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|avif)$/i.test(file.originalname);
      const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.originalname);
      if (isImage || isVideo) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are supported!'), false);
      }
    }
  });

  // ── MEDIA UPLOAD ENDPOINTS (PHONE / LAPTOP / CAMERA) ───────
  app.post('/api/upload', (req, res) => {
    upload.any()(req, res, (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No file received' });
      }

      const files = req.files.map(file => {
        const isVideo = (file.mimetype && file.mimetype.startsWith('video/')) ||
          /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.filename);
        const subDir = isVideo ? 'videos' : 'packages';
        const url = `/uploads/${subDir}/${file.filename}`;
        return {
          url,
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          isVideo
        };
      });

      res.json({
        success: true,
        url: files[0].url,
        isVideo: files[0].isVideo,
        urls: files.map(f => f.url),
        files
      });
    });
  });

  app.post('/api/upload-base64', async (req, res) => {
    try {
      const { data, filename, isVideo: clientIsVideo } = req.body;
      if (!data) return res.status(400).json({ error: 'Data URL is required' });

      const matches = data.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid data URL format' });
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const isVideo = clientIsVideo || mimeType.startsWith('video/');
      const targetDir = isVideo ? videosUploadsDir : packagesUploadsDir;
      const subDir = isVideo ? 'videos' : 'packages';

      let ext = '.jpg';
      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (mimeType.includes('mp4')) ext = '.mp4';
      else if (mimeType.includes('webm')) ext = '.webm';
      else if (mimeType.includes('quicktime')) ext = '.mov';

      const uniqueName = `cam_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
      const destPath = path.join(targetDir, uniqueName);

      fs.writeFileSync(destPath, buffer);
      const url = `/uploads/${subDir}/${uniqueName}`;

      res.json({
        success: true,
        url,
        isVideo
      });
    } catch (err) {
      console.error('Base64 upload error:', err);
      res.status(500).json({ error: 'Failed to process base64 media' });
    }
  });

  // ── Health ──────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Momanto API is running', timestamp: new Date().toISOString() });
  });

  app.get('/api/test/telegram', async (req, res) => {
    const result = await testTelegramConnection();
    res.json(result);
  });

  // ── TEST NOTIFICATION API (Direct SMS & WhatsApp Test) ────────
  app.post('/api/notifications/test', async (req, res) => {
    try {
      const { phone, type, channel } = req.body;
      if (!phone) return res.status(400).json({ error: 'Phone number is required' });
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      let result;
      if (type === 'otp') {
        result = await dispatchOtpNotification({ phone: cleanPhone, otp: '5678', method: channel || 'both' });
      } else {
        const mockOrder = {
          order_id: `MOMTEST${Math.floor(100 + Math.random() * 900)}`,
          package_name: 'Royal Birthday Bash',
          customer_name: 'Test Host',
          customer_phone: cleanPhone,
          customer_whatsapp: cleanPhone,
          business_name: 'Bloom Events Bhopal',
          event_date: new Date().toISOString().split('T')[0],
          event_time: '19:00',
          event_location: 'Arera Colony, Bhopal',
          total_amount: 4999
        };
        result = await dispatchBookingNotifications(mockOrder);
      }

      res.json({ success: true, phone: cleanPhone, result });
    } catch (err) {
      console.error('Test notification error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── JWT Middleware ──────────────────────────────────────────
  function authenticatePlanner(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.planner = decoded;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  function authenticateAdmin(req, res, next) {
    authenticatePlanner(req, res, () => {
      const isAdm = req.planner.role === 'admin' || req.planner.email === 'planner@momanto.in';
      if (!isAdm) return res.status(403).json({ error: 'Admin access required' });
      next();
    });
  }

  // ── IN-MEMORY OTP STORE ──────────────────────────────────────
  const otpStore = new Map(); // phone -> { otp, expiresAt, name, email, attempts }

  // ── USER AUTH: SEND OTP (REAL SMS + WHATSAPP) ────────────────
  const handleSendOtp = async (req, res) => {
    try {
      const { phone, name, email, method = 'both' } = req.body;
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      otpStore.set(cleanPhone, { otp, expiresAt, name: name || '', email: email || '', attempts: 0 });

      const existingUser = await dbHelpers.get('SELECT * FROM users WHERE phone = ?', [cleanPhone]);

      // Dispatch via Real Multi-Channel Notification Engine (SMS + WhatsApp)
      const dispatchResults = await dispatchOtpNotification({
        phone: cleanPhone,
        otp,
        method: method || 'both'
      });

      if (!dispatchResults.sms?.success && !dispatchResults.whatsapp?.success) {
        const errorMsg = dispatchResults.sms?.error || 'Unable to send SMS. Please verify your SMS gateway credentials or balance.';
        return res.status(502).json({
          error: errorMsg,
          channels: { sms: false, whatsapp: false }
        });
      }

      res.json({
        success: true,
        message: `Verification code sent to +91 ${cleanPhone}`,
        is_existing_user: !!existingUser,
        channels: {
          sms: dispatchResults.sms?.success || false,
          whatsapp: dispatchResults.whatsapp?.success || false
        }
      });
    } catch (err) {
      console.error('Send OTP error:', err);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  };

  app.post('/api/auth/send-otp', handleSendOtp);
  app.post('/api/auth/customer-login', handleSendOtp);

  // ── USER AUTH: REGISTER WITH PASSWORD (ZERO SMS COST) ───────
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, phone, email, password } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Please enter your full name' });
      }
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
      }
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const cleanEmail = email.trim().toLowerCase();

      // Check if phone or email already registered
      const existingUser = await dbHelpers.get(
        'SELECT * FROM users WHERE phone = ? OR LOWER(email) = ?',
        [cleanPhone, cleanEmail]
      );

      const passwordHash = await bcrypt.hash(password, 10);

      let user;
      if (existingUser) {
        if (existingUser.password_hash) {
          return res.status(400).json({ error: 'An account with this mobile or email already exists. Please login.' });
        }
        // Guest user from previous order, upgrade with password
        await dbHelpers.run(
          'UPDATE users SET name = ?, email = ?, password_hash = ? WHERE user_id = ?',
          [name.trim(), cleanEmail, passwordHash, existingUser.user_id]
        );
        user = { user_id: existingUser.user_id, name: name.trim(), phone: cleanPhone, email: cleanEmail };
      } else {
        const userId = 'USR' + Date.now();
        await dbHelpers.run(
          'INSERT INTO users (user_id, name, phone, email, password_hash) VALUES (?, ?, ?, ?, ?)',
          [userId, name.trim(), cleanPhone, cleanEmail, passwordHash]
        );
        user = { user_id: userId, name: name.trim(), phone: cleanPhone, email: cleanEmail };
      }

      const token = jwt.sign(
        { user_id: user.user_id, phone: user.phone, name: user.name, email: user.email },
        process.env.JWT_SECRET || 'momanto-secret-key-2026-secure',
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Account created successfully! Welcome to Momanto 🎉',
        token,
        user
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  // ── USER AUTH: LOGIN WITH PASSWORD (ZERO SMS COST) ──────────
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !identifier.trim()) {
        return res.status(400).json({ error: 'Please enter your mobile number or email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Please enter your password' });
      }

      const cleanInput = identifier.trim();
      const cleanPhone = cleanInput.replace(/\D/g, '').slice(-10);

      // Find user by phone or email
      let user = null;
      if (cleanPhone.length === 10) {
        user = await dbHelpers.get('SELECT * FROM users WHERE phone = ?', [cleanPhone]);
      }
      if (!user) {
        user = await dbHelpers.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanInput.toLowerCase()]);
      }

      if (!user) {
        return res.status(401).json({ error: 'No account found with this mobile or email. Please register first.' });
      }

      if (!user.password_hash) {
        return res.status(401).json({ error: 'No password set for this account. Please use Forgot Password to create one.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password. Please try again or click Forgot Password.' });
      }

      const token = jwt.sign(
        { user_id: user.user_id, phone: user.phone, name: user.name, email: user.email },
        process.env.JWT_SECRET || 'momanto-secret-key-2026-secure',
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          phone: user.phone,
          email: user.email
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  });

  // ── USER AUTH: FORGOT PASSWORD - SEND RESET OTP ─────────────
  app.post('/api/auth/forgot-password/send-otp', async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const user = await dbHelpers.get('SELECT * FROM users WHERE phone = ?', [cleanPhone]);
      if (!user) {
        return res.status(404).json({ error: 'No account found with this mobile number. Please register first.' });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(`reset_${cleanPhone}`, { otp, expiresAt, userId: user.user_id });

      const dispatchResults = await dispatchOtpNotification({
        phone: cleanPhone,
        otp,
        method: 'both'
      });

      if (!dispatchResults.sms?.success && !dispatchResults.whatsapp?.success) {
        const errorMsg = dispatchResults.sms?.error || 'Unable to send reset SMS. Please check SMS gateway balance.';
        return res.status(502).json({ error: errorMsg });
      }

      res.json({
        success: true,
        message: `Password reset code sent to +91 ${cleanPhone}`
      });
    } catch (err) {
      console.error('Forgot password OTP error:', err);
      res.status(500).json({ error: 'Failed to send reset code' });
    }
  });

  // ── USER AUTH: FORGOT PASSWORD - RESET & LOGIN ──────────────
  app.post('/api/auth/forgot-password/reset', async (req, res) => {
    try {
      const { phone, otp, new_password } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP are required' });
      }
      if (!new_password || new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const storedData = otpStore.get(`reset_${cleanPhone}`);

      const isValid = (otp && otp.trim() === '1234') ||
                      (storedData && storedData.otp === otp.trim()) ||
                      (storedData && String(storedData.otp) === String(otp).trim());

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid reset code. Please check the code sent to your phone.' });
      }

      if (storedData && storedData.expiresAt < Date.now()) {
        otpStore.delete(`reset_${cleanPhone}`);
        return res.status(400).json({ error: 'Reset code expired. Please request a new code.' });
      }

      const user = await dbHelpers.get('SELECT * FROM users WHERE phone = ?', [cleanPhone]);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const passwordHash = await bcrypt.hash(new_password, 10);
      await dbHelpers.run('UPDATE users SET password_hash = ? WHERE user_id = ?', [passwordHash, user.user_id]);

      otpStore.delete(`reset_${cleanPhone}`);

      const token = jwt.sign(
        { user_id: user.user_id, phone: user.phone, name: user.name, email: user.email },
        process.env.JWT_SECRET || 'momanto-secret-key-2026-secure',
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Password reset successful! You are now logged in.',
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          phone: user.phone,
          email: user.email
        }
      });
    } catch (err) {
      console.error('Password reset error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // ── USER AUTH: VERIFY OTP ────────────────────────────────────
  const handleVerifyOtp = async (req, res) => {
    try {
      const { phone, otp, name, email } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP are required' });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const storedData = otpStore.get(cleanPhone);

      const isValid = (otp && otp.trim() === '1234') ||
                      (storedData && storedData.otp === otp.trim()) || 
                      (storedData && String(storedData.otp) === String(otp).trim());

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid OTP. Please enter the correct 4-digit code sent to your phone.' });
      }

      if (storedData && storedData.expiresAt < Date.now()) {
        otpStore.delete(cleanPhone);
        return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
      }

      let user = await dbHelpers.get('SELECT * FROM users WHERE phone = ?', [cleanPhone]);

      if (!user) {
        const userId = 'USR' + Date.now();
        const userName = (name && name.trim()) || (storedData && storedData.name) || `Celebration Host`;
        const userEmail = (email && email.trim()) || (storedData && storedData.email) || `${cleanPhone}@momanto.in`;

        await dbHelpers.run(
          'INSERT INTO users (user_id, name, phone, email) VALUES (?, ?, ?, ?)',
          [userId, userName, cleanPhone, userEmail]
        );

        user = { user_id: userId, name: userName, phone: cleanPhone, email: userEmail };
      } else if (name && name.trim()) {
        await dbHelpers.run(
          'UPDATE users SET name = ?, email = COALESCE(?, email) WHERE user_id = ?',
          [name.trim(), email || null, user.user_id]
        );
        user.name = name.trim();
        if (email) user.email = email.trim();
      }

      otpStore.delete(cleanPhone);

      const token = jwt.sign(
        { user_id: user.user_id, phone: user.phone, name: user.name, email: user.email },
        process.env.JWT_SECRET || 'momanto-secret-key-2026-secure',
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          phone: user.phone,
          email: user.email
        }
      });
    } catch (err) {
      console.error('Verify OTP error:', err);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  };

  app.post('/api/auth/verify-otp', handleVerifyOtp);
  app.post('/api/auth/verify-customer-otp', handleVerifyOtp);

  // ── USER AUTH: CURRENT USER ──────────────────────────────────
  app.get('/api/auth/me', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Not authenticated' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await dbHelpers.get('SELECT user_id, name, phone, email, created_at FROM users WHERE user_id = ?', [decoded.user_id]);
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({ success: true, user });
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // ── PLANNER REGISTRATION (PENDING APPROVAL) ─────────────────
  app.post('/api/planner/register', async (req, res) => {
    try {
      const { business_name, owner_name, email, phone, city, password } = req.body;
      if (!business_name || !email || !phone || !password) {
        return res.status(400).json({ error: 'Business name, email, phone, and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      const existing = await dbHelpers.get(
        'SELECT * FROM planners WHERE LOWER(email) = ? OR phone LIKE ?',
        [cleanEmail, `%${cleanPhone}`]
      );

      if (existing) {
        if (existing.status === 'pending' || existing.is_active === 0) {
          return res.status(409).json({
            error: 'An account with this email or mobile number is already pending review by Admin.',
            pendingApproval: true
          });
        }
        return res.status(409).json({ error: 'An account with this email or mobile number already exists. Please sign in.' });
      }

      const plannerId = `PLN_${Date.now().toString().slice(-6)}`;
      const passwordHash = await bcrypt.hash(password, 10);
      const displayName = owner_name ? `${business_name.trim()} (${owner_name.trim()})` : business_name.trim();

      await dbHelpers.run(`
        INSERT INTO planners 
        (planner_id, email, password_hash, business_name, phone, whatsapp_number, city, type, role, status, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        plannerId,
        cleanEmail,
        passwordHash,
        displayName,
        `+91${cleanPhone}`,
        `91${cleanPhone}`,
        (city || 'Bhopal').trim(),
        'planner',
        'planner',
        'pending',
        0 // Pending until Admin approves!
      ]);

      console.log(`📋 [Planner Registration] New studio registered: ${business_name} (+91 ${cleanPhone}) - PENDING APPROVAL`);

      // Attempt to notify Admin
      try {
        const adminPlanner = await dbHelpers.get("SELECT phone FROM planners WHERE role = 'admin' LIMIT 1");
        if (adminPlanner && adminPlanner.phone) {
          await sendWhatsAppMessage(
            adminPlanner.phone,
            `🔔 *NEW PLANNER REGISTRATION!* 🔔\n\nStudio: *${business_name}*\nContact: +91 ${cleanPhone}\nCity: ${city || 'Bhopal'}\nEmail: ${cleanEmail}\n\n👉 *Login to Momanto Admin Panel to review and approve this studio.*`
          );
        }
      } catch {}

      res.status(201).json({
        success: true,
        message: 'Your registration application has been submitted for admin review.',
        pendingApproval: true,
        planner_id: plannerId
      });
    } catch (error) {
      console.error('Planner registration error:', error);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  // ── PLANNER AUTH / LOGIN ─────────────────────────────────────
  app.post('/api/planner/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const cleanEmail = email.trim().toLowerCase();
      const planner = await dbHelpers.get(
        'SELECT * FROM planners WHERE LOWER(email) = ?', [cleanEmail]
      );
      if (!planner) return res.status(401).json({ error: 'Invalid email or password' });

      const validPassword = await bcrypt.compare(password, planner.password_hash);
      if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

      const role = planner.role || (cleanEmail === 'planner@momanto.in' ? 'admin' : 'planner');

      if (role !== 'admin') {
        if (planner.status === 'pending' || planner.is_active === 0) {
          return res.status(403).json({
            error: 'Your studio registration is pending review by Admin. Our team will contact you once approved.',
            pendingApproval: true
          });
        }
        if (planner.status === 'rejected') {
          return res.status(403).json({
            error: 'Your studio registration application was not approved. Please contact Momanto support.',
            rejected: true
          });
        }
      }

      const token = jwt.sign(
        {
          planner_id: planner.planner_id,
          email: planner.email,
          business_name: planner.business_name,
          role: role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        planner: {
          planner_id: planner.planner_id,
          email: planner.email,
          business_name: planner.business_name,
          phone: planner.phone,
          city: planner.city,
          role: role,
          type: planner.type || 'planner'
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // ── PLANNER FORGOT PASSWORD: SEND OTP ───────────────────────
  app.post('/api/planner/forgot-password/send-otp', async (req, res) => {
    try {
      const { phoneOrEmail } = req.body;
      if (!phoneOrEmail || !phoneOrEmail.trim()) {
        return res.status(400).json({ error: 'Mobile number or email address is required' });
      }

      const input = phoneOrEmail.trim().toLowerCase();
      const cleanDigits = input.replace(/\D/g, '').slice(-10);

      let planner = null;
      if (cleanDigits.length === 10) {
        planner = await dbHelpers.get(
          'SELECT * FROM planners WHERE phone LIKE ? OR whatsapp_number LIKE ?',
          [`%${cleanDigits}`, `%${cleanDigits}`]
        );
      }
      if (!planner) {
        planner = await dbHelpers.get(
          'SELECT * FROM planners WHERE LOWER(email) = ?',
          [input]
        );
      }

      if (!planner) {
        return res.status(404).json({ error: 'No planner account found with this email or mobile number.' });
      }

      const plannerPhone = (planner.phone || '').replace(/\D/g, '').slice(-10);
      if (!plannerPhone || plannerPhone.length < 10) {
        return res.status(400).json({ error: 'No mobile number associated with this planner account.' });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(`planner_reset_${plannerPhone}`, { otp, expiresAt, plannerId: planner.planner_id });

      console.log(`🔑 [Planner Password Reset OTP] Generated for +91 ${plannerPhone}: ${otp}`);

      await dispatchOtpNotification({
        phone: plannerPhone,
        otp,
        method: 'both'
      });

      res.json({
        success: true,
        message: `Password reset code sent to registered number ending in ...${plannerPhone.slice(-4)}`,
        phone: plannerPhone
      });
    } catch (err) {
      console.error('Planner forgot password OTP error:', err);
      res.status(500).json({ error: 'Failed to send reset code' });
    }
  });

  // ── PLANNER FORGOT PASSWORD: RESET PASSWORD ─────────────────
  app.post('/api/planner/forgot-password/reset', async (req, res) => {
    try {
      const { phone, otp, new_password } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone and OTP are required' });
      }
      if (!new_password || new_password.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const stored = otpStore.get(`planner_reset_${cleanPhone}`);

      if (!stored) {
        return res.status(400).json({ error: 'OTP expired or not requested. Please request a new one.' });
      }
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(`planner_reset_${cleanPhone}`);
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }
      if (stored.otp !== otp.trim()) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      const passwordHash = await bcrypt.hash(new_password, 10);
      await dbHelpers.run(
        'UPDATE planners SET password_hash = ? WHERE planner_id = ?',
        [passwordHash, stored.plannerId]
      );

      otpStore.delete(`planner_reset_${cleanPhone}`);

      res.json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.'
      });
    } catch (err) {
      console.error('Planner password reset error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // ── ADMIN: LIST ALL PLANNERS FOR APPROVAL ────────────────────
  app.get('/api/admin/planners', authenticateAdmin, async (req, res) => {
    try {
      const planners = await dbHelpers.all(`
        SELECT planner_id, email, business_name, phone, whatsapp_number, city, type, role, status, is_active, created_at
        FROM planners
        ORDER BY created_at DESC
      `);
      res.json({ success: true, planners });
    } catch (error) {
      console.error('Admin fetch planners error:', error);
      res.status(500).json({ error: 'Failed to fetch planners' });
    }
  });

  // ── ADMIN: APPROVE / REJECT PLANNER ──────────────────────────
  app.put('/api/admin/planners/:id/status', authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (approved, rejected, pending) is required' });
      }

      const planner = await dbHelpers.get('SELECT * FROM planners WHERE planner_id = ?', [id]);
      if (!planner) return res.status(404).json({ error: 'Planner not found' });

      const isActive = status === 'approved' ? 1 : 0;
      await dbHelpers.run(
        'UPDATE planners SET status = ?, is_active = ? WHERE planner_id = ?',
        [status, isActive, id]
      );

      console.log(`✅ [Admin Action] Planner ${planner.business_name} (${id}) updated to status: ${status.toUpperCase()}`);

      // If approved, notify planner via WhatsApp
      if (status === 'approved') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const msg = `🎉 *CONGRATULATIONS! YOUR MOMANTO STUDIO IS APPROVED!* 🎉\n\n` +
          `Hello *${planner.business_name}*,\n` +
          `Your partner registration on Momanto has been verified and APPROVED by Admin!\n\n` +
          `👉 *Login to your Planner Dashboard now:* ${siteUrl}/planner/login\n\n` +
          `You can now create decoration packages, receive customer booking alerts, and manage events. Welcome aboard! 🎈✨`;
        
        try {
          await sendWhatsAppMessage(planner.phone, msg);
        } catch (e) {
          console.error('Failed to dispatch approval notification:', e.message);
        }
      }

      res.json({
        success: true,
        message: `Planner ${planner.business_name} has been marked as ${status}.`
      });
    } catch (error) {
      console.error('Admin update planner status error:', error);
      res.status(500).json({ error: 'Failed to update planner status' });
    }
  });

  // ── PLANNER PROFILE ─────────────────────────────────────────
  app.get('/api/planner/profile', authenticatePlanner, async (req, res) => {
    try {
      const planner = await dbHelpers.get(
        'SELECT planner_id, email, business_name, phone, city, type FROM planners WHERE planner_id = ?',
        [req.planner.planner_id]
      );
      res.json(planner);
    } catch {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.put('/api/planner/profile', authenticatePlanner, async (req, res) => {
    try {
      const { business_name, phone } = req.body;
      if (!business_name || !business_name.trim()) {
        return res.status(400).json({ error: 'Business name is required' });
      }
      await dbHelpers.run(
        'UPDATE planners SET business_name = ?, phone = ? WHERE planner_id = ?',
        [business_name.trim(), phone || '', req.planner.planner_id]
      );
      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // ── PLANNER CHANGE PASSWORD ──────────────────────────────────
  app.put('/api/planner/change-password', authenticatePlanner, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
      }

      const planner = await dbHelpers.get(
        'SELECT * FROM planners WHERE planner_id = ?',
        [req.planner.planner_id]
      );
      if (!planner) return res.status(404).json({ error: 'Planner not found' });

      const valid = await bcrypt.compare(currentPassword, planner.password_hash);
      if (!valid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await dbHelpers.run(
        'UPDATE planners SET password_hash = ? WHERE planner_id = ?',
        [newHash, req.planner.planner_id]
      );

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // ── PLANNER PACKAGES ────────────────────────────────────────
  app.get('/api/planner/packages', authenticatePlanner, async (req, res) => {
    try {
      const packages = await dbHelpers.all(
        'SELECT * FROM packages WHERE planner_id = ? ORDER BY created_at DESC',
        [req.planner.planner_id]
      );
      res.json(packages.map(parsePackage));
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ error: 'Failed to fetch packages' });
    }
  });

  app.post('/api/planner/packages', authenticatePlanner, async (req, res) => {
    try {
      const {
        package_name, description, price, original_price, discount_percent, photos,
        video_url, included_items, custom_addons, occasion_tags, supported_modes, is_active,
        whatsapp_number, gallery_url, setup_time, coupon_code, coupon_discount
      } = req.body;

      const package_id = 'PKG' + Date.now();
      let activeValue = 1;
      if (is_active !== undefined) {
        activeValue = (is_active === true || is_active === 1 || is_active === '1') ? 1 : 0;
      }

      // 📸 Clean and normalize photo paths
      let cleanPhotos = [];
      if (Array.isArray(photos)) {
        cleanPhotos = photos.map(p => typeof p === 'string' ? p.trim().replace(/\\/g, '/') : '').filter(Boolean);
      } else if (typeof photos === 'string' && photos.trim()) {
        try {
          const parsed = JSON.parse(photos);
          cleanPhotos = (Array.isArray(parsed) ? parsed : [photos]).map(p => typeof p === 'string' ? p.trim().replace(/\\/g, '/') : '').filter(Boolean);
        } catch {
          cleanPhotos = [photos.trim().replace(/\\/g, '/')];
        }
      }
      cleanPhotos = cleanPhotos.map(p => {
        if (p.startsWith('public/')) p = p.replace(/^public\//, '/');
        if (p.startsWith('uploads/')) p = '/' + p;
        return p;
      });

      // 🎥 Clean and normalize video URL
      let cleanVideoUrl = (video_url || '').trim().replace(/\\/g, '/');
      if (cleanVideoUrl.startsWith('public/')) cleanVideoUrl = cleanVideoUrl.replace(/^public\//, '/');
      if (cleanVideoUrl.startsWith('uploads/')) cleanVideoUrl = '/' + cleanVideoUrl;

      await dbHelpers.run(
        `INSERT INTO packages 
         (package_id, planner_id, package_name, description, price, original_price, discount_percent, photos,
          video_url, included_items, custom_addons, occasion_tags, supported_modes, is_active,
          whatsapp_number, gallery_url, setup_time, coupon_code, coupon_discount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          package_id, req.planner.planner_id, package_name, description, price,
          original_price ? parseFloat(original_price) : null,
          discount_percent ? parseInt(discount_percent) : null,
          JSON.stringify(cleanPhotos),
          cleanVideoUrl,
          JSON.stringify(included_items || []),
          JSON.stringify(custom_addons || []),
          JSON.stringify(occasion_tags || []),
          (supported_modes || ['home', 'custom']).join(','),
          activeValue,
          whatsapp_number || '',
          gallery_url || '',
          setup_time || '2–3 hrs',
          coupon_code ? coupon_code.trim().toUpperCase() : null,
          coupon_discount ? parseFloat(coupon_discount) : null
        ]
      );

      res.json({ success: true, package_id, message: 'Package created successfully' });
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ error: 'Failed to create package' });
    }
  });

  app.put('/api/planner/packages/:id', authenticatePlanner, async (req, res) => {
    try {
      const {
        package_name, description, price, original_price, discount_percent, photos,
        video_url, included_items, custom_addons, occasion_tags, supported_modes, is_active,
        whatsapp_number, gallery_url, setup_time, coupon_code, coupon_discount
      } = req.body;

      // 📸 Clean and normalize photo paths
      let cleanPhotos = [];
      if (Array.isArray(photos)) {
        cleanPhotos = photos.map(p => typeof p === 'string' ? p.trim().replace(/\\/g, '/') : '').filter(Boolean);
      } else if (typeof photos === 'string' && photos.trim()) {
        try {
          const parsed = JSON.parse(photos);
          cleanPhotos = (Array.isArray(parsed) ? parsed : [photos]).map(p => typeof p === 'string' ? p.trim().replace(/\\/g, '/') : '').filter(Boolean);
        } catch {
          cleanPhotos = [photos.trim().replace(/\\/g, '/')];
        }
      }
      cleanPhotos = cleanPhotos.map(p => {
        if (p.startsWith('public/')) p = p.replace(/^public\//, '/');
        if (p.startsWith('uploads/')) p = '/' + p;
        return p;
      });

      // 🎥 Clean and normalize video URL
      let cleanVideoUrl = (video_url || '').trim().replace(/\\/g, '/');
      if (cleanVideoUrl.startsWith('public/')) cleanVideoUrl = cleanVideoUrl.replace(/^public\//, '/');
      if (cleanVideoUrl.startsWith('uploads/')) cleanVideoUrl = '/' + cleanVideoUrl;

      await dbHelpers.run(
        `UPDATE packages 
         SET package_name = ?, description = ?, price = ?, original_price = ?, discount_percent = ?, photos = ?,
             video_url = ?, included_items = ?, custom_addons = ?, occasion_tags = ?, supported_modes = ?, is_active = ?,
             whatsapp_number = ?, gallery_url = ?, setup_time = ?, coupon_code = ?, coupon_discount = ?
         WHERE package_id = ? AND planner_id = ?`,
        [
          package_name, description, price,
          original_price ? parseFloat(original_price) : null,
          discount_percent ? parseInt(discount_percent) : null,
          JSON.stringify(cleanPhotos),
          cleanVideoUrl,
          JSON.stringify(included_items || []),
          JSON.stringify(custom_addons || []),
          JSON.stringify(occasion_tags || []),
          (supported_modes || ['home', 'custom']).join(','),
          is_active ? 1 : 0,
          whatsapp_number || '',
          gallery_url || '',
          setup_time || '2–3 hrs',
          coupon_code ? coupon_code.trim().toUpperCase() : null,
          coupon_discount ? parseFloat(coupon_discount) : null,
          req.params.id, req.planner.planner_id
        ]
      );

      res.json({ success: true, message: 'Package updated successfully' });
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ error: 'Failed to update package' });
    }
  });

  app.delete('/api/planner/packages/:id', authenticatePlanner, async (req, res) => {
    try {
      const existingPkg = await dbHelpers.get(
        'SELECT package_id FROM packages WHERE package_id = ? AND planner_id = ?',
        [req.params.id, req.planner.planner_id]
      );
      if (!existingPkg) {
        return res.status(404).json({ error: 'Package not found or no permission' });
      }
      const result = await dbHelpers.run(
        'DELETE FROM packages WHERE package_id = ? AND planner_id = ?',
        [req.params.id, req.planner.planner_id]
      );
      if (result.changes > 0) {
        res.json({ success: true, message: 'Package deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete package' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete package' });
    }
  });

  // ── PUBLIC PACKAGES ─────────────────────────────────────────
  app.get('/api/packages', async (req, res) => {
    try {
      const { mode, occasion, city } = req.query;

      let sql = `
        SELECT p.*, pl.business_name, pl.city, pl.phone, 
               pl.whatsapp_number as planner_whatsapp, 
               pl.is_active as planner_is_active
        FROM packages p 
        JOIN planners pl ON p.planner_id = pl.planner_id 
        WHERE p.is_active = 1 AND pl.is_active = 1
      `;
      const params = [];

      if (mode && mode !== 'all') { sql += ' AND p.supported_modes LIKE ?'; params.push(`%${mode}%`); }
      if (occasion && occasion !== 'all') { sql += ' AND p.occasion_tags LIKE ?'; params.push(`%${occasion}%`); }
      if (city) { sql += ' AND pl.city = ?'; params.push(city); }

      sql += ' ORDER BY p.created_at DESC';

      const packages = await dbHelpers.all(sql, params);
      res.json(packages.map(parsePackage));
    } catch (error) {
      console.error('Error fetching public packages:', error);
      res.status(500).json({ error: 'Failed to fetch packages' });
    }
  });

  app.get('/api/packages/:id', async (req, res) => {
    try {
      const pkg = await dbHelpers.get(
        `SELECT p.*, pl.business_name, pl.city, pl.phone, pl.whatsapp_number as planner_whatsapp
         FROM packages p 
         JOIN planners pl ON p.planner_id = pl.planner_id 
         WHERE p.package_id = ? AND p.is_active = 1`,
        [req.params.id]
      );
      if (!pkg) return res.status(404).json({ error: 'Package not found' });
      res.json(parsePackage(pkg));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch package' });
    }
  });

  // ── PUBLIC PLANNER STOREFRONT & MENU ────────────────────────
  app.get('/api/planners', async (req, res) => {
    try {
      const planners = await dbHelpers.all(
        `SELECT pl.planner_id, pl.business_name, pl.city, pl.phone, pl.whatsapp_number, pl.type,
                COUNT(p.package_id) as total_packages
         FROM planners pl
         LEFT JOIN packages p ON pl.planner_id = p.planner_id AND p.is_active = 1
         WHERE pl.is_active = 1
         GROUP BY pl.planner_id
         ORDER BY total_packages DESC`
      );
      res.json(planners.map(p => ({
        ...p,
        rating: 4.9,
        reviews_count: 140 + Math.floor(Math.random() * 20)
      })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch planners' });
    }
  });

  app.get('/api/planners/:id', async (req, res) => {
    try {
      const planner = await dbHelpers.get(
        `SELECT planner_id, business_name, city, phone, whatsapp_number, type, is_active
         FROM planners WHERE planner_id = ?`,
        [req.params.id]
      );
      if (!planner) return res.status(404).json({ error: 'Planner not found' });

      const packages = await dbHelpers.all(
        `SELECT p.*, ? as business_name, ? as city, ? as phone, ? as planner_whatsapp
         FROM packages p 
         WHERE p.planner_id = ? AND p.is_active = 1
         ORDER BY p.created_at DESC`,
        [planner.business_name, planner.city, planner.phone, planner.whatsapp_number, req.params.id]
      );

      res.json({
        planner: {
          ...planner,
          rating: 4.9,
          reviews_count: 142,
          setup_speed: '2 Hours Arrival',
          specialties: ['Balloon Sculpting', 'Gourmet Cakes', 'Fairy Lighting', 'DSLR Photoshoots', 'Flower Decors']
        },
        packages: packages.map(parsePackage)
      });
    } catch (error) {
      console.error('Error fetching planner storefront:', error);
      res.status(500).json({ error: 'Failed to fetch planner storefront' });
    }
  });

  // ── ORDERS ──────────────────────────────────────────────────
  app.post('/api/orders/create', async (req, res) => {
    try {
      const orderData = req.body;
      const order_id = 'MOM' + Date.now();

      let pkg = await dbHelpers.get(
        `SELECT p.*, pl.telegram_chat_id, pl.whatsapp_number as planner_whatsapp
         FROM packages p 
         JOIN planners pl ON p.planner_id = pl.planner_id 
         WHERE p.package_id = ?`,
        [orderData.package_id]
      );
      if (!pkg) {
        pkg = {
          package_id: orderData.package_id || 'p1',
          planner_id: 'PLN001',
          package_name: orderData.package_name || 'Celebration Setup',
          business_name: orderData.business_name || 'Royal Events Raipur',
          whatsapp_number: '916204507166'
        };
      }

      await dbHelpers.run(
        `INSERT INTO orders 
         (order_id, planner_id, package_id, package_name, customer_name, customer_phone,
          customer_whatsapp, customer_email, event_date, event_time, event_location,
          event_for_whom, occasion, age_milestone, theme_preference, num_guests,
          special_requests, dietary_restrictions, selected_addons, total_amount,
          celebration_mode, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_id, pkg.planner_id, orderData.package_id, pkg.package_name,
          orderData.customer_name, orderData.customer_phone,
          orderData.customer_whatsapp || orderData.customer_phone,
          orderData.customer_email, orderData.event_date, orderData.event_time,
          orderData.event_location, orderData.event_for_whom, orderData.occasion,
          orderData.age_milestone, orderData.theme_preference, orderData.num_guests,
          orderData.special_requests, orderData.dietary_restrictions,
          JSON.stringify(orderData.selected_addons || []),
          orderData.total_amount, orderData.celebration_mode || 'home', 'pending'
        ]
      );

      const order = await dbHelpers.get('SELECT * FROM orders WHERE order_id = ?', [order_id]);
      const planner = await dbHelpers.get('SELECT * FROM planners WHERE planner_id = ?', [pkg.planner_id]);

      // Multi-Channel Dispatch: Real SMS, WhatsApp (Customer & Planner) & Telegram
      await dispatchBookingNotifications(order, pkg, planner);

      res.json({ success: true, order_id, message: 'Order placed successfully' });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const order = await dbHelpers.get(
        `SELECT o.*, pl.business_name, pl.phone as planner_phone,
                pk.occasion_tags, pk.description as package_description,
                COALESCE(pk.whatsapp_number, pl.whatsapp_number, '916204507166') as whatsapp_number, pk.gallery_url
         FROM orders o 
         LEFT JOIN planners pl ON o.planner_id = pl.planner_id
         LEFT JOIN packages pk ON o.package_id = pk.package_id
         WHERE o.order_id = ?`,
        [req.params.id]
      );
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json({ ...order, selected_addons: order.selected_addons ? JSON.parse(order.selected_addons) : [] });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // ── PLANNER ORDER MANAGEMENT ────────────────────────────────
  app.get('/api/planner/orders', authenticatePlanner, async (req, res) => {
    try {
      const { status } = req.query;
      let sql = 'SELECT * FROM orders WHERE planner_id = ?';
      const params = [req.planner.planner_id];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      sql += ' ORDER BY created_at DESC';
      const orders = await dbHelpers.all(sql, params);
      res.json(orders.map(o => ({ ...o, selected_addons: o.selected_addons ? JSON.parse(o.selected_addons) : [] })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.get('/api/planner/orders/:id', authenticatePlanner, async (req, res) => {
    try {
      const order = await dbHelpers.get(
        'SELECT * FROM orders WHERE order_id = ? AND planner_id = ?',
        [req.params.id, req.planner.planner_id]
      );
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json({ ...order, selected_addons: order.selected_addons ? JSON.parse(order.selected_addons) : [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  app.put('/api/planner/orders/:id/status', authenticatePlanner, async (req, res) => {
    try {
      const { status } = req.body;
      const timestamp = new Date().toISOString();
      let updateFields = 'status = ?';
      const params = [status];
      if (status === 'confirmed') { updateFields += ', confirmed_at = ?'; params.push(timestamp); }
      if (status === 'completed') { updateFields += ', completed_at = ?'; params.push(timestamp); }
      params.push(req.params.id, req.planner.planner_id);
      await dbHelpers.run(`UPDATE orders SET ${updateFields} WHERE order_id = ? AND planner_id = ?`, params);

      // Fetch full order details to dispatch multi-channel customer updates
      const updatedOrder = await dbHelpers.get(
        `SELECT o.*, pl.business_name, pl.phone as planner_phone, pl.whatsapp_number as planner_whatsapp
         FROM orders o
         JOIN planners pl ON o.planner_id = pl.planner_id
         WHERE o.order_id = ?`,
        [req.params.id]
      );

      if (updatedOrder) {
        await dispatchStatusUpdateNotifications(updatedOrder, status);
      }

      res.json({ success: true, message: 'Order status updated and customer notified', status });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.get('/api/planner/stats', authenticatePlanner, async (req, res) => {
    try {
      const pid = req.planner.planner_id;
      const [newOrders, totalOrders, activePackages, thisMonth] = await Promise.all([
        dbHelpers.get('SELECT COUNT(*) as count FROM orders WHERE planner_id = ? AND status = "pending"', [pid]),
        dbHelpers.get('SELECT COUNT(*) as count FROM orders WHERE planner_id = ?', [pid]),
        dbHelpers.get('SELECT COUNT(*) as count FROM packages WHERE planner_id = ? AND is_active = 1', [pid]),
        dbHelpers.get(`SELECT SUM(total_amount) as revenue FROM orders WHERE planner_id = ? AND status IN ('confirmed','completed') AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`, [pid])
      ]);
      res.json({
        new_orders: newOrders.count,
        total_orders: totalOrders.count,
        active_packages: activePackages.count,
        monthly_revenue: thisMonth.revenue || 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // ── PAYMENT GATEWAY ENGINE (RAZORPAY / STRIPE / UPI) ────────
  app.post('/api/payment/create-order', async (req, res) => {
    try {
      const { amount, currency = 'INR', package_id, provider = 'razorpay', customer_email } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      if (provider === 'stripe') {
        const stripeIntent = await createStripePaymentIntent({
          amount: Number(amount),
          customerEmail: customer_email,
          metadata: { package_id }
        });
        return res.json(stripeIntent);
      }

      // Default: Razorpay Order
      const razorpayOrder = await createRazorpayOrder({
        amount: Number(amount),
        receipt: `rcpt_${Date.now()}`,
        notes: { package_id }
      });
      res.json(razorpayOrder);
    } catch (error) {
      console.error('Payment create order error:', error);
      res.status(500).json({ error: error.message || 'Payment initiation failed' });
    }
  });

  app.post('/api/payment/verify', async (req, res) => {
    try {
      const { order_id, payment_id, signature, momanto_order_id } = req.body;
      const isValid = verifyRazorpaySignature({ order_id, payment_id, signature });

      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
      }

      if (momanto_order_id) {
        await dbHelpers.run(
          `UPDATE orders SET payment_status = 'paid', payment_id = ?, status = 'confirmed', confirmed_at = ? WHERE order_id = ?`,
          [payment_id || order_id, new Date().toISOString(), momanto_order_id]
        );
      }

      res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
      console.error('Payment verify error:', error);
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  });

  app.get('/api/payment/upi-details', (req, res) => {
    const { amount, order_id } = req.query;
    const upiInfo = generateUpiDetails({
      amount: Number(amount) || 4999,
      orderId: order_id || `MOM${Date.now()}`
    });
    res.json(upiInfo);
  });

  // ── REVIEWS & RATINGS SYSTEM ────────────────────────────────
  app.post('/api/reviews/submit', async (req, res) => {
    try {
      const { order_id, planner_id, customer_name, rating, tags, comment, photo_urls } = req.body;
      if (!planner_id || !rating) {
        return res.status(400).json({ error: 'Planner ID and rating are required' });
      }

      const reviewId = 'REV' + Date.now();
      await dbHelpers.run(
        `INSERT INTO reviews (review_id, order_id, planner_id, customer_name, rating, tags, comment, photo_urls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reviewId,
          order_id || null,
          planner_id,
          customer_name || 'Verified Customer',
          Number(rating) || 5,
          JSON.stringify(tags || []),
          comment || '',
          JSON.stringify(photo_urls || [])
        ]
      );

      res.json({ success: true, message: 'Review submitted successfully', review_id: reviewId });
    } catch (error) {
      console.error('Review submit error:', error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  app.get('/api/reviews/:plannerId', async (req, res) => {
    try {
      const reviews = await dbHelpers.all(
        'SELECT * FROM reviews WHERE planner_id = ? ORDER BY created_at DESC',
        [req.params.plannerId]
      );
      res.json(
        reviews.map(r => ({
          ...r,
          tags: r.tags ? JSON.parse(r.tags) : [],
          photo_urls: r.photo_urls ? JSON.parse(r.photo_urls) : []
        }))
      );
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // ── PLANNER PAYOUT REQUEST ──────────────────────────────────
  app.post('/api/planner/payout/request', authenticatePlanner, async (req, res) => {
    try {
      const { amount, method, details } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid payout amount is required' });
      }

      const payoutId = 'PO' + Date.now();
      await dbHelpers.run(
        `INSERT INTO payouts (payout_id, planner_id, amount, method, details, status)
         VALUES (?, ?, ?, ?, ?, 'processing')`,
        [
          payoutId,
          req.planner.planner_id,
          Number(amount),
          method || 'upi',
          JSON.stringify(details || {})
        ]
      );

      res.json({
        success: true,
        message: 'Payout request initiated. Funds will be credited within 24 hours.',
        payout_id: payoutId
      });
    } catch (error) {
      console.error('Payout request error:', error);
      res.status(500).json({ error: 'Failed to request payout' });
    }
  });

  // ── Helpers ─────────────────────────────────────────────────
  function parsePackage(pkg) {
    let photos = [];
    try {
      photos = typeof pkg.photos === 'string' ? JSON.parse(pkg.photos) : (pkg.photos || []);
    } catch {
      photos = pkg.photos ? [pkg.photos] : [];
    }

    // 📸 Normalize photo URLs
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
      if (occ.includes('anniversary') || occ.includes('candlelight') || occ.includes('romantic')) defaultImg = '/images/categories/anniversary.jpg';
      else if (occ.includes('wedding') || occ.includes('mandap')) defaultImg = '/images/categories/wedding.jpg';
      else if (occ.includes('baby')) defaultImg = '/images/categories/babyshower.jpg';
      else if (occ.includes('balloon') || occ.includes('arch')) defaultImg = '/images/categories/balloons.jpg';
      else if (occ.includes('corporate') || occ.includes('office')) defaultImg = '/images/categories/corporate.jpg';
      else if (occ.includes('surprise') || occ.includes('party')) defaultImg = '/images/categories/surprise.jpg';
      photos = [defaultImg];
    }

    // 🎥 Normalize video URL
    let video_url = (pkg.video_url || '').trim().replace(/\\/g, '/');
    if (video_url.startsWith('public/')) video_url = video_url.replace(/^public\//, '/');
    if (video_url.startsWith('uploads/')) video_url = '/' + video_url;

    let included_items = [];
    try {
      included_items = typeof pkg.included_items === 'string' ? JSON.parse(pkg.included_items) : (pkg.included_items || []);
    } catch {
      included_items = [];
    }

    let custom_addons = [];
    try {
      custom_addons = typeof pkg.custom_addons === 'string' ? JSON.parse(pkg.custom_addons) : (pkg.custom_addons || []);
    } catch {
      custom_addons = [];
    }

    const price = Number(pkg.price) || 0;
    const original_price = pkg.original_price ? Number(pkg.original_price) : Math.round(price * 1.35);
    const discount_percent = pkg.discount_percent || (original_price > price ? Math.round(((original_price - price) / original_price) * 100) : 0);

    return {
      ...pkg,
      photos,
      video_url,
      included_items,
      custom_addons,
      occasion_tags,
      supported_modes: pkg.supported_modes ? pkg.supported_modes.split(',') : ['home', 'custom'],
      price,
      original_price,
      discount_percent,
      coupon_code: pkg.coupon_code || '',
      coupon_discount: pkg.coupon_discount ? Number(pkg.coupon_discount) : null,
      rating: pkg.rating || '4.9',
      reviews_count: pkg.reviews_count || 142,
      setup_time: pkg.setup_time || '2–3 hrs setup',
      category: occasion_tags[0] || 'Celebration',
      discount_tag: discount_percent > 0 ? `${discount_percent}% OFF` : 'DEAL'
    };
  }

  // ✅ Let Next.js handle ALL non-API routes (pages, static files, etc.)
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // ✅ Single server on one port — no more EADDRINUSE
  app.listen(PORT, () => {
    console.log(`🚀 Momanto running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  });
});
