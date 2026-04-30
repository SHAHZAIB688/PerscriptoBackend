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

module.exports = { register, login, me, updateHealthSummary };
