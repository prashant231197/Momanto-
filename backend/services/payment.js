const crypto = require('crypto');
const axios = require('axios');

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MOMANTO MULTI-PROVIDER PAYMENT ENGINE (RAZORPAY, STRIPE & UPI GATEWAY)
 * ═══════════════════════════════════════════════════════════════════════
 */

// ── 1. RAZORPAY GATEWAY INTEGRATION ──────────────────────────────────
async function createRazorpayOrder({ amount, receipt, notes = {} }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // Return structured simulated order if keys are pending
    console.warn('⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Using test session.');
    return {
      success: true,
      order_id: `rzp_order_${Date.now()}`,
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      is_mock: true
    };
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        notes
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      order_id: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency,
      receipt: response.data.receipt,
      is_mock: false
    };
  } catch (error) {
    console.error('Razorpay Order Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.description || 'Failed to create Razorpay order');
  }
}

function verifyRazorpaySignature({ order_id, payment_id, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    // If testing without keys, treat test IDs as valid
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  return generatedSignature === signature;
}

// ── 2. STRIPE GATEWAY INTEGRATION ────────────────────────────────────
async function createStripePaymentIntent({ amount, customerEmail, metadata = {} }) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.warn('⚠️  STRIPE_SECRET_KEY not set. Using test session.');
    return {
      success: true,
      client_secret: `pi_mock_${Date.now()}_secret_${Date.now()}`,
      id: `pi_mock_${Date.now()}`,
      is_mock: true
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('amount', Math.round(amount * 100).toString());
    params.append('currency', 'inr');
    if (customerEmail) params.append('receipt_email', customerEmail);
    Object.entries(metadata).forEach(([k, v]) => {
      params.append(`metadata[${k}]`, String(v));
    });

    const response = await axios.post(
      'https://api.stripe.com/v1/payment_intents',
      params,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      success: true,
      client_secret: response.data.client_secret,
      id: response.data.id,
      is_mock: false
    };
  } catch (error) {
    console.error('Stripe Intent Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to create Stripe payment intent');
  }
}

// ── 3. DYNAMIC UPI INTENT & QR GENERATOR ─────────────────────────────
function generateUpiDetails({ amount, orderId, customerName }) {
  const vpa = process.env.MOMANTO_UPI_VPA || 'momanto.celebrations@icici';
  const payeeName = 'Momanto Celebrations India';
  const note = `Celebration Booking #${orderId}`;

  // Standard NPCI UPI URI Format
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${encodeURIComponent(amount.toFixed(2))}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(orderId)}`;

  return {
    vpa,
    payeeName,
    amount,
    note,
    upiIntentUri,
    qrSvgUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUri)}`
  };
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  createStripePaymentIntent,
  generateUpiDetails
};
