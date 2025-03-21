const express = require("express");
const {
  registerObservacion,
  filterObservaciones,
  getAllObservaciones,
  updateObservacion,
  deleteObservacion,
} = require("../controllers/observacion.controller");

const router = express.Router();

router.post("/register", registerObservacion);
router.get("/filter", filterObservaciones);
router.get("/", getAllObservaciones);
router.put("/:id", updateObservacion);
router.delete("/:id", deleteObservacion);

module.exports = router;