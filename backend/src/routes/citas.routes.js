const express = require("express");
const {
  registerCita,
  filterCitas,
  getAllCitas,
  updateCita,
  deleteCita,
} = require("../controllers/cita.controller");

const router = express.Router();

router.post("/register", registerCita);
router.get("/filter", filterCitas);
router.get("/", getAllCitas);
router.put("/:id", updateCita);
router.delete("/:id", deleteCita);

module.exports = router;
