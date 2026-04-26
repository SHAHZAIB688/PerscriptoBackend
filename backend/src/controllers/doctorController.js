const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");

const getDoctors = async (req, res) => {
  const { search = "", specialization = "" } = req.query;
  const query = { isActive: true, status: "approved" };
  if (specialization) query.specialization = new RegExp(specialization, "i");

  const doctors = await DoctorProfile.find(query)
    .populate("user", "name email phone role")
    .where("specialization")
    .regex(new RegExp(search, "i"));
  res.json(doctors);
};

const updateAvailability = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
  if (profile.status !== "approved") {
    return res.status(403).json({ message: "Your account is under verification. Please wait for admin approval." });
  }
  profile.availability = req.body.availability || [];
  await profile.save();
  return res.json(profile);
};

const getMyAppointments = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile || profile.status !== "approved") {
    return res.status(403).json({ message: "Your account is under verification. Please wait for admin approval." });
  }
  const appointments = await Appointment.find({ doctor: req.user._id })
    .populate("patient", "name phone email")
    .sort({ date: 1, timeSlot: 1 });
  res.json(appointments);
};

const updateAppointmentStatus = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile || profile.status !== "approved") {
    return res.status(403).json({ message: "Your account is under verification. Please wait for admin approval." });
  }
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    doctor: req.user._id,
  }).populate("patient", "phone name");
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  appointment.status = req.body.status;
  await appointment.save();
  return res.json(appointment);
};

const getDoctorProfile = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id }).populate(
    "user",
    "name email status specialization experience degreeFile"
  );
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
  return res.json(profile);
};

module.exports = {
  getDoctors,
  updateAvailability,
  getMyAppointments,
  updateAppointmentStatus,
  getDoctorProfile,
};
