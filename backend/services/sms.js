const axios = require('axios');

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MOMANTO REAL-WORLD SMS NOTIFICATION SERVICE
 * Supported Providers: Fast2SMS (India), Twilio (Global)
 * ═══════════════════════════════════════════════════════════════════════
 */

async function sendSMS(phone, message, otp = null) {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  // 1. Try Fast2SMS (India Quick OTP & Bulk SMS API)
  if (FAST2SMS_API_KEY && FAST2SMS_API_KEY.length > 10) {
    try {
      if (otp) {
        // Primary: Quick SMS route ('q') for instant zero-restriction delivery
        try {
          const quickRes = await axios.post(
            'https://www.fast2sms.com/dev/bulkV2',
            {
              message: `Your Momanto celebration login OTP is: ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
              language: 'english',
              route: 'q',
              numbers: cleanPhone
            },
            {
              headers: { authorization: FAST2SMS_API_KEY }
            }
          );
          console.log(`✅ [Fast2SMS] Real OTP sent to +91 ${cleanPhone} (Route: Quick SMS)`);
          return { success: true, provider: 'fast2sms', data: quickRes.data };
        } catch (quickErr) {
          // Secondary fallback: OTP route
          const otpRes = await axios.post(
            'https://www.fast2sms.com/dev/bulkV2',
            {
              variables_values: String(otp),
              route: 'otp',
              numbers: cleanPhone
            },
            {
              headers: { authorization: FAST2SMS_API_KEY }
            }
          );
          console.log(`✅ [Fast2SMS] Real OTP sent to +91 ${cleanPhone} (Route: OTP)`);
          return { success: true, provider: 'fast2sms', data: otpRes.data };
        }
      } else {
        // Quick SMS message route
        const response = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            message: message,
            language: 'english',
            route: 'q',
            numbers: cleanPhone
          },
          {
            headers: { authorization: FAST2SMS_API_KEY }
          }
        );
        console.log(`✅ [Fast2SMS] Real SMS sent to +91 ${cleanPhone}`);
        return { success: true, provider: 'fast2sms', data: response.data };
      }
    } catch (err) {
      const errData = err.response?.data;
      const errMsg = errData?.message || err.message;
      if (errData && errData.status_code === 999) {
        console.error(`❌ [Fast2SMS Notice] ${errData.message} (Visit fast2sms.com to add ₹100 to activate Dev API).`);
      } else {
        console.error('❌ Fast2SMS Error:', errData || err.message);
      }
      return { success: false, provider: 'fast2sms', error: errMsg };
    }
  }

  // 2. Try Twilio (International SMS)
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `+91${cleanPhone}`);
      params.append('From', TWILIO_PHONE_NUMBER);
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
      console.log(`✅ [Twilio] Real SMS sent to +91 ${cleanPhone}`);
      return { success: true, provider: 'twilio', sid: response.data.sid };
    } catch (err) {
      console.error('Twilio SMS Error:', err.response?.data || err.message);
      return { success: false, provider: 'twilio', error: err.response?.data?.message || err.message };
    }
  }

  console.warn(`⚠️ [Momanto SMS] No active SMS gateway succeeded for +91 ${cleanPhone}`);
  return { success: false, provider: 'none', error: 'No SMS gateway succeeded. Please configure Fast2SMS or Twilio.' };
}

async function sendOtpSMS(phone, otp) {
  // Plain ASCII only (no emojis) to prevent 16-bit UCS2 multi-part telecom billing
  const message = `Momanto verification code is: ${otp}. Valid for 10 minutes.`;
  return await sendSMS(phone, message, otp);
}

async function sendOrderConfirmationSMS(order) {
  // If user disabled order SMS to save costs, skip
  if (process.env.ENABLE_ORDER_SMS === 'false') {
    console.log('ℹ️ [Momanto SMS] Order SMS is disabled (ENABLE_ORDER_SMS=false) to save wallet balance.');
    return { success: true, skipped: true, note: 'Order SMS skipped to save Fast2SMS balance' };
  }

  const phone = order.customer_phone || order.phone;
  // Strictly plain ASCII text without emojis to stay under 1 SMS credit
  const message = `Momanto Confirmed: Order #${order.order_id} for ${order.package_name.slice(0, 30)}. Track: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track/${order.order_id}`;

  return await sendSMS(phone, message);
}

async function sendPlannerBookingSMS(order, plannerPhone) {
  if (!plannerPhone) return { success: false, error: 'Planner phone not provided' };
  if (process.env.ENABLE_ORDER_SMS === 'false') {
    console.log('ℹ️ [Momanto SMS] Planner SMS is disabled (ENABLE_ORDER_SMS=false) to save wallet balance.');
    return { success: true, skipped: true, note: 'Planner SMS skipped to save Fast2SMS balance' };
  }

  // Strictly plain ASCII text without emojis to stay under 1 SMS credit
  const message = `Momanto Alert: Order #${order.order_id} for ${order.package_name.slice(0, 25)}. Host: ${order.customer_name} (${order.customer_phone}). Total: Rs.${order.total_amount}.`;
  return await sendSMS(plannerPhone, message);
}

module.exports = {
  sendSMS,
  sendOtpSMS,
  sendOrderConfirmationSMS,
  sendPlannerBookingSMS
};
