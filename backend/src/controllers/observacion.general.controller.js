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
 * Filtrar observaciones por doctor y fecha
 */
const filterObservaciones = async (req, res) => {
  try {
    const { doctorId, fecha } = req.query;
    if (!doctorId || !fecha) {
      return res.status(400).json({ error: "doctorId y fecha son requeridos." });
    }

    const observaciones = await prisma.observaciones.findMany({
      where: {
        docObser: parseInt(doctorId),
        fechaObser: new Date(fecha),
      },
      orderBy: { fechaObser: "asc" },
    });

    res.json(observaciones);
  } catch (error) {
    console.error("Error al obtener observaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};



/**
 * Filtrar observaciones por fecha y hacer JOIN con la tabla de doctores
 */
const filterObservacionesByDate = async (req, res) => {
  try {
    const { fecha } = req.query;

    // Validar que la fecha esté presente
    if (!fecha) {
      return res.status(400).json({ error: "fecha es requerido." });
    }

    // Obtener las observaciones con el JOIN a la tabla de doctores
    const observaciones = await prisma.observaciones.findMany({
      where: {
        fechaObser: new Date(fecha), // Filtrar por fecha
      },
      include: {
        doctor: { // Relación con la tabla doctor2
          select: {
            nomDoctor2: true, // Seleccionar solo el nombre del doctor
          },
        },
      },
      orderBy: { fechaObser: "asc" }, // Ordenar por fecha
    });

    // Formatear la respuesta para incluir el nombre del doctor
    const observacionesFormateadas = observaciones.map((obs) => ({
      ...obs,
      nomDoctor2: obs.doctor.nomDoctor2, // Agregar el nombre del doctor
    }));

    // Enviar la respuesta
    res.json(observacionesFormateadas);
  } catch (error) {
    console.error("Error al obtener observaciones:", error);
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
 * Editar una observación
 */
const updateObservacion = async (req, res) => {
  try {
    const idObservacion = parseInt(req.params.id);
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
    const idObservacion = parseInt(req.params.id);
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
  getAllObservaciones,
  updateObservacion,
  deleteObservacion,
  filterObservacionesByDate
};