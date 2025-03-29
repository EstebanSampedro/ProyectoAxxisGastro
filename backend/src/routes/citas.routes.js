const express = require("express");
const {
  registerCita,
  filterCitas,
  getAllCitas,
  updateCita,
  deleteCita,
  filterCitasByDate,
  filterCitasByDateAndTower,
  exportExcelCitas 
} = require("../controllers/cita.controller");

const router = express.Router();

router.post("/register", registerCita);
router.get("/filter", filterCitas);
router.get("/", getAllCitas);
router.put("/:id", updateCita);
router.delete("/:id", deleteCita);
router.get("/byDate",filterCitasByDate)
router.get("/byDateAndTower",filterCitasByDateAndTower)
router.get("/exportExcel", exportExcelCitas);

module.exports = router;
