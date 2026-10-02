const axios = require('axios');

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MOMANTO REAL-TIME WHATSAPP NOTIFICATION SERVICE
 * Supported Gateways:
 * 1. CallMeBot Free WhatsApp API (100% Free - Zero Cost)
 * 2. Meta WhatsApp Cloud API (Official Facebook Graph API)
 * 3. Twilio WhatsApp API (Global & Sandbox)
 * 4. Direct wa.me Deep Links for instant 1-click coordination
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Send a WhatsApp Message to a mobile number
 * @param {string} phone - 10-digit or E.164 phone number
 * @param {string} message - Text message content
 */
async function sendWhatsAppMessage(phone, message) {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const e164Phone = `+91${cleanPhone}`;

  const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

  const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WA_TOKEN;
  const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const GREEN_API_ID_INSTANCE = process.env.GREEN_API_ID_INSTANCE;
  const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || process.env.GREEN_API_API_TOKEN_INSTANCE;

  const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
  const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;

  // ── 1. Try Green-API (Instant WhatsApp by scanning QR code) ──────────
  if (GREEN_API_ID_INSTANCE && GREEN_API_TOKEN) {
    try {
      const baseUrl = process.env.GREEN_API_API_URL || `https://${GREEN_API_ID_INSTANCE.slice(0, 4)}.api.greenapi.com`;
      const url = `${baseUrl}/waInstance${GREEN_API_ID_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`;
      const res = await axios.post(url, {
        chatId: `91${cleanPhone}@c.us`,
        message: message
      }, { timeout: 10000 });
      console.log(`💬 [Green-API WhatsApp] Real WhatsApp delivered to +91 ${cleanPhone}`);
      return { success: true, provider: 'green_api', id: res.data?.idMessage };
    } catch (err) {
      console.error('Green-API WhatsApp Error:', err.response?.data || err.message);
    }
  }

  // ── 2. Try UltraMsg WhatsApp Gateway (Instant WhatsApp via QR) ───────
  if (ULTRAMSG_INSTANCE_ID && ULTRAMSG_TOKEN) {
    try {
      const url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;
      const res = await axios.post(url, {
        token: ULTRAMSG_TOKEN,
        to: e164Phone,
        body: message
      }, { timeout: 10000 });
      console.log(`💬 [UltraMsg WhatsApp] Real WhatsApp delivered to +91 ${cleanPhone}`);
      return { success: true, provider: 'ultramsg', data: res.data };
    } catch (err) {
      console.error('UltraMsg WhatsApp Error:', err.response?.data || err.message);
    }
  }

  // ── 3. Try CallMeBot Free WhatsApp API (100% Free Forever) ───────────
  if (CALLMEBOT_API_KEY) {
    try {
      const targetPhone = phone.startsWith('+') ? phone : `+91${cleanPhone}`;
      const encodedText = encodeURIComponent(message);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(targetPhone)}&text=${encodedText}&apikey=${CALLMEBOT_API_KEY}`;
      const res = await axios.get(url, { timeout: 10000 });
      console.log(`💬 [CallMeBot Free WhatsApp] Real WhatsApp sent to ${targetPhone}`);
      return { success: true, provider: 'callmebot_free', data: res.data };
    } catch (err) {
      console.error('CallMeBot WhatsApp Error:', err.response?.data || err.message);
    }
  }

  // ── 4. Try Meta Official WhatsApp Cloud API ──────────────────────────
  if (WA_ACCESS_TOKEN && WA_PHONE_NUMBER_ID) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${WA_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: `91${cleanPhone}`,
          type: 'text',
          text: { preview_url: true, body: message }
        },
        {
          headers: {
            Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`💬 [WhatsApp Cloud API] Message sent to +91 ${cleanPhone}`);
      return { success: true, provider: 'meta_whatsapp', data: response.data };
    } catch (err) {
      console.error('Meta WhatsApp Cloud API Error:', err.response?.data || err.message);
    }
  }

  // ── 5. Try Twilio WhatsApp API ──────────────────────────────────────
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
    try {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
      const fromWa = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
        ? TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
      const toWa = `whatsapp:${e164Phone}`;

      const params = new URLSearchParams();
      params.append('To', toWa);
      params.append('From', fromWa);
      params.append('Body', message);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        params,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      console.log(`💬 [Twilio WhatsApp] Message sent to +91 ${cleanPhone}`);
      return { success: true, provider: 'twilio_whatsapp', sid: response.data.sid };
    } catch (err) {
      console.error('Twilio WhatsApp Error:', err.response?.data || err.message);
    }
  }

  console.warn(`⚠️ [Momanto WhatsApp] No active WhatsApp gateway configured in .env for +91 ${cleanPhone}`);
  return { success: false, provider: 'none', error: 'WhatsApp gateway credentials not configured in .env' };
}

/**
 * Send Login / Auth OTP via WhatsApp
 */
async function sendWhatsAppOtp(phone, otp) {
  const message = `🎉 *Momanto Celebrations*\n\nYour Login Verification OTP is: *${otp}*\n\nValid for 10 minutes. Please do not share this OTP with anyone.\n\n_Thank you for choosing Momanto - India's #1 Doorstep Celebration Platform!_`;
  return await sendWhatsAppMessage(phone, message);
}

/**
 * Send Booking Confirmation via WhatsApp
 */
async function sendBookingConfirmationWhatsApp(order) {
  const phone = order.customer_whatsapp || order.customer_phone || order.phone;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const trackUrl = `${siteUrl}/track/${order.order_id}`;

  const message = `🎉 *CELEBRATION BOOKING CONFIRMED!* 🎉\n\n` +
    `Hello *${order.customer_name || 'Valued Host'}*,\n` +
    `Your celebration setup has been reserved successfully!\n\n` +
    `📋 *Order ID:* ${order.order_id}\n` +
    `✨ *Package:* ${order.package_name}\n` +
    `👨‍🎨 *Planner:* ${order.business_name || 'Verified Momanto Decorator'}\n` +
    `📅 *Date & Time:* ${order.event_date} at ${order.event_time || '18:30'}\n` +
    `📍 *Venue:* ${order.event_location || 'Doorstep Delivery'}\n` +
    `💰 *Amount:* ₹${Number(order.total_amount || 0).toLocaleString('en-IN')}\n\n` +
    `🔴 *Live Order Tracking:* ${trackUrl}\n\n` +
    `_Our planner team will contact you shortly to confirm decorative details. Have a memorable celebration!_ 🎂✨`;

  return await sendWhatsAppMessage(phone, message);
}

/**
 * Send Order Milestone Status Update via WhatsApp
 */
async function sendStatusUpdateWhatsApp(order, newStatus) {
  const phone = order.customer_whatsapp || order.customer_phone || order.phone;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const trackUrl = `${siteUrl}/track/${order.order_id}`;

  let statusHeader = 'UPDATE';
  let statusDetail = 'Your celebration order status has been updated.';

  if (newStatus === 'confirmed') {
    statusHeader = 'PLANNER ACCEPTED & CONFIRMED ✅';
    statusDetail = `Your assigned planner (*${order.business_name || 'Decorator Team'}*) has accepted your booking and is preparing materials.`;
  } else if (newStatus === 'en_route' || newStatus === 'on_the_way') {
    statusHeader = 'PLANNER IS EN-ROUTE 🚚';
    statusDetail = `Our decoration crew is on their way to your venue with all balloons, cake, and lighting equipment!`;
  } else if (newStatus === 'in_progress' || newStatus === 'setting_up') {
    statusHeader = 'DECORATION IN PROGRESS 🎨';
    statusDetail = `Setup is currently underway at your venue. We will notify you once everything is photo-ready.`;
  } else if (newStatus === 'completed' || newStatus === 'ready') {
    statusHeader = 'CELEBRATION READY FOR SURPRISE! 🥳🎂';
    statusDetail = `Your setup is 100% complete, inspected, and ready to amaze your guests!`;
  } else if (newStatus === 'cancelled') {
    statusHeader = 'ORDER CANCELLED ❌';
    statusDetail = `Your celebration booking #${order.order_id} has been cancelled. Any applicable refund has been initiated.`;
  }

  const message = `🔔 *CELEBRATION STATUS: ${statusHeader}*\n\n` +
    `Hello *${order.customer_name || 'Host'}*,\n` +
    `${statusDetail}\n\n` +
    `📋 *Order ID:* ${order.order_id}\n` +
    `✨ *Package:* ${order.package_name}\n` +
    `📍 *Track Live:* ${trackUrl}\n\n` +
    `_Momanto Celebration Support_ 🎈`;

  return await sendWhatsAppMessage(phone, message);
}

/**
 * Generate Direct wa.me WhatsApp URL for instant chat
 */
function getDirectWhatsAppChatUrl(phone, defaultText = '') {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const encodedText = encodeURIComponent(defaultText || 'Hi, I need assistance with my Momanto celebration booking!');
  return `https://wa.me/91${cleanPhone}?text=${encodedText}`;
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppOtp,
  sendBookingConfirmationWhatsApp,
  sendStatusUpdateWhatsApp,
  getDirectWhatsAppChatUrl
};
