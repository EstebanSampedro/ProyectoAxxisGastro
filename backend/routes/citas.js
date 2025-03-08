// backend/routes/citas.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --------------------------
// Endpoint para registrar una nueva cita
router.post('/register', async (req, res) => {
  try {
    const {
      idDoctor_cita,
      fecha,         // formato: "YYYY-MM-DD"
      torre,
      hora,          // formato: "HH:mm:ss"
      horaTermina,   // formato: "HH:mm:ss"
      paciente,
      edad,
      telefono,
      procedimiento,
      imagen,
      pedido,
      institucion,
      seguro,
      estado,        // por ejemplo "activo"
      confirmado,    // "si", "no" o "pendiente"
      observaciones,
      observaciones2,
      colorCita
    } = req.body;

    // Convertir las cadenas de hora a objetos Date usando una fecha base (por ejemplo, 1970-01-01)
    const horaDate = new Date(`1970-01-01T${hora}Z`);
    const horaTerminaDate = new Date(`1970-01-01T${horaTermina}Z`);

    // Crear la nueva cita usando Prisma
    const newCita = await prisma.cita.create({
      data: {
        idDoctor_cita,
        fecha: new Date(fecha),
        torre,
        hora: horaDate,
        horaTermina: horaTerminaDate,
        paciente,
        edad,
        telefono,
        procedimiento,
        imagen: imagen || "",
        pedido: pedido || "",
        institucion: institucion || "",
        seguro: seguro || "",
        estado,
        confirmado, // Se asume que el valor es uno de 'si', 'no' o 'pendiente'
        observaciones: observaciones || "",
        observaciones2: observaciones2 || "",
        colorCita
      }
    });

    return res.json({ message: 'Cita registrada exitosamente', cita: newCita });
  } catch (error) {
    console.error('Error al registrar cita:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --------------------------
// Endpoint para filtrar citas por doctor y fecha
router.get('/filter', async (req, res) => {
  try {
    const { doctorId, fecha } = req.query;
    if (!doctorId || !fecha) {
      return res.status(400).json({ error: 'Faltan parámetros: doctorId y fecha son requeridos.' });
    }
    const citas = await prisma.cita.findMany({
      where: {
        idDoctor_cita: parseInt(doctorId.toString()),
        fecha: new Date(fecha.toString())
      },
      orderBy: {
        hora: 'asc'
      }
    });
    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas filtradas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --------------------------
// (Opcional) Endpoint para obtener todas las citas
router.get('/', async (req, res) => {
  try {
    const citas = await prisma.cita.findMany();
    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --------------------------
// Nuevo Endpoint: Obtener observaciones para un doctor en una fecha
router.get('/observaciones', async (req, res) => {
  try {
    const { doctorId, fecha } = req.query;
    if (!doctorId || !fecha) {
      return res.status(400).json({ error: 'Faltan parámetros: doctorId y fecha son requeridos.' });
    }
    const obs = await prisma.observaciones.findFirst({
      where: {
        docObser: parseInt(doctorId.toString()),
        fechaObser: new Date(fecha.toString())
      }
    });
    // Devolvemos un objeto con la propiedad 'observaciones'
    if (obs) {
      res.json({ observaciones: obs.textObser });
    } else {
      res.json({ observaciones: '' });
    }
  } catch (error) {
    console.error('Error al obtener observaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Nuevo Endpoint: Guardar (crear o actualizar) observaciones para un doctor en una fecha
router.post('/observaciones', async (req, res) => {
  try {
    const { doctorId, fecha, observaciones } = req.body;
    if (!doctorId || !fecha) {
      return res.status(400).json({ error: 'Faltan parámetros: doctorId y fecha son requeridos.' });
    }
    // Verificar si ya existe un registro para ese doctor y fecha
    const existingObs = await prisma.observaciones.findFirst({
      where: {
        docObser: parseInt(doctorId.toString()),
        fechaObser: new Date(fecha.toString())
      }
    });
    let obs;
    if (existingObs) {
      // Actualizar registro existente
      obs = await prisma.observaciones.update({
        where: { idObser: existingObs.idObser },
        data: {
          textObser: observaciones,
          estado: 'activo'
        }
      });
    } else {
      // Crear un nuevo registro
      obs = await prisma.observaciones.create({
        data: {
          fechaObser: new Date(fecha.toString()),
          textObser: observaciones,
          estado: 'activo',
          docObser: parseInt(doctorId.toString())
        }
      });
    }
    res.json({ message: 'Observaciones guardadas', observaciones: obs });
  } catch (error) {
    console.error('Error al guardar observaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
