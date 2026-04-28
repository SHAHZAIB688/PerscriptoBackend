const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, default: "Once daily" },
  time: [{ type: String }],
  duration: { type: String, default: "" }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, required: true },
    age: { type: String },
    gender: { type: String },
    symptoms: { type: String },
    diagnosis: { type: String, required: true },
    labTests: { type: String },
    advice: { type: String },
    followUpDate: { type: String },
    medicines: [medicineSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
