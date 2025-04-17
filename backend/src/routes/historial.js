const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/prismaClient');

/**
 * GET /api/historial/citas
 * Retorna un listado de citas con campos extensos (formateados):
 * FECHA_CITA, HORA_CITA, TORRE, DOCTOR, PACIENTE, PROCEDIMIENTO,
 * INGRESA, FECHA_INGRESO, CONFIRMADA, CONFIRMA, FECHA_CONFIRMA,
 * CANCELA, FECHA_CANCELA, OBSERVACIONES.
 *
 * Parámetros de query:
 *  - from: fecha de inicio (obligatorio)
 *  - to: fecha fin (obligatorio)
 *  - doctorId: ID del doctor (opcional)
 *  - paciente: parte del nombre del paciente (opcional)
 */
router.get('/citas', async (req, res) => {
  try {
    const { from, to, doctorId, paciente } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "Los parámetros 'from' y 'to' son obligatorios." });
    }

    // Armar cláusulas de filtro
    const whereClauses = [];
    const params = [];

    // Filtro de fechas: c.fecha se formatea a fecha sin hora (YYYY-MM-DD)
    whereClauses.push(`c.fecha >= ? AND c.fecha <= ?`);
    params.push(new Date(from), new Date(to));

    if (doctorId) {
      whereClauses.push(`c.idDoctor_cita = ?`);
      params.push(parseInt(doctorId));
    }

    if (paciente && paciente.trim() !== '') {
      whereClauses.push(`c.paciente LIKE ?`);
      params.push(`%${paciente.trim()}%`);
    }

    let whereStr = '';
    if (whereClauses.length > 0) {
      whereStr = 'WHERE ' + whereClauses.join(' AND ');
    }

    const query = `
      SELECT
        DATE_FORMAT(c.fecha, '%Y-%m-%d') AS FECHA_CITA,
        DATE_FORMAT(c.hora, '%H:%i') AS HORA_CITA,
        c.torre AS TORRE,
        d.nomDoctor2 AS DOCTOR,
        c.paciente AS PACIENTE,
        c.procedimiento AS PROCEDIMIENTO,
        medIng.codigoMedico AS INGRESA,
        DATE_FORMAT(c.fechaIng, '%Y-%m-%d') AS FECHA_INGRESO,
        c.confirmado AS CONFIRMADA,
        medConfirma.codigoMedico AS CONFIRMA,
        DATE_FORMAT(conf.fechaConfirma, '%Y-%m-%d') AS FECHA_CONFIRMA,
        CASE WHEN conf.estado = 'no' THEN medConfirma.codigoMedico ELSE '' END AS CANCELA,
        CASE WHEN conf.estado = 'no' THEN DATE_FORMAT(conf.fechaConfirma, '%Y-%m-%d') ELSE '' END AS FECHA_CANCELA,
        c.observaciones AS OBSERVACIONES
      FROM cita c
      LEFT JOIN medico medIng ON c.idResponsable_idMedico = medIng.idmedico
      LEFT JOIN doctor2 d ON c.idDoctor_cita = d.idDoctor2
      LEFT JOIN confirmacion conf ON conf.fechaCita = c.fecha AND conf.confDoctor = c.idDoctor_cita
      LEFT JOIN medico medConfirma ON conf.idMedicoConfirma = medConfirma.idmedico
      ${whereStr}
      ORDER BY c.fecha ASC, c.hora ASC
    `;

    // Ejecuta la consulta cruda usando $queryRawUnsafe (usa placeholders para evitar inyección)
    const rows = await prisma.$queryRawUnsafe(query, ...params);
    return res.json(rows);
  } catch (error) {
    console.error("Error en historial de citas extendidas:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * GET /api/historial/modificaciones
 * Retorna el historial de modificaciones (logs) de las citas.
 */
router.get('/modificaciones', async (req, res) => {
  try {
    const logs = await prisma.logs.findMany({
      orderBy: { fechaLog: 'desc' }
    });
    return res.json(logs);
  } catch (error) {
    console.error("Error en historial de modificaciones:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * GET /api/historial/confirmaciones
 * Retorna el historial de confirmaciones.
 */
router.get('/confirmaciones', async (req, res) => {
  try {
    const confirmaciones = await prisma.confirmacion.findMany({
      orderBy: { fechaConfirma: 'desc' }
    });
    return res.json(confirmaciones);
  } catch (error) {
    console.error("Error en historial de confirmaciones:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
