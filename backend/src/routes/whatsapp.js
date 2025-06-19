// backend/src/routes/whatsapp.js
require('dotenv').config();
const express = require('express');
const router  = express.Router();
const twilio  = require('twilio');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { google } = require('googleapis');
const authMw  = require('../../middleware/authMiddleware');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ————— Multer para recibir archivos —————
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ————— Twilio & WhatsApp —————
const client       = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // ej. 'whatsapp:+14155238886'

// ————— Tus Content SIDs —————
const TEMPLATE_SIDS = {
  consulta_recordatorio: 'HXad8d4558531c5f8dcc722f62b7ae50d5',
  consulta_seguimiento:  'HXde99bc581c7b25776a4963fb0330a80f',
  cita_recordatorio:     'HXd60d08b72a86e3d08afa7188eee6bfda',
  cita_seguimiento:      'HXdbf118539c801642c06494e2d707b511',
};

// ————— Google Drive setup —————
const gAuth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../credentials/valid-token.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file']
});
const drive = google.drive({ version: 'v3', auth: gAuth });

// Sube todos los archivos a Drive y devuelve URLs públicas
async function uploadToDrive(files) {
  const urls = [];
  for (let file of files) {
    const { data } = await drive.files.create({
      requestBody: { name: file.filename },
      media: { mimeType: file.mimetype, body: fs.createReadStream(file.path) },
      fields: 'id'
    });
    await drive.permissions.create({
      fileId: data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });
    urls.push(`https://drive.google.com/uc?export=download&id=${data.id}`);
  }
  return urls;
}

// Envía plantilla + adjuntos (si los hay)
async function sendTemplateWithFiles(req, res, templateSid, vars) {
  try {
    const phone = req.body.phone;
    if (!phone) {
      return res.status(400).json({ error: 'Falta el campo phone.' });
    }

    // 1) Subir a Drive
    const mediaUrls = (req.files && req.files.length)
      ? await uploadToDrive(req.files)
      : [];

    // 2) Prefija whatsapp:
    const to = phone.startsWith('whatsapp:')
      ? phone
      : `whatsapp:${phone}`;

    // 3) Dispara la plantilla
    await client.messages.create({
      from: whatsappFrom,
      to,
      contentSid:       templateSid,
      contentVariables: JSON.stringify(vars)
    });

    // 4) Envía cada adjunto como mensaje separado
    const sids = [];
    for (let url of mediaUrls) {
      const msg = await client.messages.create({
        from: whatsappFrom,
        to,
        mediaUrl: [url]
      });
      sids.push(msg.sid);
    }

    return res.json({ success: true, sids });
  } catch (err) {
    console.error('Error enviando WhatsApp:', err);
    return res.status(500).json({ error: err.message });
  }
}

router.use(authMw);

// ————— Endpoints —————

// 1) Consulta – Recordatorio
router.post(
  '/consulta/recordatorio',
  upload.any(),
  (req, res) => {
    const { paciente, doctor, fecha, hora } = req.body;
    if (!paciente || !fecha || !hora || !doctor) {
      return res.status(400).json({ error: 'Faltan datos para recordatorio consulta.' });
    }
    const vars = { 1: paciente, 2: doctor, 3: fecha, 4: hora, 5: '' };
    return sendTemplateWithFiles(
      req, res,
      TEMPLATE_SIDS.consulta_recordatorio,
      vars
    );
  }
);

// 2) Consulta – Seguimiento
router.post(
  '/consulta/seguimiento',
  upload.any(),
  (req, res) => {
    const { paciente, fecha, hora, doctor } = req.body;
    if (!paciente || !fecha || !hora || !doctor) {
      return res.status(400).json({ error: 'Faltan datos para seguimiento consulta.' });
    }
    const vars = { 1: doctor, 2: fecha, 3: hora, 4: paciente, 5: '' };
    return sendTemplateWithFiles(
      req, res,
      TEMPLATE_SIDS.consulta_seguimiento,
      vars
    );
  }
);

// 3) Cita – Recordatorio
router.post(
  '/cita/recordatorio',
  upload.any(),
  (req, res) => {
    const { paciente, fecha, hora, doctor } = req.body;
    if (!paciente || !fecha || !hora || !doctor) {
      return res.status(400).json({ error: 'Faltan datos para recordatorio cita.' });
    }
    const vars = { 1: paciente, 2: doctor, 3: fecha, 4: hora, 5: '' };
    return sendTemplateWithFiles(
      req, res,
      TEMPLATE_SIDS.cita_recordatorio,
      vars
    );
  }
);

router.post(
  '/cita/seguimiento',
  upload.any(),
  (req, res) => {
    const { phone, fecha, hora, doctor } = req.body;
    if (!phone || !fecha || !hora || !doctor) {
      return res
        .status(400)
        .json({ error: 'Faltan datos para seguimiento cita.' });
    }
    // Solo 3 variables:
    const vars = {
      1: fecha,
      2: hora,
      3: doctor
    };
    return sendTemplateWithFiles(
      req,
      res,
      TEMPLATE_SIDS.cita_seguimiento,
      vars
    );
  }
);

module.exports = router;
