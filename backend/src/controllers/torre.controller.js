// controllers/torre.controller.js
const prisma = require("../../prisma/prismaClient");
const Torre = require('../models/torre.model');

/**
 * Obtener todas las torres.
 */
const getAllTorres = async (req, res) => {
  try {
    // Obtener todas las torres de la base de datos
    const torres = await prisma.torres.findMany();
    // Estructurar los datos usando el modelo Torre
    const torresEstructuradas = torres.map((torre) => new Torre(torre));
    res.status(200).json(torresEstructuradas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener una torre por ID.
 */
const getTorreById = async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar la torre en la base de datos
    const torre = await prisma.torres.findUnique({
      where: { idTorre: parseInt(id) },
    });
    if (!torre) {
      return res.status(404).json({ error: 'Torre no encontrada' });
    }
    // Estructurar los datos usando el modelo Torre
    const torreEstructurada = new Torre(torre);
    res.status(200).json(torreEstructurada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear una nueva torre.
 */
const createTorre = async (req, res) => {
  try {
    const { textTorre } = req.body;
    if (!textTorre) {
      return res.status(400).json({ error: 'textTorre es requerido' });
    }
    // Crear la torre en la base de datos
    const nuevaTorre = await prisma.torres.create({
      data: { textTorre },
    });
    // Estructurar los datos usando el modelo Torre
    const torreEstructurada = new Torre(nuevaTorre);
    res.status(201).json(torreEstructurada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar una torre existente.
 */
const updateTorre = async (req, res) => {
  try {
    const { id } = req.params;
    const { textTorre } = req.body;
    if (!textTorre) {
      return res.status(400).json({ error: 'textTorre es requerido' });
    }
    // Actualizar la torre en la base de datos
    const torreActualizada = await prisma.torres.update({
      where: { idTorre: parseInt(id) },
      data: { textTorre },
    });
    // Estructurar los datos usando el modelo Torre
    const torreEstructurada = new Torre(torreActualizada);
    res.status(200).json(torreEstructurada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Eliminar una torre.
 */
const deleteTorre = async (req, res) => {
  try {
    const { id } = req.params;
    // Eliminar la torre de la base de datos
    await prisma.torres.delete({
      where: { idTorre: parseInt(id) },
    });
    res.status(204).send(); // Respuesta sin contenido
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTorres,
  getTorreById,
  createTorre,
  updateTorre,
  deleteTorre,
};