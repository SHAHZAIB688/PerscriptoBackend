const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const { isValidDoctorSpecialization } = require("../constants/doctorSpecializations");

const getDateString = (date) => date.toISOString().slice(0, 10);

const getStats = async (req, res) => {
  const now = new Date();
  const today = getDateString(now);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pad2 = (n) => String(n).padStart(2, "0");
  const monthStartStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-01`;
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEndStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(lastDayOfMonth)}`;
  const commissionRate = Number(process.env.PLATFORM_COMMISSION_RATE || 0.2);

  const sumCompletedFeesPipeline = (match) => [
    { $match: { status: "completed", ...match } },
    {
      $lookup: {
        from: "doctorprofiles",
        localField: "doctorProfile",
        foreignField: "_id",
        as: "dp",
      },
    },
    { $unwind: "$dp" },
    {
      $group: {
        _id: null,
        gross: { $sum: { $toDouble: { $ifNull: ["$dp.consultationFee", 0] } } },
      },
    },
  ];

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
    completedRevenueAgg,
    dailyGrossAgg,
    monthlyPeriodGrossAgg,
    monthlyEarnAgg,
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
    Appointment.aggregate(sumCompletedFeesPipeline({})),
    Appointment.aggregate(sumCompletedFeesPipeline({ date: today })),
    Appointment.aggregate(sumCompletedFeesPipeline({ date: { $gte: monthStartStr, $lte: monthEndStr } })),
    Appointment.aggregate([
      { $match: { status: "completed" } },
      {
        $lookup: {
          from: "doctorprofiles",
          localField: "doctorProfile",
          foreignField: "_id",
          as: "dp",
        },
      },
      { $unwind: "$dp" },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          earnings: { $sum: { $toDouble: { $ifNull: ["$dp.consultationFee", 0] } } },
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

  const monthlyEarningsTrend = monthlyEarnAgg.map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    earnings: Math.round(item.earnings * 100) / 100,
  }));

  const returningPatients = returningPatientsAgg[0]?.count || 0;
  const patientGrowthRate =
    prevMonthPatients > 0 ? (((newPatientsMonth - prevMonthPatients) / prevMonthPatients) * 100).toFixed(1) : "100.0";
  const grossRevenue = Math.round((completedRevenueAgg[0]?.gross || 0) * 100) / 100;
  const platformCommission = Math.round(grossRevenue * commissionRate * 100) / 100;
  const workerPayoutTotal = Math.round((grossRevenue - platformCommission) * 100) / 100;
  const dailyGross = Math.round((dailyGrossAgg[0]?.gross || 0) * 100) / 100;
  const monthlyEarnings = Math.round((monthlyPeriodGrossAgg[0]?.gross || 0) * 100) / 100;

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
    totalRevenue: grossRevenue,
    platformCommission,
    workerPayoutTotal,
    commissionRatePercent: Math.round(commissionRate * 100),
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
      dailyEarnings: dailyGross,
      monthlyEarnings,
      platformCommission,
      workerPayoutTotal,
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
  const spec = String(specialization ?? "").trim();
  if (!isValidDoctorSpecialization(spec)) {
    return res.status(400).json({ message: "Invalid or missing medical specialization" });
  }
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already exists" });
  const doctor = await User.create({
    name,
    email,
    phone,
    password,
    role: "doctor",
    specialization: spec,
    status: "approved",
  });
  const profile = await DoctorProfile.create({
    user: doctor._id,
    specialization: spec,
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
  const applications = await DoctorProfile.find({ status: "pending" })
    .populate("user", "name email specialization experience degreeFile status")
    .sort({ createdAt: -1 });
  res.json(applications);
};

const listApprovedDoctors = async (req, res) => {
  const doctors = await DoctorProfile.find({ status: "approved" })
    .populate("user", "name email specialization experience degreeFile status suspendedUntil suspensionReason")
    .sort({ createdAt: -1 });
  const filtered = doctors.filter((item) => ["approved", "suspended"].includes(item?.user?.status));
  res.json(filtered);
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
    user.status = "blocked";
    user.suspendedUntil = null;
    user.suspensionReason = "Blocked by admin";
    await user.save();
  }

  res.json({ message: "Doctor blocked successfully" });
};

const suspendApprovedDoctor = async (req, res) => {
  const profile = await DoctorProfile.findById(req.params.id).populate("user");
  if (!profile) return res.status(404).json({ message: "Worker not found" });

  const hours = Number(req.body?.hours ?? 24);
  const safeHours = Number.isFinite(hours) && hours > 0 ? Math.min(hours, 24 * 30) : 24; // cap 30 days
  const until = new Date(Date.now() + safeHours * 60 * 60 * 1000);

  profile.isActive = false;
  // keep status approved so worker can still view dashboard and see suspend banner
  profile.status = "approved";
  await profile.save();

  const user = await User.findById(profile.user._id);
  if (user) {
    user.status = "suspended";
    user.suspendedUntil = until;
    user.suspensionReason = String(req.body?.reason || "Temporarily suspended by admin").trim();
    await user.save();
  }

  res.json({ message: "Worker temporarily suspended", suspendedUntil: until });
};

const unsuspendApprovedDoctor = async (req, res) => {
  const profile = await DoctorProfile.findById(req.params.id).populate("user");
  if (!profile) return res.status(404).json({ message: "Worker not found" });

  const user = await User.findById(profile.user._id);
  if (!user) return res.status(404).json({ message: "Worker account not found" });
  if (user.status !== "suspended") {
    return res.status(400).json({ message: "Worker is not temporarily suspended" });
  }

  user.status = "approved";
  user.suspendedUntil = null;
  user.suspensionReason = "";
  await user.save();

  profile.isActive = true;
  profile.status = "approved";
  await profile.save();

  res.json({ message: "Worker suspension removed" });
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
  suspendApprovedDoctor,
  unsuspendApprovedDoctor,
  blockApprovedDoctor,
};
