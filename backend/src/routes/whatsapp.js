// backend/routes/whatsapp.js
const express = require('express');
const router = express.Router();
const twilio = require('twilio');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Lee las variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;

// Este es tu número de WhatsApp sandbox o tu número verificado con Twilio
// Por ejemplo, "whatsapp:+14155238886"
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+19895644496';

// Endpoint para enviar mensaje de WhatsApp
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Faltan parámetros phone y message.' });
    }

    // Asegúrate de que "phone" lleve "whatsapp:" delante
    // y esté en formato E.164 con el prefijo del país.
    // Ejemplo final: "whatsapp:+593987654321"
    let toWhatsApp = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;

    const client = twilio(accountSid, authToken);

    const response = await client.messages.create({
      from: whatsappFrom,  // "whatsapp:+14155238886" en modo sandbox
      to:   toWhatsApp,
      body: message
    });

    return res.json({ success: true, sid: response.sid });
  } catch (error) {
    console.error('Error al enviar WhatsApp:', error);
    return res.status(500).json({ error: 'No se pudo enviar el mensaje de WhatsApp' });
  }
});

module.exports = router;
