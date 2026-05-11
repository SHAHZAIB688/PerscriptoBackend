const crypto = require("crypto");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const generateToken = require("../utils/generateToken");
const { verifyFirebaseIdToken } = require("../config/firebaseAdmin");

const parseOptionalCoord = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const buildAuthPayload = (user, locationFromProfile = null) => {
  const loc = locationFromProfile || {
    locationCity: user.locationCity,
    locationAddress: user.locationAddress,
    locationLat: user.locationLat,
    locationLng: user.locationLng,
  };
  return {
    token: generateToken(user._id, user.role),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      suspendedUntil: user.suspendedUntil || null,
      specialization: user.specialization,
      experience: user.experience,
      degreeFile: user.degreeFile,
      locationCity: loc.locationCity ?? "",
      locationAddress: loc.locationAddress ?? "",
      locationLat: loc.locationLat ?? null,
      locationLng: loc.locationLng ?? null,
    },
  };
};

const assertDoctorCanLogin = (user, res) => {
  if (user.role !== "doctor" || user.status === "approved") return true;
  if (user.status === "pending") {
    res.status(403).json({ message: "Doctor account pending admin approval" });
    return false;
  }
  if (user.status === "suspended") {
    res.status(403).json({ message: "Account temporarily suspended. Contact admin." });
    return false;
  }
  if (user.status === "blocked" || user.status === "rejected") {
    res.status(403).json({ message: "Account blocked. Contact admin." });
    return false;
  }
  res.status(403).json({ message: "Account not approved" });
  return false;
};

const register = async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    specialization,
    qualification,
    experience,
    locationCity,
    locationAddress,
    locationLat,
    locationLng,
  } = req.body;

  const cityTrim = String(locationCity ?? "").trim();
  const addressTrim = String(locationAddress ?? "").trim();
  const latNum = parseOptionalCoord(locationLat);
  const lngNum = parseOptionalCoord(locationLng);

  const specTrimmed = role === "doctor" ? String(specialization ?? "").trim() : "";
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already exists" });

  if (role === "doctor") {
    if (!req.files?.degreeFile) {
      return res.status(400).json({ message: "Degree certificate is required for doctor registration" });
    }
    if (!req.files?.image) {
      return res.status(400).json({ message: "Professional photo is required for doctor registration" });
    }
  }

  const degreePath = role === "doctor" ? `/uploads/${req.files.degreeFile[0].filename}` : "";
  const imagePath = role === "doctor" ? `/uploads/${req.files.image[0].filename}` : "";

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    specialization: role === "doctor" ? specTrimmed : "",
    experience: role === "doctor" ? Number(experience || 0) : 0,
    degreeFile: degreePath,
    image: imagePath,
    status: role === "doctor" ? "pending" : "approved",
    ...(role === "patient"
      ? {
          locationCity: cityTrim,
          locationAddress: addressTrim,
          ...(latNum !== undefined ? { locationLat: latNum } : {}),
          ...(lngNum !== undefined ? { locationLng: lngNum } : {}),
        }
      : {}),
  });

  if (role === "doctor") {
    await DoctorProfile.create({
      user: user._id,
      specialization: specTrimmed,
      qualification: qualification || "",
      experienceYears: Number(experience || 0),
      degreeFile: degreePath,
      image: imagePath,
      status: "pending",
      isActive: false,
      locationCity: cityTrim,
      locationAddress: addressTrim,
      ...(latNum !== undefined ? { locationLat: latNum } : {}),
      ...(lngNum !== undefined ? { locationLng: lngNum } : {}),
    });
  }

  const locUser = {
    locationCity: cityTrim,
    locationAddress: addressTrim,
    locationLat: latNum ?? null,
    locationLng: lngNum ?? null,
  };

  return res.status(201).json({
    ...buildAuthPayload(user, locUser),
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  
  // Create admin user if it doesn't exist and credentials match
  if (!user && email === 'admin!@gmail.com' && password === 'admin!123') {
    user = await User.create({
      name: 'Admin',
      email: 'admin!@gmail.com',
      phone: '0000000000',
      password: 'admin!123',
      role: 'admin',
      status: 'approved'
    });
  }
  
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (!assertDoctorCanLogin(user, res)) return;

  let locProfile = null;
  if (user.role === "doctor") {
    const profile = await DoctorProfile.findOne({ user: user._id })
      .select("locationCity locationAddress locationLat locationLng")
      .lean();
    if (profile) locProfile = profile;
  }
  return res.json(buildAuthPayload(user, locProfile));
};

const me = async (req, res) => {
  if (req.user.role === "doctor") {
    const profile = await DoctorProfile.findOne({ user: req.user._id }).select(
      "specialization locationCity locationAddress locationLat locationLng"
    );
    const out = req.user.toObject();
    if (profile?.specialization) out.specialization = profile.specialization;
    if (profile) {
      out.locationCity = profile.locationCity ?? "";
      out.locationAddress = profile.locationAddress ?? "";
      out.locationLat = profile.locationLat;
      out.locationLng = profile.locationLng;
    }
    return res.json(out);
  }
  return res.json(req.user);
};

const updateAccountProfile = async (req, res) => {
  const { name, email, phone, currentPassword, newPassword, locationCity, locationAddress, locationLat, locationLng } =
    req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (name !== undefined) {
    const trimmed = String(name || "").trim();
    if (!trimmed) return res.status(400).json({ message: "Name cannot be empty" });
    user.name = trimmed;
  }

  if (phone !== undefined) {
    const trimmed = String(phone || "").trim();
    if (!trimmed) return res.status(400).json({ message: "Phone cannot be empty" });
    user.phone = trimmed;
  }

  if (email !== undefined) {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return res.status(400).json({ message: "Email cannot be empty" });
    if (normalized !== user.email) {
      const taken = await User.findOne({ email: normalized, _id: { $ne: user._id } });
      if (taken) return res.status(409).json({ message: "Email already in use" });
      user.email = normalized;
    }
  }

  if (newPassword !== undefined && String(newPassword).length > 0) {
    const pwd = String(newPassword);
    if (pwd.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
    if (!currentPassword) return res.status(400).json({ message: "Current password is required to set a new password" });
    const ok = await user.comparePassword(String(currentPassword));
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });
    user.password = pwd;
  }

  if (user.role === "patient") {
    if (locationCity !== undefined) user.locationCity = String(locationCity || "").trim();
    if (locationAddress !== undefined) user.locationAddress = String(locationAddress || "").trim();
    if (locationLat !== undefined) {
      const n = parseOptionalCoord(locationLat);
      user.locationLat = n === undefined ? null : n;
    }
    if (locationLng !== undefined) {
      const n = parseOptionalCoord(locationLng);
      user.locationLng = n === undefined ? null : n;
    }
  }

  await user.save();

  if (user.role === "doctor" && (locationCity !== undefined || locationAddress !== undefined || locationLat !== undefined || locationLng !== undefined)) {
    const profile = await DoctorProfile.findOne({ user: user._id });
    if (profile) {
      if (locationCity !== undefined) profile.locationCity = String(locationCity || "").trim();
      if (locationAddress !== undefined) profile.locationAddress = String(locationAddress || "").trim();
      if (locationLat !== undefined) {
        const n = parseOptionalCoord(locationLat);
        profile.locationLat = n === undefined ? null : n;
      }
      if (locationLng !== undefined) {
        const n = parseOptionalCoord(locationLng);
        profile.locationLng = n === undefined ? null : n;
      }
      await profile.save();
    }
  }

  if (user.role === "doctor") {
    const profile = await DoctorProfile.findOne({ user: user._id }).select(
      "specialization locationCity locationAddress locationLat locationLng"
    );
    const freshUser = await User.findById(user._id).select("-password");
    const out = freshUser.toObject();
    if (profile?.specialization) out.specialization = profile.specialization;
    if (profile) {
      out.locationCity = profile.locationCity ?? "";
      out.locationAddress = profile.locationAddress ?? "";
      out.locationLat = profile.locationLat;
      out.locationLng = profile.locationLng;
    }
    return res.json(out);
  }

  const fresh = await User.findById(user._id).select("-password");
  return res.json(fresh);
};

