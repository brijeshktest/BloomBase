/**
 * WhatsApp Broadcast Utility
 * 
 * Handles sending WhatsApp messages for broadcasts
 * This is a placeholder implementation that can be connected to:
 * - WhatsApp Business API
 * - Twilio WhatsApp API
 * - MessageBird WhatsApp API
 * - Or any other WhatsApp service provider
 */

const crypto = require('crypto');

/**
 * Generate opt-in/opt-out tokens
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Format phone number for WhatsApp (E.164 format)
 * @param {String} phone - Phone number (can be with or without country code)
 * @returns {String} Formatted phone number
 */
function formatPhoneForWhatsApp(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 91 (India), keep it
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // If 10 digits, assume India and add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  return null;
}

/**
 * Send WhatsApp message via service provider
 * This is a placeholder - replace with actual WhatsApp API integration
 * 
 * @param {String} to - Recipient phone number (E.164 format)
 * @param {String} message - Message to send
 * @returns {Promise<Object>} Result object with success status
 */
async function sendWhatsAppMessage(to, message) {
  try {
    // Format phone number
    const formattedPhone = formatPhoneForWhatsApp(to);
    if (!formattedPhone) {
      throw new Error('Invalid phone number format');
    }
    
    // TODO: Replace this with actual WhatsApp API integration
    // Example integrations:
    
    // Option 1: WhatsApp Business API (official)
    // const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: formattedPhone,
    //     type: 'text',
    //     text: { body: message }
    //   })
    // });
    
    // Option 2: Twilio WhatsApp API
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const message = await client.messages.create({
    //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    //   to: `whatsapp:${formattedPhone}`,
    //   body: message
    // });
    
    // Option 3: MessageBird WhatsApp API
    // const messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
    // const params = {
    //   to: formattedPhone,
    //   from: process.env.MESSAGEBIRD_WHATSAPP_CHANNEL_ID,
    //   type: 'text',
    //   content: { text: message }
    // };
    // const response = await messagebird.conversations.send(params);
    
    // For now, log the message (in production, replace with actual API call)
    console.log(`[WhatsApp Broadcast] Would send to ${formattedPhone}:`, message.substring(0, 50) + '...');
    
    // Simulate API response
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      to: formattedPhone,
      status: 'sent'
    };
  } catch (error) {
    console.error('[WhatsApp Broadcast] Error sending message:', error);
    return {
      success: false,
      error: error.message,
      to: to
    };
  }
}

/**
 * Send broadcast to multiple recipients
 * @param {Array} recipients - Array of phone numbers or subscription objects
 * @param {String} message - Message to send
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Summary of send results
 */
async function sendBroadcast(recipients, message, onProgress = null) {
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: []
  };
  
  // Rate limiting: Send max 5 messages per second to avoid spam
  const delay = 200; // 200ms between messages = 5 per second
  let index = 0;
  
  for (const recipient of recipients) {
    const phone = typeof recipient === 'string' ? recipient : recipient.phone;
    
    try {
      const result = await sendWhatsAppMessage(phone, message);
      
      if (result.success) {
        results.sent++;
        if (onProgress) {
          onProgress({ phone, status: 'sent', index: index + 1, total: recipients.length });
        }
      } else {
        results.failed++;
        results.errors.push({ phone, error: result.error });
        if (onProgress) {
          onProgress({ phone, status: 'failed', error: result.error, index: index + 1, total: recipients.length });
        }
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ phone, error: error.message });
      if (onProgress) {
        onProgress({ phone, status: 'failed', error: error.message, index: index + 1, total: recipients.length });
      }
    }
    
    index++;
    
    // Rate limiting delay
    if (index < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Build broadcast message with opt-out link
 * @param {String} baseMessage - Main message content
 * @param {String} storeLink - Link to seller's store
 * @param {String} optOutLink - Opt-out link for recipient
 * @returns {String} Complete message with formatting
 */
function buildBroadcastMessage(baseMessage, storeLink = null, optOutLink = null) {
  let message = baseMessage;
  
  // Add store link if provided
  if (storeLink) {
    message += `\n\n🔗 View Store: ${storeLink}`;
  }
  
  // Add opt-out notice and link
  if (optOutLink) {
    message += `\n\n---\n📱 To stop receiving updates, click: ${optOutLink}`;
  } else {
    message += `\n\n---\n📱 Reply STOP to unsubscribe from updates.`;
  }
  
  return message;
}

module.exports = {
  sendWhatsAppMessage,
  sendBroadcast,
  buildBroadcastMessage,
  formatPhoneForWhatsApp,
  generateToken
};
