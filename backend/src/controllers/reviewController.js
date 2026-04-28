const Review = require("../models/Review");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");

const createReview = async (req, res) => {
  const { appointmentId, rating, comment } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed appointments" });
    }

    // Check if review already exists
    const existing = await Review.findOne({ appointment: appointmentId });
    if (existing) return res.status(400).json({ message: "Review already exists for this appointment" });

    const review = await Review.create({
      appointment: appointmentId,
      doctor: appointment.doctor,
      patient: req.user._id,
      rating,
      patientComment: comment,
    });

    // Update Doctor Profile Average Rating
    const profile = await DoctorProfile.findOne({ user: appointment.doctor });
    if (profile) {
      const totalScore = (profile.averageRating * profile.numReviews) + Number(rating);
      profile.numReviews += 1;
      profile.averageRating = totalScore / profile.numReviews;
      await profile.save();
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ doctor: req.params.doctorId })
      .populate("patient", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const respondToReview = async (req, res) => {
  const { response } = req.body;
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    
    // Ensure only the correct doctor is responding
    if (review.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    review.doctorResponse = response;
    await review.save();
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getDoctorReviews,
  respondToReview,
};
