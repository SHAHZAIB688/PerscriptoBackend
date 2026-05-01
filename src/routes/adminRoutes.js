const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getStats,
  addDoctor,
  removeDoctor,
  listUsers,
  listAppointments,
  listDoctorApplications,
  listApprovedDoctors,
  updateDoctorApplicationStatus,
  suspendApprovedDoctor,
  unsuspendApprovedDoctor,
  blockApprovedDoctor,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/stats", getStats);
router.post("/doctors", addDoctor);
router.delete("/doctors/:id", removeDoctor);
router.get("/users", listUsers);
router.get("/appointments", listAppointments);
router.get("/doctor-applications", listDoctorApplications);
router.get("/approved-doctors", listApprovedDoctors);
router.patch("/doctor-applications/:id/status", updateDoctorApplicationStatus);
router.patch("/approved-doctors/:id/suspend", suspendApprovedDoctor);
router.patch("/approved-doctors/:id/unsuspend", unsuspendApprovedDoctor);
router.patch("/approved-doctors/:id/block", blockApprovedDoctor);

module.exports = router;
