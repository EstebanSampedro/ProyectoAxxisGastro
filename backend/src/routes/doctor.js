// backend/routes/doctor.js
const express = require('express');
const router = express.Router();
const prisma = require("../../prisma/prismaClient");
const bcrypt = require('bcrypt');
const authMiddleware = require("../../middleware/authMiddleware");

// Apply authMiddleware to all routes
router.use(authMiddleware);
// GET /api/doctores - Devuelve todos los doctores
router.get('/', async (req, res) => {
  try {
    const doctors = await prisma.doctor2.findMany({
      select: {
        idDoctor2: true,
        nomDoctor2: true,
        estadoDoctor2: true,
        userDoc: true
      }
    });
    res.json(doctors);
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/doctores/:idDoctor - Devuelve un doctor por su ID
router.get('/:idDoctor', async (req, res) => {
  const { idDoctor } = req.params;
  try {
    const doctor = await prisma.doctor2.findUnique({
      where: { idDoctor2: parseInt(idDoctor) },
      select: {
        idDoctor2: true,
        nomDoctor2: true,
        estadoDoctor2: true,
        userDoc: true
      }
    });
    if (doctor) {
      res.json(doctor);
    } else {
      res.status(404).json({ error: 'Doctor no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/doctores - Crear un nuevo doctor
router.post('/', async (req, res) => {
  try {
    const { userDoc, passDoc, nomDoctor2, estadoDoctor2 } = req.body;
    // Validación de campos requeridos
    if (!userDoc || !passDoc || !nomDoctor2) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }
    // Generar el hash de la contraseña
    const hashedPassword = await bcrypt.hash(passDoc, 10);
    const newDoctor = await prisma.doctor2.create({
      data: {
        userDoc,
        passDoc: hashedPassword,
        nomDoctor2,
        estadoDoctor2: estadoDoctor2 || 'activo'
      }
    });
    res.json({ message: 'Doctor registrado exitosamente', doctor: newDoctor });
  } catch (error) {
    console.error('Error al crear doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/doctores/:idDoctor - Actualizar un doctor
router.put('/:idDoctor', async (req, res) => {
  const { idDoctor } = req.params;
  try {
    const { userDoc, nomDoctor2, estadoDoctor2 } = req.body;
    const updatedDoctor = await prisma.doctor2.update({
      where: { idDoctor2: parseInt(idDoctor) },
      data: {
        userDoc,
        nomDoctor2,
        estadoDoctor2: estadoDoctor2 || 'activo'
      }
    });
    res.json({ message: 'Doctor actualizado exitosamente', doctor: updatedDoctor });
  } catch (error) {
    console.error('Error al actualizar doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/doctores/:idDoctor - Eliminar un doctor
router.delete('/:idDoctor', async (req, res) => {
  const { idDoctor } = req.params;
  try {
    const deletedDoctor = await prisma.doctor2.delete({
      where: { idDoctor2: parseInt(idDoctor) }
    });
    res.json({ message: 'Doctor eliminado exitosamente', doctor: deletedDoctor });
  } catch (error) {
    console.error('Error al eliminar doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
