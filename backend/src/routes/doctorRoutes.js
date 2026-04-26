const express = require("express");
const {
  getDoctors,
  updateAvailability,
  getMyAppointments,
  updateAppointmentStatus,
  getDoctorProfile,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getDoctors);
router.put("/availability", protect, authorize("doctor"), updateAvailability);
router.get("/appointments", protect, authorize("doctor"), getMyAppointments);
router.put("/appointments/:id/status", protect, authorize("doctor"), updateAppointmentStatus);
router.get("/profile", protect, authorize("doctor"), getDoctorProfile);

module.exports = router;
