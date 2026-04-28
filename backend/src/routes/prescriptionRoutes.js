const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { createPrescription, getPrescriptionByAppointment } = require("../controllers/prescriptionController");

const router = express.Router();

router.post("/", protect, authorize("doctor"), createPrescription);
router.get("/:appointmentId", protect, getPrescriptionByAppointment);

module.exports = router;