const googleAuth = async (req, res) => {
  const { idToken, role = "patient" } = req.body;

  if (!idToken || typeof idToken !== "string") {
    return res.status(400).json({ message: "Missing id token" });
  }
  if (role !== "patient") {
    return res.status(400).json({ message: "Google sign-up is only available for patients" });
  }

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(idToken);
  } catch (err) {
    console.error("Firebase ID token verification failed:", err.message);
    return res.status(401).json({
      message:
        "Google sign-in could not be verified. Add FIREBASE_SERVICE_ACCOUNT_JSON to the backend .env (Firebase Console → Project settings → Service accounts → Generate new private key).",
    });
  }

  const email = String(decoded.email || "").toLowerCase();
  if (!email) return res.status(400).json({ message: "Google account has no email" });
  if (!decoded.email_verified) {
    return res.status(400).json({ message: "Verify your Google email before continuing" });
  }

  const name = (decoded.name && String(decoded.name).trim()) || email.split("@")[0];

  let user = await User.findOne({ email });

  if (user) {
    if (!assertDoctorCanLogin(user, res)) return;
    let locProfile = null;
    if (user.role === "doctor") {
      const profile = await DoctorProfile.findOne({ user: user._id })
        .select("locationCity locationAddress locationLat locationLng")
        .lean();
      if (profile) locProfile = profile;
    }
    return res.json(buildAuthPayload(user, locProfile));
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  user = await User.create({
    name,
    email,
    phone: "0000000000",
    password: randomPassword,
    role: "patient",
    status: "approved",
  });

  return res.status(201).json(buildAuthPayload(user));
};

const updateHealthSummary = async (req, res) => {
  const { bloodGroup = "", allergies = "", chronicDiseases = "", lastCheckup = "" } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.healthSummary = {
    bloodGroup: String(bloodGroup || "").trim(),
    allergies: String(allergies || "").trim(),
    chronicDiseases: String(chronicDiseases || "").trim(),
    lastCheckup: String(lastCheckup || "").trim(),
  };
  await user.save();

  return res.json({
    message: "Health summary updated",
    healthSummary: user.healthSummary,
  });
};

module.exports = { register, login, googleAuth, me, updateAccountProfile, updateHealthSummary };
