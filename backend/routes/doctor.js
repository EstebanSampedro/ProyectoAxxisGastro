// backend/routes/doctor.js
const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET /api/doctores - Devuelve todos los doctores
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT idDoctor2, nomDoctor2, estadoDoctor2, userDoc FROM doctor2');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/doctores/:idDoctor - Devuelve un doctor por su ID
router.get('/:idDoctor', async (req, res) => {
  const { idDoctor } = req.params;
  try {
    const [rows] = await pool.query('SELECT idDoctor2, nomDoctor2, estadoDoctor2, userDoc FROM doctor2 WHERE idDoctor2 = ?', [idDoctor]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Doctor no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
