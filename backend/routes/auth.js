// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../database');
const router = express.Router();

/**
 * Endpoint para registrar un nuevo administrador.
 * Recibe en el body:
 * - user: nombre de usuario
 * - password: contraseña en texto plano
 * - nombreMedico: nombre completo del administrador
 * - cedulaMedico: cédula del administrador
 * - codigoMedico: (opcional) código o identificador
 * - permiso: (opcional) permiso, por defecto se asigna 'ADMINISTRADOR'
 * - empresa: (opcional) nombre de la empresa
 */
router.post('/register/admin', async (req, res) => {
  try {
    const { user, password, nombreMedico, cedulaMedico, codigoMedico, permiso, empresa } = req.body;
    
    // Validación de campos requeridos
    if (!user || !password || !nombreMedico || !cedulaMedico) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    // Generar el hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo administrador en la tabla "medico"
    const [result] = await pool.query(
      `INSERT INTO medico 
       (nombreMedico, cedulaMedico, codigoMedico, user, pass, permiso, empresa) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombreMedico, cedulaMedico, codigoMedico, user, hashedPassword, permiso || 'ADMINISTRADOR', empresa || '']
    );

    return res.json({ message: 'Administrador registrado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error en registro admin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * Endpoint para registrar un nuevo doctor.
 * Recibe en el body:
 * - userDoc: nombre de usuario para el doctor
 * - password: contraseña en texto plano
 * - nomDoctor2: nombre completo del doctor
 * - estadoDoctor2: (opcional) estado del doctor, por defecto 'activo'
 */
router.post('/register/doctor', async (req, res) => {
  try {
    const { userDoc, password, nomDoctor2, estadoDoctor2 } = req.body;
    
    // Validación de campos requeridos
    if (!userDoc || !password || !nomDoctor2) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    // Generar el hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo doctor en la tabla "doctor2"
    const [result] = await pool.query(
      `INSERT INTO doctor2 (nomDoctor2, estadoDoctor2, userDoc, passDoc)
       VALUES (?, ?, ?, ?)`,
      [nomDoctor2, estadoDoctor2 || 'activo', userDoc, hashedPassword]
    );

    return res.json({ message: 'Doctor registrado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error en registro doctor:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * Endpoint de login para Admin (tabla "medico")
 */
router.post('/admin', async (req, res) => {
  const { user, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM medico WHERE user = ?', [user]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const admin = rows[0];

    // Verificar la contraseña hasheada con bcrypt
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

/**
 * Endpoint de login para Doctores (tabla "doctor2")
 */
router.post('/doctor', async (req, res) => {
  const { user, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM doctor2 WHERE userDoc = ?', [user]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const doctor = rows[0];

    // Verificar la contraseña hasheada con bcrypt
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
