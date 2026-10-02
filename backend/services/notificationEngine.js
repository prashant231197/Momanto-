const { sendSMS, sendOtpSMS, sendOrderConfirmationSMS, sendPlannerBookingSMS } = require('./sms');
const {
  sendWhatsAppMessage,
  sendWhatsAppOtp,
  sendBookingConfirmationWhatsApp,
  sendStatusUpdateWhatsApp
} = require('./whatsapp');
const { sendOrderNotification } = require('./telegram');

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MOMANTO UNIFIED MULTI-CHANNEL NOTIFICATION ENGINE
 * Channels: Real SMS (Fast2SMS / Twilio), WhatsApp (Cloud API / Twilio), Telegram
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Dispatch OTP via preferred method ('sms' | 'whatsapp' | 'both')
 */
async function dispatchOtpNotification({ phone, otp, method = 'both' }) {
  const results = { sms: null, whatsapp: null };

  if (method === 'sms' || method === 'both') {
    try {
      results.sms = await sendOtpSMS(phone, otp);
    } catch (err) {
      console.error('SMS OTP Dispatch Error:', err.message);
      results.sms = { success: false, error: err.message };
    }
  }

  if (method === 'whatsapp' || method === 'both') {
    try {
      results.whatsapp = await sendWhatsAppOtp(phone, otp);
    } catch (err) {
      console.error('WhatsApp OTP Dispatch Error:', err.message);
      results.whatsapp = { success: false, error: err.message };
    }
  }

  return results;
}

/**
 * Dispatch Booking Confirmation to both Customer & Planner
 */
async function dispatchBookingNotifications(order, pkg = null, planner = null) {
  const results = {
    customerSMS: null,
    customerWhatsApp: null,
    plannerWhatsApp: null,
    telegram: null
  };

  // 1. Customer SMS & WhatsApp
  try {
    results.customerSMS = await sendOrderConfirmationSMS(order);
  } catch (e) {
    console.error('Customer SMS notification error:', e.message);
  }

  try {
    results.customerWhatsApp = await sendBookingConfirmationWhatsApp(order);
  } catch (e) {
    console.error('Customer WhatsApp notification error:', e.message);
  }

  // 2. Planner SMS & WhatsApp notification (Alerting the decorator!)
  const plannerPhone = (planner && (planner.whatsapp_number || planner.phone)) || (pkg && (pkg.whatsapp_number || pkg.phone));
  if (plannerPhone) {
    // Send Real Fast2SMS Alert directly to Planner's Phone!
    try {
      results.plannerSMS = await sendPlannerBookingSMS(order, plannerPhone);
      console.log(`📱 [Fast2SMS] Booking alert SMS dispatched to Planner +91 ${plannerPhone}`);
    } catch (e) {
      console.error('Planner SMS notification error:', e.message);
    }

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const plannerPortalUrl = `${siteUrl}/planner/orders`;
      const plannerMessage = `🔔 *NEW CELEBRATION BOOKING RECEIVED!* 🔔\n\n` +
        `Order ID: *#${order.order_id}*\n` +
        `Package: *${order.package_name}*\n` +
        `Customer: *${order.customer_name}* (+91 ${order.customer_phone})\n` +
        `Date: *${order.event_date}* at *${order.event_time || '18:30'}*\n` +
        `Venue: *${order.event_location}*\n` +
        `Earnings: *₹${Number(order.total_amount || 0).toLocaleString('en-IN')}*\n\n` +
        `👉 *Manage Booking on Planner Portal:* ${plannerPortalUrl}\n\n` +
        `_Please call customer within 15 minutes to confirm decoration nuance._ ✨`;

      results.plannerWhatsApp = await sendWhatsAppMessage(plannerPhone, plannerMessage);
    } catch (e) {
      console.error('Planner WhatsApp notification error:', e.message);
    }
  }

  // 3. Telegram Bot Alert (if chat ID configured)
  const tgChatId = (planner && planner.telegram_chat_id) || (pkg && pkg.telegram_chat_id);
  if (tgChatId) {
    try {
      results.telegram = await sendOrderNotification(tgChatId, order);
    } catch (e) {
      console.error('Telegram notification error:', e.message);
    }
  }

  return results;
}

/**
 * Dispatch Milestone Status Update (Confirmed, En-Route, In-Progress, Completed)
 */
async function dispatchStatusUpdateNotifications(order, newStatus) {
  const results = { sms: null, whatsapp: null };

  try {
    results.whatsapp = await sendStatusUpdateWhatsApp(order, newStatus);
  } catch (e) {
    console.error('Status WhatsApp notification error:', e.message);
  }

  try {
    let smsText = `Momanto: Order #${order.order_id} status updated to "${newStatus.toUpperCase()}". Track: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track/${order.order_id}`;
    if (newStatus === 'confirmed') {
      smsText = `🎉 Momanto: Your planner has confirmed booking #${order.order_id}! Setup is scheduled for ${order.event_date}. Track: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track/${order.order_id}`;
    } else if (newStatus === 'en_route') {
      smsText = `🚚 Momanto: Decorator crew is EN-ROUTE to your venue for booking #${order.order_id}! Track: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track/${order.order_id}`;
    } else if (newStatus === 'completed') {
      smsText = `🥳 Momanto: Celebration setup #${order.order_id} is COMPLETE & Photo Ready! Enjoy your special day.`;
    }
    results.sms = await sendSMS(order.customer_phone, smsText);
  } catch (e) {
    console.error('Status SMS notification error:', e.message);
  }

  return results;
}

module.exports = {
  dispatchOtpNotification,
  dispatchBookingNotifications,
  dispatchStatusUpdateNotifications
};
