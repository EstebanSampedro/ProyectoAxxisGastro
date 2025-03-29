const prisma = require("../../prisma/prismaClient");
const Cita = require("../models/cita.model");
const ExcelJS = require("exceljs"); // <-- importamos exceljs


/**
 * Registrar una nueva cita
 */
const registerCita = async (req, res) => {
  try {
    const citaData = new Cita(req.body);
    const newCita = await prisma.cita.create({ data: citaData });
    res.json({ message: "Cita registrada exitosamente", cita: newCita });
  } catch (error) {
    console.error("Error al registrar cita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Filtrar citas por doctor y fecha
 */
const filterCitas = async (req, res) => {
  try {
    const { doctorId, fecha } = req.query;
    if (!doctorId || !fecha) {
      return res.status(400).json({ error: "doctorId y fecha son requeridos." });
    }

    const citas = await prisma.cita.findMany({
      where: {
        idDoctor_cita: parseInt(doctorId),
        fecha: new Date(fecha),
      },
      orderBy: { hora: "asc" },
    });

    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Filtrar citas por fecha
 */
const filterCitasByDate = async (req, res) => {
  try {
    const { fecha } = req.query;

    // Validar que la fecha esté presente
    if (!fecha) {
      return res.status(400).json({ error: "fecha es requerida." });
    }

    // Obtener citas filtradas por fecha
    const citas = await prisma.cita.findMany({
      where: {
        fecha: new Date(fecha), // Filtrar por fecha
      },
      orderBy: { hora: "asc" }, // Ordenar por hora ascendente
    });

    // Enviar la respuesta con las citas filtradas
    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


/**
 * Filtrar citas por fecha y torre
 */
const filterCitasByDateAndTower = async (req, res) => {
  try {
    const { fecha, torre } = req.query;

    // Validar que la fecha y la torre estén presentes
    if (!fecha || !torre) {
      return res.status(400).json({ error: "fecha y torre son requeridos." });
    }

    // Convertir torre a número entero
    const torreId = parseInt(torre, 10);

    // Validar que torre sea un número válido
    if (isNaN(torreId)) {
      return res.status(400).json({ error: "torre debe ser un número válido." });
    }

    // Obtener citas filtradas por fecha y torre
    const citas = await prisma.cita.findMany({
      where: {
        fecha: new Date(fecha), // Filtrar por fecha
        torre: torreId, // Filtrar por torre (convertido a número entero)
      },
      orderBy: { hora: "asc" }, // Ordenar por hora ascendente
    });

    // Enviar la respuesta con las citas filtradas
    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Obtener todas las citas
 */
const getAllCitas = async (req, res) => {
  try {
    const citas = await prisma.cita.findMany();
    res.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Editar una cita
 */
const updateCita = async (req, res) => {
  try {
    const idCita = parseInt(req.params.id);
    const citaData = new Cita(req.body);
    const updatedCita = await prisma.cita.update({
      where: { idCita },
      data: citaData,
    });

    res.json({ message: "Cita actualizada exitosamente", cita: updatedCita });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Eliminar una cita
 */
const deleteCita = async (req, res) => {
  try {
    const idCita = parseInt(req.params.id);
    const deletedCita = await prisma.cita.delete({
      where: { idCita },
    });

    res.json({ message: "Cita eliminada exitosamente", cita: deletedCita });
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const exportExcelCitas = async (req, res) => {
  try {
    // Se esperan los parámetros "fechaInicio" y "fechaFin" en formato YYYY-MM-DD
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Se requieren fechaInicio y fechaFin" });
    }

    // Realizar un query manual con JOIN para obtener el nombre del doctor (nomDoctor2)
    const citas = await prisma.$queryRaw`
      SELECT c.*, d.nomDoctor2
      FROM cita c
      LEFT JOIN doctor2 d ON c.idDoctor_cita = d.idDoctor2
      WHERE c.fecha >= ${new Date(fechaInicio)}
        AND c.fecha <= ${new Date(fechaFin)}
        AND c.estado <> 'eliminado'
      ORDER BY c.fecha ASC, c.hora ASC
    `;

    // Crear un nuevo workbook y hoja de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Respaldo Citas");

    // Definir las columnas (ajusta los anchos según necesites)
    worksheet.columns = [
      { header: "Tipo Cita", key: "tipoCita", width: 12 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Torre", key: "torre", width: 8 },
      { header: "Hora Inicia", key: "horaStr", width: 12 },
      { header: "Hora Termina", key: "horaFinStr", width: 12 },
      { header: "Doctor", key: "doctor", width: 20 },
      { header: "Paciente", key: "paciente", width: 25 },
      { header: "Edad", key: "edad", width: 5 },
      { header: "Teléfono", key: "telefono", width: 12 },
      { header: "Procedimiento", key: "procedimiento", width: 20 },
      { header: "Imagen", key: "imagen", width: 20 },
      { header: "Pedido", key: "pedido", width: 20 },
      { header: "Institución", key: "institucion", width: 20 },
      { header: "Seguro", key: "seguro", width: 15 },
      { header: "Observaciones", key: "observaciones", width: 25 },
      { header: "Observaciones 2", key: "observaciones2", width: 25 },
      { header: "Confirmado", key: "confirmado", width: 12 },
      { header: "Persona Confirmó", key: "codigoMedico", width: 15 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Color", key: "colorCita", width: 12 },
      { header: "Cédula", key: "cedula", width: 15 },
      { header: "Recordatorio", key: "recordatorioEnv", width: 12 }
    ];

    // Agregar una fila por cada cita
    citas.forEach((cita) => {
      // Convertir hora y fecha a formato deseado
      const horaStr = cita.hora ? new Date(cita.hora).toISOString().substring(11, 16) : "";
      const horaFinStr = cita.horaTermina ? new Date(cita.horaTermina).toISOString().substring(11, 16) : "";
      const fechaStr = cita.fecha ? new Date(cita.fecha).toISOString().split("T")[0] : "";

      worksheet.addRow({
        tipoCita: cita.tipoCita || "",
        fecha: fechaStr,
        torre: cita.torre,
        horaStr,
        horaFinStr,
        // Se asigna el nombre del doctor obtenido del JOIN
        doctor: cita.nomDoctor2 || "",
        paciente: cita.paciente,
        edad: cita.edad,
        telefono: cita.telefono,
        procedimiento: cita.procedimiento,
        imagen: cita.imagen,
        pedido: cita.pedido,
        institucion: cita.institucion,
        seguro: cita.seguro,
        observaciones: cita.observaciones,
        observaciones2: cita.observaciones2,
        confirmado: cita.confirmado,
        codigoMedico: cita.codigoMedico,
        estado: cita.estado,
        colorCita: cita.colorCita,
        cedula: cita.cedula,
        recordatorioEnv: cita.recordatorioEnv ? "Sí" : "No"
      });
    });

    // Configurar headers para la descarga del Excel
    const fileName = `respaldo-citas-${Date.now()}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Escribir el workbook en la respuesta y finalizar
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al exportar citas a Excel:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  registerCita,
  filterCitas,
  getAllCitas,
  updateCita,
  deleteCita,
  filterCitasByDate,
  filterCitasByDateAndTower,
  exportExcelCitas
};
