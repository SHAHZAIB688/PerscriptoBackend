const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const generateToken = require("../utils/generateToken");

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
  } = req.body;
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
    specialization: role === "doctor" ? specialization : "",
    experience: role === "doctor" ? Number(experience || 0) : 0,
    degreeFile: degreePath,
    image: imagePath,
    status: role === "doctor" ? "pending" : "approved",
  });

  if (role === "doctor") {
    await DoctorProfile.create({
      user: user._id,
      specialization: specialization || "General Physician",
      qualification: qualification || "",
      experienceYears: Number(experience || 0),
      degreeFile: degreePath,
      image: imagePath,
      status: "pending",
      isActive: false,
    });
  }

  return res.status(201).json({
    token: generateToken(user._id, user.role),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      specialization: user.specialization,
      experience: user.experience,
      degreeFile: user.degreeFile,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (user.role === "doctor" && user.status !== "approved") {
    return res.status(403).json({ message: "Doctor account pending admin approval" });
  }
  return res.json({
    token: generateToken(user._id, user.role),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      specialization: user.specialization,
      experience: user.experience,
      degreeFile: user.degreeFile,
    },
  });
};

const me = async (req, res) => res.json(req.user);

module.exports = { register, login, me };
