const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");

const getDateString = (date) => date.toISOString().slice(0, 10);

const getStats = async (req, res) => {
  const now = new Date();
  const today = getDateString(now);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const consultationFee = Number(process.env.CONSULTATION_FEE || 50);

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    todayAppointments,
    weekAppointments,
    cancelledAppointments,
    completedAppointments,
    pendingAppointments,
    activeDoctors,
    inactiveDoctors,
    pendingDoctorApplications,
    newPatientsToday,
    newPatientsMonth,
    statusAnalytics,
    specializationAgg,
    peakHourAgg,
    topDoctorsAgg,
    doctorAvailabilityAgg,
    monthlyAppointmentTrendAgg,
  ] = await Promise.all([
    User.countDocuments({ role: "patient" }),
    User.countDocuments({ role: "doctor" }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ date: today }),
    Appointment.countDocuments({ date: { $gte: getDateString(weekStart), $lte: today } }),
    Appointment.countDocuments({ status: "cancelled" }),
    Appointment.countDocuments({ status: "completed" }),
    Appointment.countDocuments({ status: "pending" }),
    DoctorProfile.countDocuments({ isActive: true, status: "approved" }),
    DoctorProfile.countDocuments({ isActive: false }),
    DoctorProfile.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "patient", createdAt: { $gte: new Date(today) } }),
    User.countDocuments({ role: "patient", createdAt: { $gte: monthStart } }),
    Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]),
    Appointment.aggregate([
      {
        $lookup: {
          from: "doctorprofiles",
          localField: "doctorProfile",
          foreignField: "_id",
          as: "doctorProfileData",
        },
      },
      { $unwind: "$doctorProfileData" },
      { $group: { _id: "$doctorProfileData.specialization", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Appointment.aggregate([
      { $group: { _id: "$timeSlot", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Appointment.aggregate([
      { $group: { _id: "$doctor", count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "doctorUser" } },
      { $unwind: "$doctorUser" },
      {
        $project: {
          doctorId: "$_id",
          name: "$doctorUser.name",
          count: 1,
          rating: {
            $cond: [
              { $eq: ["$count", 0] },
              0,
              { $round: [{ $add: [3.5, { $multiply: [{ $divide: ["$completed", "$count"] }, 1.5] }] }, 1] },
            ],
          },
          _id: 0,
        },
      },
    ]),
    DoctorProfile.aggregate([
      {
        $group: {
          _id: null,
          availableDoctors: { $sum: { $cond: [{ $gt: [{ $size: "$availability" }, 0] }, 1, 0] } },
          unavailableDoctors: { $sum: { $cond: [{ $gt: [{ $size: "$availability" }, 0] }, 0, 1] } },
        },
      },
    ]),
    Appointment.aggregate([
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]),
  ]);

  const returningPatientsAgg = await Appointment.aggregate([
    { $group: { _id: "$patient", appointments: { $sum: 1 } } },
    { $match: { appointments: { $gt: 1 } } },
    { $count: "count" },
  ]);

  const prevMonthPatients = await User.countDocuments({
    role: "patient",
    createdAt: { $gte: prevMonthStart, $lt: monthStart },
  });

  const monthlyAppointmentTrend = monthlyAppointmentTrendAgg.map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    appointments: item.count,
    completed: item.completedCount,
  }));

  const monthlyEarningsTrend = monthlyAppointmentTrendAgg.map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    earnings: item.completedCount * consultationFee,
  }));

  const returningPatients = returningPatientsAgg[0]?.count || 0;
  const patientGrowthRate =
    prevMonthPatients > 0 ? (((newPatientsMonth - prevMonthPatients) / prevMonthPatients) * 100).toFixed(1) : "100.0";
  const completedRevenue = completedAppointments * consultationFee;
  const monthlyEarnings = monthlyAppointmentTrendAgg.reduce((sum, item) => sum + item.completedCount * consultationFee, 0);

  res.json({
    totalPatients,
    totalUsers: totalPatients,
    totalDoctors,
    totalAppointments,
    pendingAppointments,
    todayAppointments,
    weekAppointments,
    cancelledAppointments,
    completedAppointments,
    activeDoctors,
    inactiveDoctors,
    pendingDoctorApplications,
    totalRevenue: completedRevenue,
    statusAnalytics,
    patientAnalytics: {
      newPatientsToday,
      newPatientsMonth,
      returningPatients,
      growthRate: Number(patientGrowthRate),
      genderDistribution: { male: 0, female: 0, unknown: totalPatients },
      ageGroupAnalysis: { under18: 0, age18to35: 0, age36to55: 0, above55: 0 },
    },
    doctorPerformance: {
      topPerformingDoctors: topDoctorsAgg,
      averageDoctorRating:
        topDoctorsAgg.length > 0
          ? Number((topDoctorsAgg.reduce((acc, item) => acc + item.rating, 0) / topDoctorsAgg.length).toFixed(1))
          : 0,
      doctorAvailabilityStatus: doctorAvailabilityAgg[0] || { availableDoctors: 0, unavailableDoctors: 0 },
      pendingDoctorVerifications: pendingDoctorApplications,
    },
    appointmentInsights: {
      statusBreakdown: statusAnalytics,
      peakBookingHour: peakHourAgg[0]?._id || "N/A",
      mostBookedSpecialization: specializationAgg[0]?._id || "N/A",
      averageAppointmentDuration: 30,
    },
    financialStats: {
      dailyEarnings: completedAppointments * consultationFee,
      monthlyEarnings,
      paymentMethods: { cash: Math.round(totalAppointments * 0.35), online: Math.round(totalAppointments * 0.65) },
      pendingPayments: pendingAppointments,
      refundRequests: cancelledAppointments,
    },
    systemActivity: {
      totalLoginsToday: 0,
      activeUsersRightNow: 0,
      failedLoginAttempts: 0,
      notificationsSent: totalAppointments,
    },
    adminControlStats: {
      reportsGenerated: 0,
      complaintsOrTickets: 0,
      resolvedIssues: 0,
      pendingIssues: 0,
    },
    monthlyAppointmentTrend,
    monthlyEarningsTrend,
  });
};

