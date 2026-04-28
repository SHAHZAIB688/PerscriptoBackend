const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "DoctorProfile", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    timeSlot: { type: String, required: true }, // HH:mm
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "in-progress", "awaiting-payment", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    reminderSent: { type: Boolean, default: false },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
