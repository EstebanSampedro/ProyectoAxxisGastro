// backend/src/routes/whatsapp.js
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const authMiddleware = require("../../middleware/authMiddleware");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
router.use(authMiddleware);
// Configuración de Multer para guardar archivos temporalmente en "src/public/uploads"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Guarda los archivos en "backend/src/public/uploads"
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    // Genera un nombre único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Variables de entorno de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+19895644496';

// Configuración de Google Drive API (usando un Service Account)
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../credentials/valid-token.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file']
});
const drive = google.drive({ version: 'v3', auth });

// Endpoint para enviar mensaje de WhatsApp con opción de adjuntar archivos
// Usa upload.any() para aceptar uno o más archivos (si se envían)
router.post('/send', upload.any(), async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Faltan parámetros phone y message.' });
    }

    // Formatea el número de teléfono
    let toWhatsApp = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;

    // Procesar archivos: subir a Google Drive y generar enlaces de descarga directa
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      mediaUrls = await Promise.all(req.files.map(async (file) => {
        const fileMetadata = { name: file.filename };
        const media = {
          mimeType: file.mimetype,
          body: fs.createReadStream(file.path)
        };

        const driveResponse = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id'
        });
        const fileId = driveResponse.data.id;

        // Cambiar permisos para que sea accesible públicamente
        await drive.permissions.create({
          fileId: fileId,
          requestBody: { role: 'reader', type: 'anyone' }
        });

        // Generar enlace de descarga directa usando la plantilla
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }));
      mediaUrls = mediaUrls.filter(url => url); // Filtra nulos
    }

    const client = twilio(accountSid, authToken);

    // Si hay archivos, envía el primer mensaje con el cuerpo completo
    // y para el resto utiliza body vacío.
    if (mediaUrls.length > 0) {
      let messageSids = [];
      for (let i = 0; i < mediaUrls.length; i++) {
        const msgParams = {
          from: whatsappFrom,
          to: toWhatsApp,
          body: i === 0 ? message : "", // Solo el primer mensaje tiene el cuerpo completo
          mediaUrl: [mediaUrls[i]]
        };
        const response = await client.messages.create(msgParams);
        messageSids.push(response.sid);
      }
      return res.json({ success: true, sids: messageSids });
    } else {
      // Sin archivos: se envía un único mensaje
      const msgParams = {
        from: whatsappFrom,
        to: toWhatsApp,
        body: message
      };
      const response = await client.messages.create(msgParams);
      return res.json({ success: true, sid: response.sid });
    }
  } catch (error) {
    console.error('Error al enviar WhatsApp:', error);
    return res.status(500).json({ error: 'No se pudo enviar el mensaje de WhatsApp' });
  }
});

module.exports = router;