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


/**
 * Formatea la hora en formato HH:MM.
 * Toma la subcadena de la hora del valor ISO.
 */
function formatHora(fechaHora) {
  if (!fechaHora) return "";
  const isoStr = fechaHora instanceof Date ? fechaHora.toISOString() : fechaHora;
  return isoStr.substring(11, 16);
}

// Definición de columnas para la tabla (los anchos están en puntos)
const columns = [
  { header: "HORA",          width: 40  },
  { header: "MEDICO",        width: 100 },
  { header: "PACIENTE",      width: 100 },
  { header: "EDAD",          width: 30  },
  { header: "PROCEDIMI.",    width: 100 },
  { header: "IMAGEN",        width: 50  },
  { header: "SOLICITADO",    width: 100 },
  { header: "INSTITU.",      width: 60  },
  { header: "SEGURO",        width: 70  },
  { header: "RESP",          width: 30  },
  { header: "OBSERVACIONES", width: 120 },
];

/**
 * Dibuja una celda: primero dibuja el rectángulo y luego coloca el texto dentro con un pequeño margen.
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
 * Dibuja una fila de la tabla. La altura de la fila se ajusta según el contenido de la última columna.
 * Retorna la nueva posición Y para la siguiente fila.
 */
function drawRow(doc, startX, startY, rowData) {
  const lastColIndex = columns.length - 1;
  const lastColWidth = columns[lastColIndex].width;
  const lastColText = rowData[lastColIndex] || "";
  
  // Calcular la altura necesaria para la última columna (MultiCell)
  doc.font("Helvetica").fontSize(8);
  const neededHeight = doc.heightOfString(lastColText, { width: lastColWidth - 4 });
  
  // Altura mínima para las otras columnas (puedes ajustar)
  const baseHeight = 15;
  const rowHeight = Math.max(baseHeight, neededHeight + 4);
  
  let currentX = startX;
  // Dibujar cada celda de la fila
  for (let i = 0; i < columns.length; i++) {
    const colWidth = columns[i].width;
    const text = rowData[i] || "";
    // Para la última columna, usamos el rowHeight calculado
    drawCell(doc, currentX, startY, colWidth, rowHeight, text, 6, i === 0 ? "center" : "left");
    currentX += colWidth;
  }
  return startY + rowHeight;
}

/**
 * Función que genera el PDF mostrando TODOS los registros para la fecha indicada.
 * Se recorren las torres del 1 al 4.
 */
