// backend/routes/doctor.js
const express = require('express');
const router = express.Router();
const prisma = require("../../prisma/prismaClient");

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
      where: {
        idDoctor2: parseInt(idDoctor)  // Convertimos a número ya que los params vienen como string
      },
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

module.exports = router;