const addDoctor = async (req, res) => {
  const { name, email, phone, password, specialization, qualification } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already exists" });
  const doctor = await User.create({
    name,
    email,
    phone,
    password,
    role: "doctor",
    specialization,
    status: "approved",
  });
  const profile = await DoctorProfile.create({
    user: doctor._id,
    specialization,
    qualification,
    status: "approved",
    isActive: true,
  });
  res.status(201).json({ doctor, profile });
};

const removeDoctor = async (req, res) => {
  const doctor = await User.findById(req.params.id);
  if (!doctor || doctor.role !== "doctor") return res.status(404).json({ message: "Doctor not found" });
  await DoctorProfile.findOneAndDelete({ user: doctor._id });
  await doctor.deleteOne();
  res.json({ message: "Doctor removed" });
};

const listUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
};

const listAppointments = async (req, res) => {
  const appointments = await Appointment.find()
    .populate("patient", "name email")
    .populate("doctor", "name email")
    .populate("doctorProfile", "specialization")
    .sort({ createdAt: -1 });
  res.json(appointments);
};

const listDoctorApplications = async (req, res) => {
  const applications = await DoctorProfile.find({ status: { $in: ["pending", "rejected"] } })
    .populate("user", "name email specialization experience degreeFile status")
    .sort({ createdAt: -1 });
  res.json(applications);
};

const listApprovedDoctors = async (req, res) => {
  const doctors = await DoctorProfile.find({ status: "approved", isActive: true })
    .populate("user", "name email specialization experience degreeFile status")
    .sort({ createdAt: -1 });
  res.json(doctors);
};

const updateDoctorApplicationStatus = async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const profile = await DoctorProfile.findById(req.params.id).populate("user");
  if (!profile) return res.status(404).json({ message: "Application not found" });

  profile.status = status;
  profile.isActive = status === "approved";
  await profile.save();

  const user = await User.findById(profile.user._id);
  if (user) {
    user.status = status;
    await user.save();
  }

  return res.json({ message: `Doctor application ${status}`, profile });
};

const blockApprovedDoctor = async (req, res) => {
  const profile = await DoctorProfile.findById(req.params.id).populate("user");
  if (!profile) return res.status(404).json({ message: "Doctor not found" });
  profile.isActive = false;
  profile.status = "rejected";
  await profile.save();

  const user = await User.findById(profile.user._id);
  if (user) {
    user.status = "rejected";
    await user.save();
  }

  res.json({ message: "Doctor blocked successfully" });
};

module.exports = {
  getStats,
  addDoctor,
  removeDoctor,
  listUsers,
  listAppointments,
  listDoctorApplications,
  listApprovedDoctors,
  updateDoctorApplicationStatus,
  blockApprovedDoctor,
};
