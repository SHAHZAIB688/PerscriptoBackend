const express = require("express");
const { body } = require("express-validator");
const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  payAppointment,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("patient"),
  [body("doctorProfileId").notEmpty(), body("date").notEmpty(), body("timeSlot").notEmpty()],
  validate,
  bookAppointment
);
router.get("/my", protect, authorize("patient"), getMyAppointments);
router.put("/:id/cancel", protect, authorize("patient"), cancelAppointment);
router.put("/:id/reschedule", protect, authorize("patient"), rescheduleAppointment);
router.put("/:id/pay", protect, authorize("patient"), payAppointment);

module.exports = router;
