const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, required: true }, // monday..sunday
    startDay: { type: String, default: "" }, // optional range start day
    endDay: { type: String, default: "" }, // optional range end day
    start: { type: String, required: true }, // HH:mm
    end: { type: String, required: true }, // HH:mm
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    hospitalId: { type: String, default: "" },
    name: { type: String, default: "" },
    locality: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    fee: { type: Number, default: 0 },
    whenAvailable: { type: String, default: "" },
    videoConsultation: { type: Boolean, default: false },
    isPrimary: { type: Boolean, default: false },
    bookUrl: { type: String, default: "" },
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
    locationCity: { type: String, default: "" },
    locationAddress: { type: String, default: "" },
    locationLat: { type: Number, default: null },
    locationLng: { type: Number, default: null },
    oladocDoctorId: { type: String, default: "", unique: true, sparse: true },
    profileUrl: { type: String, default: "" },
    services: { type: [String], default: [] },
    pmdcVerified: { type: Boolean, default: false },
    pmdcId: { type: String, default: "" },
    videoConsultationAvailable: { type: Boolean, default: false },
    hospitals: { type: [hospitalSchema], default: [] },
  },
  { timestamps: true }
);

doctorProfileSchema.index({ isActive: 1, status: 1 });
doctorProfileSchema.index({ specialization: 1 });

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
