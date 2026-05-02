const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const { isValidDoctorSpecialization } = require("../constants/doctorSpecializations");

const isValidTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || ""));

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

const getDoctorById = async (req, res) => {
  const doctor = await DoctorProfile.findOne({
    _id: req.params.id,
    isActive: true,
    status: "approved",
  }).populate("user", "name email phone role");

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  return res.json(doctor);
};

const updateAvailability = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
  if (profile.status !== "approved") {
    return res.status(403).json({ message: "Your account is under verification. Please wait for admin approval." });
  }
  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const incoming = Array.isArray(req.body.availability) ? req.body.availability : [];
  const selected = incoming[0] || {};
  const selectedDay = ((selected?.day || "monday").trim().toLowerCase());
  const selectedStartDay = ((selected?.startDay || selectedDay || "monday").trim().toLowerCase());
  const selectedEndDay = ((selected?.endDay || selectedDay || "friday").trim().toLowerCase());

  const start = isValidTime(selected?.start) ? selected.start : "09:00";
  const end = isValidTime(selected?.end) ? selected.end : "17:00";
  const normalizedStartDay = weekDays.includes(selectedStartDay) ? selectedStartDay : "monday";
  const normalizedEndDay = weekDays.includes(selectedEndDay) ? selectedEndDay : "friday";

  if (start >= end) {
    return res.status(400).json({ message: "End time must be later than start time." });
  }

  profile.availability = [{
    day: weekDays.includes(selectedDay) ? selectedDay : normalizedStartDay,
    startDay: normalizedStartDay,
    endDay: normalizedEndDay,
    start,
    end,
  }];

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
    .populate("prescription")
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
    "name email phone status specialization experience degreeFile"
  );
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
  return res.json(profile);
};

const updateProfile = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

  const { consultationFee, bio, experienceYears, specialization } = req.body;
  if (consultationFee !== undefined) profile.consultationFee = Number(consultationFee);
  if (bio !== undefined) profile.bio = bio;
  if (experienceYears !== undefined) profile.experienceYears = Number(experienceYears);

  if (specialization !== undefined) {
    const s = String(specialization).trim();
    if (!isValidDoctorSpecialization(s)) {
      return res.status(400).json({ message: "Invalid medical specialization" });
    }
    profile.specialization = s;
    await User.updateOne({ _id: req.user._id }, { specialization: s });
  }

  await profile.save();
  const fresh = await DoctorProfile.findOne({ user: req.user._id }).populate(
    "user",
    "name email phone status specialization experience degreeFile"
  );
  return res.json(fresh);
};

const getAvailableSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query; // YYYY-MM-DD

  if (!date) return res.status(400).json({ message: "Date is required" });

  try {
    const profile = await DoctorProfile.findById(doctorId);
    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    // Use UTC day calculation to avoid server timezone shifting the weekday.
    const [year, month, day] = date.split("-").map(Number);
    const dayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = days[dayIndex];
    const weekdayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday"];

    const availability = (profile.availability || []).filter(
      (a) => {
        const exactDay = (a?.day || "").trim().toLowerCase();
        const startDay = (a?.startDay || exactDay).trim().toLowerCase();
        const endDay = (a?.endDay || exactDay).trim().toLowerCase();

        if (exactDay === dayName) return true;

        const currentIdx = weekdayOrder.indexOf(dayName);
        const startIdx = weekdayOrder.indexOf(startDay);
        const endIdx = weekdayOrder.indexOf(endDay);

        if (currentIdx === -1 || startIdx === -1 || endIdx === -1) return false;
        if (startIdx <= endIdx) {
          return currentIdx >= startIdx && currentIdx <= endIdx;
        }
        return currentIdx >= startIdx || currentIdx <= endIdx;
      }
    );
    
    if (availability.length === 0) {
      return res.json([]);
    }

    const appointments = await Appointment.find({
      doctorProfile: doctorId,
      date,
      status: { $nin: ["cancelled", "rejected"] }
    }).select("timeSlot");

    const bookedSlots = appointments.map(a => a.timeSlot);

    const availableSlots = [];
    
    availability.forEach(slot => {
      let current = slot.start;
      const end = slot.end;
      
      while (current < end) {
        if (!bookedSlots.includes(current)) {
          availableSlots.push(current);
        }
        
        // Increment by 30 mins
        let [hours, mins] = current.split(":").map(Number);
        mins += 30;
        if (mins >= 60) {
          hours += 1;
          mins -= 60;
        }
        current = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
      }
    });

    const uniqueSortedSlots = [...new Set(availableSlots)].sort();
    res.json(uniqueSortedSlots);
  } catch (error) {
    console.error("Error in getAvailableSlots:", error);
    res.status(500).json({ message: "Error fetching slots" });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  updateAvailability,
  getMyAppointments,
  updateAppointmentStatus,
  getDoctorProfile,
  updateProfile,
  getAvailableSlots,
};
