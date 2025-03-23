const express = require("express");
const {
  registerObservacion,
  filterObservaciones,
  getAllObservaciones,
  updateObservacion,
  deleteObservacion,
  filterObservacionesByDate
} = require("../controllers/observacion.general.controller");

const router = express.Router();

router.post("/register", registerObservacion);
router.get("/filter", filterObservaciones);
router.get("/", getAllObservaciones);
router.put("/:id", updateObservacion);
router.delete("/:id", deleteObservacion);
router.get("/byDate", filterObservacionesByDate)
module.exports = router;