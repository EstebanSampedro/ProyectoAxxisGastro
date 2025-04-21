// src/controllers/observacion.general.controller.js
const prisma = require("../../prisma/prismaClient");
const Observacion = require("../models/observacion.general.model");

/**
 * Registrar una nueva observación
 */
const registerObservacion = async (req, res) => {
  try {
    const observacionData = new Observacion(req.body);
    const newObservacion = await prisma.observaciones.create({ data: observacionData });
    res.json({ message: "Observación registrada exitosamente", observacion: newObservacion });
  } catch (error) {
    console.error("Error al registrar observación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Obtener todas las observaciones
 */
const getAllObservaciones = async (req, res) => {
  try {
    const observaciones = await prisma.observaciones.findMany();
    res.json(observaciones);
  } catch (error) {
    console.error("Error al obtener observaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


/**
 * Filtrar observaciones por doctor y fecha
 */
/**
 * Filtrar observaciones por doctor y fecha (rango de un día completo)
 */
const filterObservaciones = async (req, res) => {
  try {
    const { doctorId, fecha } = req.query;
    if (!doctorId || !fecha) {
      return res.status(400).json({ error: "doctorId y fecha son requeridos." });
    }

    // Partimos de "YYYY-MM-DD"
    const start = new Date(fecha);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fecha);
    end.setHours(23, 59, 59, 999);

    const observaciones = await prisma.observaciones.findMany({
      where: {
        docObser: parseInt(doctorId, 10),
        fechaObser: {
          gte: start,
          lte: end
        }
      },
      orderBy: { fechaObser: "asc" }
    });

    res.json(observaciones);
  } catch (error) {
    console.error("Error al obtener observaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


/**
 * Filtrar observaciones por fecha y hacer JOIN con la tabla de doctores
 * (para la pantalla de “Observaciones generales”)
 */
// src/controllers/observacion.general.controller.js
const filterObservacionesByDate = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: "fecha es requerido." });
    }

    // Con prisma.$queryRaw y template literal para parametrizar
    const observaciones = await prisma.$queryRaw`
      SELECT
        o.idObser,
        o.fechaObser,
        o.textObser,
        o.estado,
        o.docObser,
        d.nomDoctor2 AS nomDoctor2
      FROM observaciones AS o
      LEFT JOIN doctor2 AS d
        ON o.docObser = d.idDoctor2
      WHERE DATE(o.fechaObser) = ${fecha}
      ORDER BY o.fechaObser ASC;
    `;

    res.json(observaciones);
  } catch (error) {
    console.error("Error al obtener observaciones por fecha:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};



/**
 * Editar una observación
 */
const updateObservacion = async (req, res) => {
  try {
    const idObservacion = parseInt(req.params.id, 10);
    const observacionData = new Observacion(req.body);
    const updatedObservacion = await prisma.observaciones.update({
      where: { idObser: idObservacion },
      data: observacionData,
    });
    res.json({ message: "Observación actualizada exitosamente", observacion: updatedObservacion });
  } catch (error) {
    console.error("Error al actualizar observación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Eliminar una observación
 */
const deleteObservacion = async (req, res) => {
  try {
    const idObservacion = parseInt(req.params.id, 10);
    const deletedObservacion = await prisma.observaciones.delete({
      where: { idObser: idObservacion },
    });
    res.json({ message: "Observación eliminada exitosamente", observacion: deletedObservacion });
  } catch (error) {
    console.error("Error al eliminar observación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  registerObservacion,
  filterObservaciones,
  filterObservacionesByDate,
  getAllObservaciones,
  updateObservacion,
  deleteObservacion
};
