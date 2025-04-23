// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const prisma = require("../../prisma/prismaClient");

// ------------------------------------------
// LOGIN & REGISTROS BÁSICOS (YA EXISTENTES)
// ------------------------------------------

/**
 * Endpoint para registrar un nuevo administrador (tabla "medico").
 */
router.post('/register/admin', async (req, res) => {
  try {
    const { user, password, nombreMedico, cedulaMedico, codigoMedico, permiso, empresa } = req.body;

    if (!user || !password || !nombreMedico || !cedulaMedico) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo registro en "medico"
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

    return res.json({ message: 'Administrador registrado exitosamente', id: nuevoMedico.idmedico });
  } catch (error) {
    console.error('Error en registro admin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * Endpoint para registrar un nuevo doctor (tabla "doctor2").
 * (Dejo tu lógica tal cual, si así lo usas)
 */
router.post('/register/doctor', async (req, res) => {
  try {
    const { userDoc, passDoc, nomDoctor2, estadoDoctor2 } = req.body;
    if (!userDoc || !passDoc || !nomDoctor2) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }
    const hashedPassword = await bcrypt.hash(passDoc, 10);

    const newDoctor = await prisma.doctor2.create({
      data: {
        nomDoctor2,
        estadoDoctor2: estadoDoctor2 || 'activo',
        userDoc,
        passDoc: hashedPassword
      }
    });

    return res.json({ message: 'Doctor registrado exitosamente', id: newDoctor.idDoctor2 });
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

  // Validación de credenciales
  if (!user || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    // Verifica si la variable de entorno JWT_SECRET está configurada
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no definido en entorno');
      return res.status(500).json({ error: 'Configuración del servidor inválida' });
    }

    // Busca al administrador en la base de datos
    const admin = await prisma.medico.findFirst({ where: { user } });
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verifica la contraseña
    const passwordValid = await bcrypt.compare(password, admin.pass);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Genera el token JWT
    const token = jwt.sign(
      { id: admin.idmedico, role: admin.permiso },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Devuelve el token y los datos del usuario
    return res.json({
      token,
      user: {
        id: admin.idmedico,
        nombre: admin.nombreMedico,
        permiso: admin.permiso,
        codigoMedico: admin.codigoMedico,
      },
    });
  } catch (error) {
    console.error(`[LOGIN ERROR] ${new Date().toISOString()} - Error en login admin:`, error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * Endpoint de login para Doctor (tabla "doctor2")
 */
router.post('/doctor', async (req, res) => {
  const { user, password } = req.body;
  try {
    const doctor = await prisma.doctor2.findFirst({ where: { userDoc: user } });
    if (!doctor) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const passwordValid = await bcrypt.compare(password, doctor.passDoc);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
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

// ------------------------------------------
// CRUD DE USUARIOS (tabla "medico")
// ------------------------------------------

/**
 * GET /api/auth/usuarios
 * Devuelve todos los usuarios (tabla "medico")
 */
router.get('/usuarios', async (req, res) => {
  try {
    const medicos = await prisma.medico.findMany({
      select: {
        idmedico: true,
        nombreMedico: true,
        cedulaMedico: true,
        codigoMedico: true, // iniciales
        user: true,
        pass: true,
        permiso: true,
        empresa: true
      }
    });
    res.json(medicos);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
/**
 * POST /api/auth/usuarios
 * Crear un nuevo usuario en tabla "medico"
 */
router.post('/usuarios', async (req, res) => {
  try {
    const {
      nombreMedico,
      cedulaMedico,
      codigoMedico,  // iniciales
      user,
      pass,
      permiso,
      empresa
    } = req.body;

    // Validación básica de campos requeridos
    if (!nombreMedico || !cedulaMedico || !user || !pass) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(pass, 10);

    // Crear el nuevo usuario en la tabla "medico"
    const nuevo = await prisma.medico.create({
      data: {
        nombreMedico,
        cedulaMedico,
        codigoMedico: codigoMedico || '',
        user,
        pass: hashedPassword,
        permiso: permiso || 'USUARIO',
        empresa: empresa || ''
      }
    });
    res.json({ message: 'Usuario creado', usuario: nuevo });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/auth/usuarios/:id
 * Actualizar un usuario existente
 */
router.put('/usuarios/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const {
      nombreMedico,
      cedulaMedico,
      codigoMedico,
      user,
      pass,
      permiso,
      empresa
    } = req.body;

    // Armamos el objeto de datos a actualizar
    let dataToUpdate = {
      nombreMedico,
      cedulaMedico,
      codigoMedico: codigoMedico || '',
      user,
      permiso,
      empresa
    };

    // Si se envía una nueva contraseña, la hasheamos y la incluimos en la actualización
    if (pass) {
      const hashedPassword = await bcrypt.hash(pass, 10);
      dataToUpdate.pass = hashedPassword;
    }

    const actualizado = await prisma.medico.update({
      where: { idmedico: id },
      data: dataToUpdate
    });
    res.json({ message: 'Usuario actualizado', usuario: actualizado });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/**
 * DELETE /api/auth/usuarios/:id
 * Eliminar un usuario (tabla "medico")
 */
router.delete('/usuarios/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const eliminado = await prisma.medico.delete({
      where: { idmedico: id }
    });
    res.json({ message: 'Usuario eliminado', usuario: eliminado });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
