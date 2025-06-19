const prisma = require("../../prisma/prismaClient");
const Cita = require("../models/cita.model");
const ExcelJS = require("exceljs"); // <-- importamos exceljs
const puppeteer = require("puppeteer");
const path = require("path");
const PDFDocument = require("pdfkit");





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

// GET /api/citas/consultas
// Query params:
//   fecha=YYYY-MM-DD    (requerido)
//   doctorId=<número>   (requerido)
// Responde: { normal: Cita[], errors: Cita[] }
const getConsultasActive = async (req, res) => {
  try {
    const { fecha, doctorId, torre } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'fecha es requerida' });
    }
    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId es requerido' });
    }

    // Construimos el filtro básico
    const where = {
      fecha: new Date(fecha),
      tipoCita: 'consulta',
      estado: { not: 'eliminado' },
      idDoctor_cita: Number(doctorId),   // <-- ahora filtramos por doctor
    };
    if (torre) {
      where.torre = Number(torre);
    }

    // Traemos todas las consultas (incluye las de confirmado="error")
    const all = await prisma.cita.findMany({
      where,
      orderBy: { hora: 'asc' }
    });

    // Separamos las "normales" de las que tienen error
    const normal = all.filter(c => c.confirmado !== 'error');
    const errors = all.filter(c => c.confirmado === 'error');

    return res.json({ normal, errors });
  } catch (err) {
    console.error('Error al obtener consultas:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
/**
 * Filtrar citas activas, por fecha, doctorId y torre (opcional)
 * */
const getCitasActive = async (req, res) => {
  try {
    const { fecha, doctorId, torre } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'fecha es requerida' });
    }
    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId es requerido' });
    }

    // Construimos el filtro básico
    const where = {
      fecha: new Date(fecha),
      tipoCita: 'cita',
      estado: { not: 'eliminado' },
      idDoctor_cita: Number(doctorId),   // <-- ahora filtramos por doctor
    };
    if (torre) {
      where.torre = Number(torre);
    }

    // Traemos todas las citas (incluye las de confirmado="error")
    const all = await prisma.cita.findMany({
      where,
      orderBy: { hora: 'asc' }
    });

    // Separamos las "normales" de las que tienen error
    const normal = all.filter(c => c.confirmado !== 'error');
    const errors = all.filter(c => c.confirmado === 'error');

    return res.json({ normal, errors });
  } catch (err) {
    console.error('Error al obtener citas:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

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

const softDeleteCita = async (req, res) => {
  try {
    const idCita = parseInt(req.params.id, 10);
    const { medico_idMedico } = req.body;

    if (medico_idMedico == null) {
      return res
        .status(400)
        .json({ error: "medico_idMedico es requerido para eliminar." });
    }

    const citaEliminada = await prisma.cita.update({
      where: { idCita },
      data: {
        estado: "eliminado",
        idBorra_idMedico: Number(medico_idMedico),
      },
    });

    res.json({ message: "Cita marcada como eliminada", cita: citaEliminada });
  } catch (error) {
    console.error("Error al eliminar (soft) cita:", error);
    res.status(500).json({ error: "Error interno al eliminar cita" });
  }
};

/**
 * Crea o actualiza una confirmación de cita en la tabla `confirmacion`.
 */
const createOrUpdateConfirmacion = async (req, res) => {
  try {
    const {
      fechaCita,        // "YYYY-MM-DD" o Date
      idMedicoConfirma, // número
      confDoctor,       // número
      fechaConfirma,    // ISO string o Date
      estado,           // "confirmado"|"denegado"|"pendiente"
      torre             // número entero 1..4
    } = req.body;

    // Asegúrate de que 'torre' viene como número; si no, conviértelo:
    const torreNum = parseInt(torre, 10);

    // Calculamos los flags de cada torre (todos son obligatorios en el modelo)
    const confTorre1 = torreNum === 1 ? "OK" : "";
    const confTorre2 = torreNum === 2 ? "OK" : "";
    const confTorre3 = torreNum === 3 ? "OK" : "";
    const confTorre4 = torreNum === 4 ? "OK" : "";

    // Buscar si ya existe confirmación para este doctor y esta fecha
    const existente = await prisma.confirmacion.findFirst({
      where: {
        confDoctor: parseInt(confDoctor, 10),
        fechaCita: new Date(fechaCita)
      }
    });

    let resultado;
    if (existente) {
      // Actualizar
      resultado = await prisma.confirmacion.update({
        where: { idConfirmacion: existente.idConfirmacion },
        data: {
          idMedicoConfirma: parseInt(idMedicoConfirma, 10),
          fechaConfirma: new Date(fechaConfirma),
          estado,
          confTorre1,
          confTorre2,
          confTorre3,
          confTorre4
        }
      });
    } else {
      // Crear
      resultado = await prisma.confirmacion.create({
        data: {
          fechaCita: new Date(fechaCita),
          idMedicoConfirma: parseInt(idMedicoConfirma, 10),
          confDoctor: parseInt(confDoctor, 10),
          fechaConfirma: new Date(fechaConfirma),
          estado,
          confTorre1,
          confTorre2,
          confTorre3,
          confTorre4
        }
      });
    }

    return res.json(resultado);
  } catch (error) {
    console.error("Error en createOrUpdateConfirmacion:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

function toLocalDate(date) {
  // date es UTC; getTimezoneOffset es minutos que hay que sumar para llegar a UTC,
  // así que sumamos en lugar de restar
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

// POST /api/citas/logs
const createLog = async (req, res) => {
  try {
    const { cita_idCita, tipoCambio, medico_idMedico } = req.body;
    if (cita_idCita == null || !tipoCambio || medico_idMedico == null) {
      return res
        .status(400)
        .json({ error: "cita_idCita, tipoCambio y medico_idMedico son requeridos." });
    }

    // 1) Creamos el log en UTC
    const nuevoLog = await prisma.logs.create({
      data: {
        cita_idCita: Number(cita_idCita),
        tipoCambio: String(tipoCambio),
        medico_idMedico: Number(medico_idMedico),
        // fechaLog se asigna ahora en UTC automáticamente
      },
    });

    // 2) Ajustamos esa fecha a la zona local antes de devolverla
    const adjustedLog = {
      ...nuevoLog,
      fechaLog: toLocalDate(nuevoLog.fechaLog)
    };

    return res.json(adjustedLog);
  } catch (error) {
    console.error("Error creando log:", error);
    return res
      .status(500)
      .json({ error: "Error interno del servidor al crear log" });
  }
};


// RESPALDO EXCEL
const exportExcelCitas = async (req, res) => {
  try {
    // Se esperan los parámetros "fechaInicio" y "fechaFin" en formato YYYY-MM-DD
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Se requieren fechaInicio y fechaFin" });
    }

    // Realizar un query manual con JOIN para obtener el nombre del doctor (nomDoctor2)
    const citas = await prisma.$queryRaw`
      SELECT c.*, d.nomDoctor2, m.codigoMedico
      FROM cita c
      LEFT JOIN doctor2 d ON c.idDoctor_cita = d.idDoctor2
      LEFT JOIN medico m ON c.idResponsable_idMedico = m.idmedico
      WHERE c.fecha >= ${new Date(fechaInicio)}
        AND c.fecha <= ${new Date(fechaFin)}
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
      { header: "Responsable", key: "codigoMedico", width: 15 },
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


/**
 * Formatea la hora en formato HH:MM.
 * Toma la subcadena de la hora del valor ISO.
 */
/**
 * Devuelve “HH:mm” a partir de un objeto Date o ISO string.
 */
function formatHora(fechaHora) {
  if (!fechaHora) return "";
  const isoStr = fechaHora instanceof Date ? fechaHora.toISOString() : fechaHora;
  return isoStr.substring(11, 16);
}

// Definición de columnas para la tabla (los anchos están en puntos)
const columns = [
  { header: "HORA",         width: 40  },
  { header: "MEDICO",       width: 100 },
  { header: "PACIENTE",     width: 100 },
  { header: "EDAD",         width: 30  },
  { header: "PROCEDIMI.",   width: 100 },
  { header: "IMAGEN",       width: 50  },
  { header: "SOLICITADO",   width: 100 },
  { header: "INSTITU.",     width: 60  },
  { header: "SEGURO",       width: 70  },
  { header: "RESP",         width: 30  },
  { header: "OBSERVACIONES",width: 120 },
];

/**
 * Dibuja una celda (rectángulo + texto dentro).
 */
function drawCell(doc, x, y, w, h, text, fontSize = 8, align = "left") {
  doc.rect(x, y, w, h).stroke();
  const margin = 2;
  doc.fontSize(fontSize).text(text, x + margin, y + margin, {
    width: w - margin * 2,
    height: h - margin * 2,
    align,
  });
}

/**
 * Dibuja una fila de la tabla. Ajusta la altura según la columna de observaciones.
 * Devuelve la coordenada Y donde continuará la siguiente fila.
 */
function drawRow(doc, startX, startY, rowData) {
  const lastColIndex = columns.length - 1;
  const lastColWidth = columns[lastColIndex].width;
  const lastColText  = rowData[lastColIndex] || "";

  // Calcular altura necesaria para el texto de la última columna
  doc.font("Helvetica").fontSize(8);
  const neededHeight = doc.heightOfString(lastColText, {
    width: lastColWidth - 4
  });

  const baseHeight = 15;
  const rowHeight  = Math.max(baseHeight, neededHeight + 4);

  let currentX = startX;
  for (let i = 0; i < columns.length; i++) {
    const colWidth = columns[i].width;
    const text     = rowData[i] || "";
    drawCell(
      doc,
      currentX,
      startY,
      colWidth,
      rowHeight,
      text,
      6,
      i === 0 ? "center" : "left"
    );
    currentX += colWidth;
  }

  return startY + rowHeight;
}

/**
 * Dibuja la fila de encabezados (nombres de columnas) en la posición actual de doc.y.
 * Debe llamarse cada vez que comience una nueva página o al iniciar una torre.
 */
function drawTableHeader(doc, startX) {
  let x       = startX;
  const yHeader = doc.y;
  doc.font("Helvetica-Bold").fontSize(8);

  for (const col of columns) {
    doc.rect(x, yHeader, col.width, 15).stroke();
    doc.text(col.header, x + 2, yHeader + 4, {
      width: col.width - 4,
      align: "center"
    });
    x += col.width;
  }

  doc.y = yHeader + 15;
}

async function exportImprimirPDF(req, res) {
  try {
    const { f } = req.query;
    if (!f) {
      return res.status(400).json({ error: "Se requiere la fecha (f)" });
    }
    const fecha = f; // “YYYY-MM-DD”

    // Construir fecha local (sin desfase UTC)
    const [year, month, day] = fecha.split("-").map(Number);
    // Nota: aquí startDate/endDate solo se conservan en caso de que quieras usarlos,
    // pero en la consulta usamos DATE(c.fecha) = fecha, así que no son estrictamente necesarios.
    const startDate = new Date(year, month - 1, day);
    const endDate   = new Date(year, month - 1, day);
    endDate.setDate(endDate.getDate() + 1);

    // Consultar datos de confirmación global (confTorre1, confTorre2, …)
    const [confirmacion = {}] = await prisma.$queryRaw`
      SELECT c.*, m.nombreMedico
      FROM confirmacion c
      JOIN medico m ON c.idMedicoConfirma = m.idmedico
      WHERE c.fechaCita = ${fecha}
    `;

    // Iniciar PDF landscape A4
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margin: 20
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="respaldo-citas-${fecha}.pdf"`
    );
    doc.pipe(res);

    // ——— ENCABEZADO PRINCIPAL ———
    const pageWidth      = doc.page.width;
    const headerY        = 10;
    const logoSize       = 60;
    const boxW           = 80;
    const headerBoxX     = 10;
    const headerBoxY     = headerY - 5;
    const headerBoxWidth = pageWidth - 20;
    const headerBoxHeight= logoSize - 12;
    const headerFont     = "Helvetica-Oblique";

    // Dibujar recuadro del encabezado
    doc.rect(headerBoxX, headerBoxY, headerBoxWidth, headerBoxHeight).stroke();

    // Logo
    const logoPath = path.join(__dirname, "../public/images/axxis-gastro.png");
    doc.image(logoPath, 20, headerY, { width: logoSize });

    // Título centrado
    const title = "PROGRAMACIÓN DE PROCEDIMIENTOS";
    doc.font(headerFont).fontSize(20);
    const titleWidth = doc.widthOfString(title);
    doc.text(title, (pageWidth - titleWidth) / 2, headerY + 5);

    // Día de la semana (en zona local) + Fecha
    const dias      = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const localDate = new Date(year, month - 1, day);
    const dayName   = dias[localDate.getDay()] || "";
    const dayX      = pageWidth - boxW * 2 - 40;

    doc
      .font(headerFont)
      .fontSize(12)
      .text(dayName.toUpperCase(), dayX, headerY + 6, { width: boxW, align: "center" })
      .text(fecha, dayX + boxW + 10, headerY + 6, { width: boxW, align: "center" });

    doc.moveDown(2);

    // ——— TABLAS POR CADA TORRE ———
    for (let torre = 1; torre <= 4; torre++) {
      // Antes de dibujar el título de la torre, comprobamos si cabe en la página actual.
      const neededSpaceForTitle  = 20; // aprox. alto para el texto del título
      const neededSpaceForHeader = 20; // alto para dibujar encabezados de columna
      if (doc.y + neededSpaceForTitle + neededSpaceForHeader > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }

      // Título “Torre X – NOMBRE –” centrado
      const confT       = confirmacion[`confTorre${torre}`] || "";
      const filasConsulta = await prisma.$queryRaw`
        SELECT 
          c.idCita,
          c.hora,
          c.horaTermina,
          c.paciente,
          c.edad,
          c.telefono,
          c.procedimiento,
          c.imagen,
          c.pedido,
          c.institucion,
          c.seguro,
          c.confirmado,
          c.observaciones,
          d.nomDoctor2    AS nomDoctor,
          m.codigoMedico  AS codigoMedico,
          t.textTorre     AS nomTorre
        FROM cita c
        LEFT JOIN doctor2 d 
          ON d.idDoctor2 = c.idDoctor_cita
        LEFT JOIN medico m 
          ON m.idmedico = c.idConfirma_idMedico
        LEFT JOIN torres t 
          ON t.idTorre = c.torre
        WHERE
          c.torre          = ${torre}
          AND c.tipoCita     = 'cita'
          AND DATE(c.fecha) = ${fecha}
          AND c.confirmado   = 'si'
          AND c.estado     <> 'eliminado'
        ORDER BY c.hora;
      `;

      // Si no hay citas válidas para esta torre, saltamos a la siguiente
      if (!filasConsulta.length) continue;

      const torreNombre = filasConsulta[0]?.nomTorre || `TORRE ${torre}`;
      const tableW = columns.reduce((sum, col) => sum + col.width, 0);

      doc.font("Helvetica-Bold").fontSize(10)
         .text(`${torreNombre}  –  ${confT}`, 20, doc.y, {
           width: tableW,
           align: "center"
         });
      doc.moveDown(0.5);

      // Antes de pintar los encabezados de columnas, volvemos a verificar si cabe completo:
      if (doc.y + neededSpaceForHeader > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        // Re-dibujar título de la misma torre en la nueva página
        doc.font("Helvetica-Bold").fontSize(10)
           .text(`${torreNombre}  –  ${confT}`, 20, doc.y, {
             width: tableW,
             align: "center"
           });
        doc.moveDown(0.5);
      }

      // Dibujar encabezados de columnas
      drawTableHeader(doc, 20);

      // Ahora recorremos cada fila (cita) y la pintamos, chequeando saltos de página
      for (const fila of filasConsulta) {
        // Aproximamos la altura mínima de la siguiente fila
        const approximateRowHeight = 20;
        if (doc.y + approximateRowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          // En la nueva página, volver a dibujar encabezados:
          drawTableHeader(doc, 20);
        }

        const row = [
          formatHora(fila.hora),
          fila.nomDoctor    || "",
          fila.paciente     || "",
          fila.edad != null ? String(fila.edad) : "",
          fila.procedimiento|| "",
          fila.imagen       || "",
          fila.pedido       || "",
          fila.institucion  || "",
          fila.seguro       || "",
          fila.codigoMedico || "",   // “RESP”
          fila.observaciones|| ""
        ];
        doc.y = drawRow(doc, 20, doc.y, row);
      }

      // Espacio extra antes de la siguiente torre
      doc.moveDown(1);
    }

    // ——— FIRMAS FINALES ———
    // Antes de dibujar las líneas de firma, comprobamos si cabe en la página
    const bottomSpaceNeeded = 40;
    if (doc.y + bottomSpaceNeeded > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
    doc.moveDown(5);

    const y0 = doc.y;
    const pageW2 = doc.page.width;
    const colW   = (pageW2 - 40) / 2;
    const lineW  = colW * 0.5;
    const off    = (colW - lineW) / 2;

    doc.moveTo(20 + off, y0).lineTo(20 + off + lineW, y0).stroke();
    doc.moveTo(20 + colW + 20 + off, y0).lineTo(20 + colW + 20 + off + lineW, y0).stroke();

    doc.font("Helvetica").fontSize(10)
      .text(`Responsable: ${confirmacion.nombreMedico || ""}`, 20, y0 + 5, {
        width: colW,
        align: "center"
      })
      .text("Aprobado por:", 20 + colW + 20, y0 + 5, {
        width: colW,
        align: "center"
      });

    doc.end();
  } catch (err) {
    console.error("Error generando PDF:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}


const { DateTime } = require('luxon');

const reagendarCita = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { fecha, torre, hora, horaTermina } = req.body;

    if (!fecha || !torre || !hora) {
      return res.status(400).json({ error: 'fecha, torre y hora son obligatorios' });
    }

    const citaActual = await prisma.cita.findUnique({
      where: { idCita: id },
      select: { horaTermina: true }
    });
    if (!citaActual) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const zona = 'America/Guayaquil';

    // 1. Crear DateTime directamente en la zona de Guayaquil
    // Asumimos que fecha viene como "YYYY-MM-DD" y hora como "HH:mm" o "HH:mm:ss"
    const fechaHoraStr = `${fecha}T${hora.padEnd(8, ':00')}`;
    const dtInicio = DateTime.fromISO(fechaHoraStr, { zone: zona });

    // 2. Calcular hora de término
    const dtTermina = horaTermina
      ? DateTime.fromISO(`${fecha}T${horaTermina.padEnd(8, ':00')}`, { zone: zona })
      : dtInicio.plus({ minutes: 30 });

    // 3. Validar que los DateTime sean válidos
    if (!dtInicio.isValid) {
      return res.status(400).json({
        error: `Fecha/hora de inicio inválida: ${dtInicio.invalidExplanation}`
      });
    }
    if (!dtTermina.isValid) {
      return res.status(400).json({
        error: `Fecha/hora de término inválida: ${dtTermina.invalidExplanation}`
      });
    }

    // 4. Convertir a formato para MySQL/Prisma
    // Para el campo fecha (DATE)
    const fechaMySQL = DateTime.fromISO(fecha).toJSDate();

    // Para los campos hora y horaTermina - crear DateTime SIN zona horaria para evitar conversiones
    // Usamos UTC para que no haya conversiones automáticas
    const baseDate = '1970-01-01';
    const horaDateTime = new Date(`${baseDate}T${dtInicio.toFormat('HH:mm:ss')}Z`);
    const horaTerminaDateTime = new Date(`${baseDate}T${dtTermina.toFormat('HH:mm:ss')}Z`);

    console.log('REAGENDAMIENTO ------- Datos procesados:', {
      fechaOriginal: fecha,
      horaOriginal: hora,
      fechaMySQL: fechaMySQL,
      horaDateTime: horaDateTime,
      horaTerminaDateTime: horaTerminaDateTime,
      dtInicio: dtInicio.toISO(),
      dtTermina: dtTermina.toISO()
    });

    const data = {
      fecha: fechaMySQL,
      torre: Number(torre),
      hora: horaDateTime,
      horaTermina: horaTerminaDateTime,
      confirmado: 'pendiente'
    };

    const updated = await prisma.cita.update({
      where: { idCita: id },
      data
    });

    res.json(updated);
  } catch (err) {
    console.error('Error reagendando cita:', err);
    res.status(500).json({ error: 'Error interno al reagendar cita' });
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
  exportExcelCitas,
  exportImprimirPDF,
  createOrUpdateConfirmacion,
  createLog,
  softDeleteCita,
  reagendarCita,
  getCitasActive,
  getConsultasActive
};