const express = require("express");
const {
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
  reagendarCita
} = require("../controllers/cita.controller");

const router = express.Router();

router.post("/register", registerCita);
router.get("/filter", filterCitas);
router.get("/", getAllCitas);
router.put("/:id", updateCita);
router.delete("/:id", deleteCita);
router.get("/byDate", filterCitasByDate);
router.get("/byDateAndTower", filterCitasByDateAndTower);
router.get("/exportExcel", exportExcelCitas);
router.get("/imprimir", exportImprimirPDF);
router.post("/confirmacion", createOrUpdateConfirmacion);
router.post('/logs', createLog);
router.patch("/:id/eliminar", softDeleteCita);
router.patch('/:id/reagendar', reagendarCita);





module.exports = router;
