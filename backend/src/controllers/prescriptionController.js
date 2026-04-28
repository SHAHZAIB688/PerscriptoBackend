const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");

const createPrescription = async (req, res) => {
  const { appointmentId, patientName, age, gender, symptoms, diagnosis, labTests, advice, followUpDate, medicines } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  if (appointment.doctor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized to write prescription for this appointment" });
  }

  const prescription = await Prescription.create({
    appointment: appointmentId,
    patient: appointment.patient,
    doctor: req.user._id,
    patientName,
    age,
    gender,
    symptoms,
    diagnosis,
    labTests,
    advice,
    followUpDate,
    medicines
  });

  appointment.prescription = prescription._id;
  await appointment.save();

  res.status(201).json(prescription);
};

const getPrescriptionByAppointment = async (req, res) => {
  const prescription = await Prescription.findOne({ appointment: req.params.appointmentId });
  if (!prescription) return res.status(404).json({ message: "Prescription not found" });

  res.json(prescription);
};

module.exports = {
  createPrescription,
  getPrescriptionByAppointment
};
