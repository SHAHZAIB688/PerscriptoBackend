const twilio = require("twilio");

const sendWhatsApp = async ({ to, message }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
    return { skipped: true, reason: "Twilio env vars missing" };
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
    });
    return { success: true, sid: response.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { sendWhatsApp };
