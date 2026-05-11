const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const { isValidDoctorSpecialization } = require("../constants/doctorSpecializations");

const isValidTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || ""));

const escapeRegex = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getDoctors = async (req, res) => {
  const { search = "", specialization = "", lat, lng, radiusKm = "100" } = req.query;
  const query = { isActive: true, status: "approved" };
  const spec = String(specialization || "").trim();
  if (spec && spec !== "all") {
    query.specialization = new RegExp(escapeRegex(spec), "i");
  }

  const searchRe = new RegExp(escapeRegex(search), "i");
  let doctors = await DoctorProfile.find(query)
    .populate("user", "name email phone role")
    .where("specialization")
    .regex(searchRe)
    .lean();

  const plat = Number(lat);
  const plng = Number(lng);
  const radius = Math.min(Math.max(Number(radiusKm) || 100, 5), 500);

  if (Number.isFinite(plat) && Number.isFinite(plng)) {
    doctors = doctors
      .map((d) => {
        const dlat = d.locationLat;
        const dlng = d.locationLng;
        if (!Number.isFinite(dlat) || !Number.isFinite(dlng)) return null;
        const dist = haversineKm(plat, plng, dlat, dlng);
        if (dist > radius) return null;
        return { ...d, distanceKm: Math.round(dist * 10) / 10 };
      })
      .filter(Boolean)
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

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
  
  // Support all 7 days of the week, not just weekdays
  const allDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const incoming = Array.isArray(req.body.availability) ? req.body.availability : [];
  const selected = incoming[0] || {};
  const selectedDay = ((selected?.day || "monday").trim().toLowerCase());
  const selectedStartDay = ((selected?.startDay || selectedDay || "monday").trim().toLowerCase());
  const selectedEndDay = ((selected?.endDay || selectedDay || "friday").trim().toLowerCase());

  const start = isValidTime(selected?.start) ? selected.start : "09:00";
  const end = isValidTime(selected?.end) ? selected.end : "17:00";
  const normalizedStartDay = allDays.includes(selectedStartDay) ? selectedStartDay : "monday";
  const normalizedEndDay = allDays.includes(selectedEndDay) ? selectedEndDay : "friday";

  if (start >= end) {
    return res.status(400).json({ message: "End time must be later than start time." });
  }

  console.log(`Setting availability: ${normalizedStartDay} to ${normalizedEndDay}, ${start} to ${end}`);

  profile.availability = [{
    day: allDays.includes(selectedDay) ? selectedDay : normalizedStartDay,
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

const parseOptionalCoord = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const updateProfile = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

  const { consultationFee, bio, experienceYears, specialization, locationCity, locationAddress, locationLat, locationLng } =
    req.body;
  if (consultationFee !== undefined) profile.consultationFee = Number(consultationFee);
  if (bio !== undefined) profile.bio = bio;
  if (experienceYears !== undefined) profile.experienceYears = Number(experienceYears);
  if (locationCity !== undefined) profile.locationCity = String(locationCity || "").trim();
  if (locationAddress !== undefined) profile.locationAddress = String(locationAddress || "").trim();
  if (locationLat !== undefined) profile.locationLat = parseOptionalCoord(locationLat);
  if (locationLng !== undefined) profile.locationLng = parseOptionalCoord(locationLng);

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

    // Parse date string: split and create local date
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayIndex = dateObj.getDay();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = days[dayIndex];
    
    console.log(`Fetching slots for ${date} (${dayName}), doctor: ${doctorId}`);

    // Check if doctor has any availability
    if (!profile.availability || profile.availability.length === 0) {
      console.log("Doctor has no availability set");
      return res.json([]);
    }

    const availability = (profile.availability || []).filter((a) => {
      const exactDay = (a?.day || "").trim().toLowerCase();
      const startDay = (a?.startDay || exactDay).trim().toLowerCase();
      const endDay = (a?.endDay || exactDay).trim().toLowerCase();

      // Check exact day match
      if (exactDay && exactDay === dayName) {
        console.log(`Matched exact day: ${exactDay}`);
        return true;
      }

      // Check if day is in range (all 7 days of week)
      const allDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const currentIdx = allDays.indexOf(dayName);
      const startIdx = allDays.indexOf(startDay);
      const endIdx = allDays.indexOf(endDay);

      if (currentIdx === -1 || startIdx === -1 || endIdx === -1) {
        return false;
      }

      const isInRange = startIdx <= endIdx 
        ? (currentIdx >= startIdx && currentIdx <= endIdx)
        : (currentIdx >= startIdx || currentIdx <= endIdx);
      
      if (isInRange) {
        console.log(`Day ${dayName} is in range ${startDay} to ${endDay}`);
      }
      return isInRange;
    });

    if (availability.length === 0) {
      console.log(`No availability found for ${dayName}`);
      return res.json([]);
    }

    // Get booked appointments for this date
    const appointments = await Appointment.find({
      doctorProfile: doctorId,
      date: date,
      status: { $nin: ["cancelled", "rejected"] }
    }).select("timeSlot");

    console.log(`Found ${appointments.length} booked appointments for ${date}`);

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
    console.log(`Returning ${uniqueSortedSlots.length} available slots for ${date}`);
    res.json(uniqueSortedSlots);
  } catch (error) {
    console.error("Error in getAvailableSlots:", error);
    res.status(500).json({ message: "Error fetching slots", error: error.message });
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
