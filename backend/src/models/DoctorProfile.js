const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, required: true }, // monday..sunday
    start: { type: String, required: true }, // HH:mm
    end: { type: String, required: true }, // HH:mm
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialization: { type: String, required: true },
    qualification: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    degreeFile: { type: String, default: "" },
    image: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    bio: { type: String, default: "" },
    consultationFee: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    availability: { type: [slotSchema], default: [] },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
