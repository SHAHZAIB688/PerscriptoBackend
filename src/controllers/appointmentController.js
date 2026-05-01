const Appointment = require("../models/Appointment");
const DoctorProfile = require("../models/DoctorProfile");
const User = require("../models/User");
const Review = require("../models/Review");
const { sendWhatsApp } = require("../services/whatsappService");
const Stripe = require("stripe");

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
};

const bookAppointment = async (req, res) => {
  const { doctorProfileId, date, timeSlot, reason } = req.body;
  const doctorProfile = await DoctorProfile.findById(doctorProfileId).populate("user", "name");
  if (!doctorProfile) return res.status(404).json({ message: "Doctor not found" });

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorProfile.user._id,
    doctorProfile: doctorProfile._id,
    date,
    timeSlot,
    reason: reason || "",
  });

  const patient = await User.findById(req.user._id);
  await sendWhatsApp({
    to: patient.phone,
    message: `Hi ${patient.name}, your appointment with Dr. ${doctorProfile.user.name} is booked for ${date} at ${timeSlot}.`,
  });
  res.status(201).json(appointment);
};

const getMyAppointments = async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate("doctor", "name email")
    .populate("doctorProfile", "specialization consultationFee")
    .populate("prescription")
    .sort({ createdAt: -1 });

  const appointmentIds = appointments.map((appointment) => appointment._id);
  const reviews = await Review.find({ appointment: { $in: appointmentIds } }).select(
    "appointment rating patientComment doctorResponse"
  );
  const reviewByAppointmentId = new Map(
    reviews.map((review) => [String(review.appointment), review])
  );

  const appointmentsWithReview = appointments.map((appointment) => {
    const plain = appointment.toObject();
    plain.review = reviewByAppointmentId.get(String(appointment._id)) || null;
    return plain;
  });

  res.json(appointmentsWithReview);
};

const cancelAppointment = async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.status = "cancelled";
  await appointment.save();
  res.json(appointment);
};

const rescheduleAppointment = async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  appointment.date = req.body.date;
  appointment.timeSlot = req.body.timeSlot;
  appointment.status = "pending";
  await appointment.save();
  res.json(appointment);
};

const payAppointment = async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id }).populate(
    "doctorProfile",
    "consultationFee"
  );
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  const fee = Math.round(Number(appointment.doctorProfile?.consultationFee ?? 0));
  appointment.status = "completed";
  appointment.paymentAmount = fee;
  appointment.paymentCurrency = "PKR";
  appointment.paymentMethod = fee > 0 ? "manual" : "none";
  appointment.paidAt = new Date();
  await appointment.save();
  const populated = await Appointment.findById(appointment._id)
    .populate("doctor", "name email")
    .populate("doctorProfile", "specialization consultationFee")
    .populate("prescription");
  res.json(populated);
};

const createStripeCheckoutSession = async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured on server" });
  }

  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id }).populate(
    "doctorProfile",
    "specialization consultationFee"
  );
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  if (appointment.status !== "awaiting-payment") {
    return res.status(400).json({ message: "Appointment is not ready for payment" });
  }

  const amount = Math.round(Number(appointment?.doctorProfile?.consultationFee || 0));
  if (amount <= 0) {
    return res.status(400).json({ message: "Invalid consultation fee for payment" });
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const successUrl = `${frontendUrl}/dashboard?payment=success&appointmentId=${appointment._id}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${frontendUrl}/dashboard?payment=cancelled&appointmentId=${appointment._id}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      appointmentId: String(appointment._id),
      patientId: String(req.user._id),
    },
    line_items: [
      {
        price_data: {
          currency: "pkr",
          product_data: {
            name: `Doctor Consultation (${appointment.doctorProfile?.specialization || "General"})`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
  });

  return res.json({ url: session.url });
};

const verifyStripeSession = async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured on server" });
  }

  const { sessionId, appointmentId } = req.body;
  if (!sessionId || !appointmentId) {
    return res.status(400).json({ message: "sessionId and appointmentId are required" });
  }

  const appointment = await Appointment.findOne({ _id: appointmentId, patient: req.user._id }).populate(
    "doctorProfile",
    "consultationFee"
  );
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = session.payment_status === "paid";
  const sessionAppointmentId = String(session.metadata?.appointmentId || "");
  const sessionPatientId = String(session.metadata?.patientId || "");
  if (!paid || sessionAppointmentId !== String(appointment._id) || sessionPatientId !== String(req.user._id)) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  const feeFromProfile = Math.round(Number(appointment.doctorProfile?.consultationFee ?? 0));
  const amountTotal = session.amount_total != null ? Number(session.amount_total) : null;
  const fromStripeMajor =
    amountTotal != null && Number.isFinite(amountTotal) ? Math.round(amountTotal / 100) : null;
  const resolvedAmount =
    feeFromProfile > 0 ? feeFromProfile : fromStripeMajor != null && fromStripeMajor > 0 ? fromStripeMajor : 0;

  appointment.status = "completed";
  appointment.paymentAmount = resolvedAmount;
  appointment.paymentCurrency =
    String(session.currency || "pkr").toUpperCase() === "PKR" ? "PKR" : String(session.currency || "PKR").toUpperCase();
  appointment.paymentMethod = "stripe";
  appointment.paidAt = new Date();
  appointment.stripeCheckoutSessionId = sessionId;
  await appointment.save();

  const populated = await Appointment.findById(appointment._id)
    .populate("doctor", "name email")
    .populate("doctorProfile", "specialization consultationFee")
    .populate("prescription");
  return res.json({ message: "Payment verified", appointment: populated });
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  payAppointment,
  createStripeCheckoutSession,
  verifyStripeSession,
};
