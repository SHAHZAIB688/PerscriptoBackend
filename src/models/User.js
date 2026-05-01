const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    specialization: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    degreeFile: { type: String, default: "" },
    image: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended", "blocked"],
      default: "approved",
    },
    suspendedUntil: { type: Date, default: null },
    suspensionReason: { type: String, default: "" },
    healthSummary: {
      bloodGroup: { type: String, default: "" },
      allergies: { type: String, default: "" },
      chronicDiseases: { type: String, default: "" },
      lastCheckup: { type: String, default: "" }, // YYYY-MM-DD
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
