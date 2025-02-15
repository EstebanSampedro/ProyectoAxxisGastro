// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../database');
const router = express.Router();

// Endpoint de login para Admin (tabla "medico")
router.post('/admin', async (req, res) => {
  const { user, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM medico WHERE user = ?', [user]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const admin = rows[0];

    // Verificar la contraseña (asegúrate de que admin.pass esté hasheado)
    const passwordValid = await bcrypt.compare(password, admin.pass);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: admin.idmedico, role: admin.permiso },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ token, user: admin });
  } catch (error) {
    console.error('Error en login admin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint de login para Doctores (tabla "doctor2")
router.post('/doctor', async (req, res) => {
  const { user, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM doctor2 WHERE userDoc = ?', [user]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const doctor = rows[0];

    // Verificar la contraseña (asegúrate de que doctor.passDoc esté hasheado)
    const passwordValid = await bcrypt.compare(password, doctor.passDoc);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar el token JWT para doctor
    const token = jwt.sign(
      { id: doctor.idDoctor2, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ token, user: doctor });
  } catch (error) {
    console.error('Error en login doctor:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