async function exportImprimirPDF(req, res) {
  try {
    const { f } = req.query;
    if (!f) {
      return res.status(400).json({ error: "Se requiere la fecha (f)" });
    }
    const fecha = f; // p.ej. "2025-04-28"
    
    // Rango de fecha: desde el inicio del día hasta antes del siguiente
    const startDate = new Date(fecha);
    const endDate = new Date(fecha);
    endDate.setDate(endDate.getDate() + 1);

    // Consulta la confirmación para el día (si existe)
    const confirmacionResult = await prisma.$queryRaw`
      SELECT c.*, m.nombreMedico
      FROM confirmacion c
      INNER JOIN medico m ON c.idMedicoConfirma = m.idmedico
      WHERE c.fechaCita = ${fecha}
    `;
    const confirmacion = confirmacionResult[0] || {};

    // Crear el documento PDF en orientación landscape (A4)
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 20 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="respaldo-citas-${fecha}.pdf"`);
    doc.pipe(res);

    // ----------------- ENCABEZADO -----------------
    // Logo (imagen desde el backend, asegúrate de que la ruta sea correcta)
    const imagePath = path.join(__dirname, "../public/images/axxis-gastro.png");
    doc.image(imagePath, 20, 10, { width: 40 });
    
    // Título
    doc.font("Helvetica-Bold").fontSize(16).text("PROGRAMACION DE PROCEDIMIENTOS", 70, 10);
    
    // Día y fecha en celdas a la derecha (simulando FPDF)
    const fechaObj = new Date(fecha);
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayName = dias[fechaObj.getDay()] || "";


    // Celda para el día
    //doc.rect(400, 10, 45, 15).stroke();
    doc.font("Helvetica").fontSize(14).text(dayName.toUpperCase(), 400, 10, { width: 100, align: "center" });
    // Celda para la fecha
    //doc.rect(460, 10, 45, 15).stroke();
    doc.text(fecha, 460, 10, { width: 180, align: "center" });
    
    // Espacio para la tabla
    doc.moveDown();
    doc.y = 40; // posición inicial de la tabla

    // ----------------- TABLA POR TORRE -----------------
    for (let k = 1; k < 5; k++) {
      // Consulta: todos los registros para la torre k en el día
      const citas = await prisma.$queryRaw`
        SELECT c.*, m.nombreMedico as nomMedico, d.nomDoctor2 as nomDoctor
        FROM cita c
        LEFT JOIN medico m ON c.idResponsable_idMedico = m.idmedico
        LEFT JOIN doctor2 d ON c.idDoctor_cita = d.idDoctor2
        WHERE c.torre = ${k}
          AND c.fecha >= ${startDate} AND c.fecha < ${endDate}
        ORDER BY c.hora ASC
      `;
      console.log(`Torre ${k} - Registros:`, citas);

      // Si hay registros para esta torre, se dibuja la tabla
      if (citas.length > 0) {
        // Título de la torre
        const confTorre = confirmacion[`confTorre${k}`] || "";
        const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
        doc.font("Helvetica-Bold")
     .fontSize(10)
     .text(`TORRE ${k}  -  ${confTorre}`, 20, doc.y, { width: tableWidth, align: "center" });
  doc.moveDown(0.5);
        
        // Encabezado de la tabla
        let startX = 20;
        let startY = 50;
        const headerHeight = 15;
        doc.font("Helvetica-Bold").fontSize(8);
        let tmpX = startX;
        for (const col of columns) {
          doc.rect(tmpX, startY, col.width, headerHeight).stroke();
          doc.text(col.header, tmpX + 2, startY + 4, { width: col.width - 4, align: "center" });
          tmpX += col.width;
        }
        // Actualizamos Y
        startY += headerHeight;
        doc.y = startY;
        
        // Filas de datos
        doc.font("Helvetica").fontSize(8);
        for (const fila of citas) {
          const rowData = [
            formatHora(fila.hora),               // HORA
            fila.nomDoctor || "",                // MEDICO
            fila.paciente || "",                 // PACIENTE
            fila.edad != null ? String(fila.edad) : "", // EDAD
            fila.procedimiento || "",            // PROC.
            fila.imagen || "",                   // IMAGEN
            fila.pedido || "",                   // SOLICITADO
            fila.institucion || "",              // INST.
            fila.seguro || "",                   // SEGURO
            fila.codigoMedico || "",             // RESP
            fila.observaciones || "",            // OBSERVACIONES
          ];
          // Dibuja la fila y actualiza la posición Y
          const newY = drawRow(doc, startX, doc.y, rowData);
          doc.y = newY;
        }
        // Salto de línea entre torres
        doc.moveDown(1);
      }
    }

      // ----------------- SECCIÓN DE FIRMAS -----------------
    // Dejamos espacio suficiente antes de las firmas
    doc.moveDown(5);
    const yFirmas = doc.y;
    // Dividimos la página en dos columnas para las firmas
    const pageWidth = doc.page.width;
    const colFirmaWidth = (pageWidth - 40) / 2; // 40 es el total de márgenes horizontales

    // Definimos un ancho menor para las líneas (por ejemplo, 70% del ancho de columna)
    const signatureLineWidth = colFirmaWidth * 0.5;

    // Para centrar la línea dentro de la columna, calculamos un offset:
    const offsetLeft = (colFirmaWidth - signatureLineWidth) / 2;

    // Línea de firma para la parte izquierda
    doc.moveTo(20 + offsetLeft, yFirmas)
      .lineTo(20 + offsetLeft + signatureLineWidth, yFirmas)
      .stroke();

    // Línea de firma para la parte derecha
    doc.moveTo(20 + colFirmaWidth + 20 + offsetLeft, yFirmas)
      .lineTo(20 + colFirmaWidth + 20 + offsetLeft + signatureLineWidth, yFirmas)
      .stroke();

    // Texto debajo de las líneas
    doc.font("Helvetica").fontSize(10);
    doc.text(`Responsable: ${confirmacion.nombreMedico || ""}`, 20, yFirmas + 5, {
      width: colFirmaWidth,
      align: "center",
    });
    doc.text("Aprobado por:", 20 + colFirmaWidth + 20, yFirmas + 5, {
      width: colFirmaWidth,
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}


module.exports = {
  registerCita,
  filterCitas,
  getAllCitas,
  updateCita,
  deleteCita,
  filterCitasByDate,
  filterCitasByDateAndTower,
  exportExcelCitas,
  exportImprimirPDF
};
