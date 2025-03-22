const express = require('express');
const {
  getAllTorres,
  getTorreById,
  createTorre,
  updateTorre,
  deleteTorre,
} = require('../controllers/torre.controller');

const router = express.Router();

// Ruta para obtener todas las torres
router.get('/', getAllTorres);

// Ruta para obtener una torre por ID
router.get('/:id', getTorreById);

// Ruta para crear una nueva torre
router.post('/register', createTorre);

// Ruta para actualizar una torre existente
router.put('/:id', updateTorre);

// Ruta para eliminar una torre
router.delete('/:id', deleteTorre);

module.exports = router;