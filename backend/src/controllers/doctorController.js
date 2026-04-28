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
    "name email status specialization experience degreeFile"
  );
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
  return res.json(profile);
};

const updateProfile = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

  const { consultationFee, bio, experienceYears } = req.body;
  if (consultationFee !== undefined) profile.consultationFee = Number(consultationFee);
  if (bio !== undefined) profile.bio = bio;
  if (experienceYears !== undefined) profile.experienceYears = Number(experienceYears);

  await profile.save();
  return res.json(profile);
};

const getAvailableSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query; // YYYY-MM-DD

  if (!date) return res.status(400).json({ message: "Date is required" });

  try {
    const profile = await DoctorProfile.findById(doctorId);
    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

    // Get day of week (0-6, 0 is Sunday)
    const d = new Date(date);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = days[d.getDay()];
    
    const availability = profile.availability.filter(a => a.day.toLowerCase() === dayName);
    
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

    res.json(availableSlots.sort());
  } catch (error) {
    console.error("Error in getAvailableSlots:", error);
    res.status(500).json({ message: "Error fetching slots" });
  }
};

module.exports = {
  getDoctors,
  updateAvailability,
  getMyAppointments,
  updateAppointmentStatus,
  getDoctorProfile,
  updateProfile,
  getAvailableSlots,
};
