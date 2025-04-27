const express = require('express');
const authMiddleware = require("../../middleware/authMiddleware");
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

function toLocalDate(date) {
  // date es UTC; getTimezoneOffset es minutos que hay que sumar para llegar a UTC,
  // así que sumamos en lugar de restar
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}
router.use(authMiddleware);
router.get('/citas', async (req, res) => {
  try {
    const { from, to, doctorId, paciente } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "Los parámetros 'from' y 'to' son obligatorios." });
    }

    // Construimos las cláusulas WHERE y sus parámetros
    const whereParts = ['c.fecha BETWEEN ? AND ?'];
    const params = [new Date(from), new Date(to)];

    if (doctorId) {
      whereParts.push('c.idDoctor_cita = ?');
      params.push(parseInt(doctorId, 10));
    }
    if (paciente?.trim()) {
      whereParts.push('c.paciente LIKE ?');
      params.push(`%${paciente.trim()}%`);
    }
    const whereSQL = 'WHERE ' + whereParts.join(' AND ');

    const sql = `
      SELECT
        DATE_FORMAT(c.fecha,     '%Y-%m-%d') AS FECHA_CITA,
        DATE_FORMAT(c.hora,      '%H:%i')    AS HORA_CITA,
        c.torre                              AS TORRE,
        d.nomDoctor2                         AS DOCTOR,
        c.paciente                           AS PACIENTE,
        c.procedimiento                      AS PROCEDIMIENTO,
        medIng.codigoMedico                  AS INGRESA,
        DATE_FORMAT(c.fechaIng, '%Y-%m-%d')  AS FECHA_INGRESO,

        -- Aquí recuperamos el "si" / "no" / "pendiente"
        c.confirmado                         AS CONFIRMADA,

        -- Si confirmar OK mostramos quién… si no, vacío
        CASE WHEN conf.estado = 'confirmado'
             THEN medConfirma.codigoMedico
             ELSE ''
        END                                   AS CONFIRMA,

        CASE WHEN conf.estado = 'confirmado'
             THEN DATE_FORMAT(conf.fechaConfirma, '%Y-%m-%d')
             ELSE ''
        END                                   AS FECHA_CONFIRMA,

        -- Si denegado OK mostramos quién… si no, vacío
        CASE WHEN conf.estado = 'denegado'
             THEN medConfirma.codigoMedico
             ELSE ''
        END                                   AS CANCELA,

        CASE WHEN conf.estado = 'denegado'
             THEN DATE_FORMAT(conf.fechaConfirma, '%Y-%m-%d')
             ELSE ''
        END                                   AS FECHA_CANCELA,

        c.observaciones                      AS OBSERVACIONES

      FROM cita c
      LEFT JOIN medico      medIng      ON c.idResponsable_idMedico = medIng.idmedico
      LEFT JOIN doctor2     d           ON c.idDoctor_cita          = d.idDoctor2
      LEFT JOIN confirmacion conf       ON conf.fechaCita           = c.fecha
                                     AND conf.confDoctor         = c.idDoctor_cita
      LEFT JOIN medico      medConfirma ON conf.idMedicoConfirma    = medConfirma.idmedico
      ${whereSQL}
      ORDER BY c.fecha ASC, c.hora ASC
    `;

    const result = await prisma.$queryRawUnsafe(sql, ...params);
    res.json(result);
  } catch (err) {
    console.error("Error en historial de citas extendidas:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get('/modificaciones', async (req, res) => {
  try {
    const { from, to, doctorId } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "Los parámetros 'from' y 'to' son obligatorios." });
    }

    const params = [from, to];
    let extraFilter = '';
    if (doctorId) {
      extraFilter = ' AND c.idDoctor_cita = ?';
      params.push(parseInt(doctorId, 10));
    }

    const query = `
      SELECT
        DATE_FORMAT(c.fecha, '%Y-%m-%d')          AS FECHA_CITA,
        DATE_FORMAT(c.hora, '%H:%i')             AS HORA,
        c.torre                                  AS TORRE,
        d.nomDoctor2                             AS DOCTOR,
        c.paciente                               AS PACIENTE,
        l.tipoCambio                             AS MODIFICACION,
        -- aquí la conversión a UTC‑5 (Ecuador):
        DATE_FORMAT(
          CONVERT_TZ(l.fechaLog, '+00:00', '-05:00'),
          '%Y-%m-%d %H:%i:%s'
        )                                        AS FECHA_MODIFICACION,
        m.codigoMedico                           AS RESP,
        c.observaciones                          AS OBSERVACIONES
      FROM logs l
      JOIN cita c     ON c.idCita = l.cita_idCita
      LEFT JOIN doctor2 d  ON c.idDoctor_cita   = d.idDoctor2
      LEFT JOIN medico   m  ON l.medico_idMedico = m.idmedico
      WHERE DATE(l.fechaLog) BETWEEN ? AND ?
      ${extraFilter}
      ORDER BY l.fechaLog DESC
    `;

    const rows = await prisma.$queryRawUnsafe(query, ...params);
    res.json(rows);
  } catch (error) {
    console.error("Error en historial de modificaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


/**
 * GET /api/historial/confirmaciones
 * Retorna el historial de confirmaciones.
 */
router.get('/confirmaciones', async (req, res) => {
  try {
    const { from, to, doctorId } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "Los parámetros 'from' y 'to' son obligatorios." });
    }

    // Preparamos los parámetros para el query
    const params = [from, to];
    let extraFilter = '';
    if (doctorId) {
      extraFilter = ' AND conf.confDoctor = ?';
      params.push(parseInt(doctorId, 10));
    }

    const sql = `
      SELECT
        -- Fecha de la cita (convertida a UTC‑5, aunque es solo fecha)
        DATE_FORMAT(
          CONVERT_TZ(conf.fechaCita, '+00:00', '-05:00'),
          '%Y-%m-%d'
        ) AS FECHA_CITA,
        -- Iniciales del responsable que confirmó
        m.nombreMedico AS RESPONSABLE,
        -- Fecha y hora de confirmación en UTC‑5
        DATE_FORMAT(
          CONVERT_TZ(conf.fechaConfirma, '+00:00', '-05:00'),
          '%Y-%m-%d %H:%i:%s'
        ) AS FECHA_CONFIRMACION
      FROM confirmacion AS conf
      JOIN cita AS c
        ON conf.confDoctor = c.idDoctor_cita
       AND DATE(conf.fechaCita) = DATE(c.fecha)
      JOIN medico AS m
        ON conf.idMedicoConfirma = m.idmedico
      WHERE conf.estado = 'confirmado'
        AND conf.fechaCita >= ?
        AND conf.fechaCita <= ?
        AND c.estado   <> 'eliminado'
        ${extraFilter}
      ORDER BY conf.fechaConfirma DESC
    `;

    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    return res.json(rows);
  } catch (error) {
    console.error("Error en historial de confirmaciones:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
