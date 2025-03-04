// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../database');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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
    const nuevoMedico = await prisma.medico.create({
      data: {
        nombreMedico,
        cedulaMedico,
        codigoMedico: codigoMedico || null,
        user,
        pass: hashedPassword,
        permiso: permiso || 'ADMINISTRADOR',
        empresa: empresa || ''
      }
    });


    return res.json({ message: 'Administrador registrado exitosamente', id: nuevoMedico.id });
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
    // Ajustamos los nombres para que coincidan con la petición y la base de datos
    const { userDoc, passDoc, nomDoctor2, estadoDoctor2 } = req.body;

    // Validación de campos requeridos
    if (!userDoc || !passDoc || !nomDoctor2) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    // Generar el hash de la contraseña
    const hashedPassword = await bcrypt.hash(passDoc, 10);

    // Insertar el nuevo doctor en la tabla "doctor2" usando Prisma
    const newDoctor = await prisma.doctor2.create({
      data: {
        nomDoctor2,
        estadoDoctor2: estadoDoctor2 || 'activo',
        userDoc,
        passDoc: hashedPassword // Importante: usar passDoc, no pass
      }
    });

    return res.json({
      message: 'Doctor registrado exitosamente',
      id: newDoctor.idDoctor2
    });
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
    // Buscar al admin en la tabla "medico" usando Prisma
    const admin = await prisma.medico.findFirst({
      where: { user }
    });

    // Si no existe el usuario
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar la contraseña hasheada con bcrypt
    const passwordValid = await bcrypt.compare(password, admin.pass);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: admin.id, role: admin.permiso },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token, user: admin });

  } catch (error) {
    console.error('Error en login admin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/doctor', async (req, res) => {
  const { user, password } = req.body;

  try {
    // Buscar al doctor en la tabla "doctor2" usando Prisma
    const doctor = await prisma.doctor2.findFirst({
      where: { userDoc: user }
    });

    // Si no existe el usuario
    if (!doctor) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar la contraseña hasheada con bcrypt
    const passwordValid = await bcrypt.compare(password, doctor.passDoc);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar el token JWT
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
