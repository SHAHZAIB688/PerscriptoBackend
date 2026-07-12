const express = require("express");
const {
  getDoctors,
  recommendDoctor,
  getDoctorById,
  updateAvailability,
  getMyAppointments,
  updateAppointmentStatus,
  getDoctorProfile,
  updateProfile,
  getAvailableSlots,
  getSpecializations,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/specializations", getSpecializations);
router.get("/recommend", recommendDoctor);
router.get("/", getDoctors);
router.get("/available-slots/:doctorId", getAvailableSlots);
router.put("/availability", protect, authorize("doctor"), updateAvailability);
router.get("/appointments", protect, authorize("doctor"), getMyAppointments);
router.put("/appointments/:id/status", protect, authorize("doctor"), updateAppointmentStatus);
router.get("/profile", protect, authorize("doctor"), getDoctorProfile);
router.put("/profile", protect, authorize("doctor"), updateProfile);
router.get("/:id", getDoctorById);

module.exports = router;
