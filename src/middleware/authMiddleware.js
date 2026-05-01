const jwt = require("jsonwebtoken");
const User = require("../models/User");
const getJwtSecret = require("../utils/jwtSecret");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    if (req.user.status === "suspended" && req.user.suspendedUntil) {
      const until = new Date(req.user.suspendedUntil).getTime();
      if (Number.isFinite(until) && Date.now() >= until) {
        req.user.status = "approved";
        req.user.suspendedUntil = null;
        req.user.suspensionReason = "";
        await req.user.save();
      }
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
};

module.exports = { protect, authorize };
