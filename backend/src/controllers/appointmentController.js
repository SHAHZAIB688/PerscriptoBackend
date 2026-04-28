const Appointment = require("../models/Appointment");
const DoctorProfile = require("../models/DoctorProfile");
const User = require("../models/User");
const { sendWhatsApp } = require("../services/whatsappService");

const bookAppointment = async (req, res) => {
  const { doctorProfileId, date, timeSlot, reason } = req.body;
  const doctorProfile = await DoctorProfile.findById(doctorProfileId).populate("user", "name");
  if (!doctorProfile) return res.status(404).json({ message: "Doctor not found" });

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorProfile.user._id,
    doctorProfile: doctorProfile._id,
    date,
    timeSlot,
    reason: reason || "",
  });

  const patient = await User.findById(req.user._id);
  await sendWhatsApp({
    to: patient.phone,
    message: `Hi ${patient.name}, your appointment with Dr. ${doctorProfile.user.name} is booked for ${date} at ${timeSlot}.`,
  });
  res.status(201).json(appointment);
};

const getMyAppointments = async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate("doctor", "name email")
    .populate("doctorProfile", "specialization")
    .populate("prescription")
    .sort({ createdAt: -1 });
  res.json(appointments);
};

const cancelAppointment = async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.status = "cancelled";
  await appointment.save();
  res.json(appointment);
};

const rescheduleAppointment = async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.date = req.body.date;
  appointment.timeSlot = req.body.timeSlot;
  appointment.status = "pending";
  await appointment.save();
  res.json(appointment);
};

const payAppointment = async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.status = "completed";
  await appointment.save();
  res.json(appointment);
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  payAppointment,
};
