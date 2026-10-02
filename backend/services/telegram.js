const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendOrderNotification(plannerChatId, order) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set. Skipping notification.');
    return { success: false, message: 'Bot token not configured' };
  }

  if (!plannerChatId || plannerChatId === '123456789') {
    console.warn('⚠️  Invalid Telegram chat ID. Planner needs to message your bot first.');
    return { success: false, message: 'Invalid chat ID' };
  }

  const message = formatOrderMessage(order);
  const keyboard = createOrderKeyboard(order);

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: plannerChatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      },
      {
        timeout: 5000
      }
    );

    console.log('✅ Telegram notification sent successfully');
    return { success: true, messageId: response.data.result.message_id };
  } catch (error) {
    console.error('❌ Telegram notification failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

function formatOrderMessage(order) {
  const addonsText = order.selected_addons && order.selected_addons.length > 0
    ? order.selected_addons.map(a => `  + ${a.name}: ₹${a.price}`).join('\n')
    : '';

  return `
🔥 *NEW ORDER!* #${order.order_id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *Package:* ${order.package_name}
💰 *Amount:* ₹${order.total_amount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *CUSTOMER:*
Name: ${order.customer_name}
📞 Phone: ${order.customer_phone}
💬 WhatsApp: ${order.customer_whatsapp || order.customer_phone}
${order.customer_email ? `📧 Email: ${order.customer_email}` : ''}

🎉 *EVENT DETAILS:*
📅 Date: ${order.event_date}
🕐 Time: ${order.event_time}
📍 Location: ${order.event_location}
${order.event_for_whom ? `\n👥 For: ${order.event_for_whom}` : ''}
${order.age_milestone ? `🎂 ${order.age_milestone}` : ''}
${order.occasion ? `🎊 Occasion: ${order.occasion}` : ''}
${order.num_guests ? `👥 Guests: ~${order.num_guests} people` : ''}

${order.theme_preference ? `🎨 *THEME:* ${order.theme_preference}\n` : ''}
${order.special_requests ? `⚠️ *SPECIAL NOTES:*\n${order.special_requests}\n` : ''}
${order.dietary_restrictions ? `🚫 *ALLERGIES:* ${order.dietary_restrictions}\n` : ''}
${addonsText ? `\n💎 *ADD-ONS:*\n${addonsText}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ *Action Required:* Call customer within 10 minutes
`.trim();
}

function createOrderKeyboard(order) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const phoneClean = order.customer_phone.replace(/\D/g, '');

  return {
    inline_keyboard: [
      [
        { 
          text: '📞 Call Customer', 
          url: `tel:${order.customer_phone}` 
        },
        { 
          text: '💬 WhatsApp', 
          url: `https://wa.me/${phoneClean}` 
        }
      ],
      [
        { 
          text: '🖥️ View in Dashboard', 
          url: `${siteUrl}/planner/orders/${order.order_id}` 
        }
      ]
    ]
  };
}

// Function to test Telegram connection
async function testTelegramConnection() {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, message: 'Bot token not set' };
  }

  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
    );
    
    return { 
      success: true, 
      botInfo: response.data.result 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

module.exports = {
  sendOrderNotification,
  testTelegramConnection
};
