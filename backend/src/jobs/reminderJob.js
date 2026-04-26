const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { sendWhatsApp } = require("../services/whatsappService");

const startReminderJob = () => {
  cron.schedule("*/30 * * * *", async () => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dateString = in24Hours.toISOString().slice(0, 10);

    const appointments = await Appointment.find({
      date: dateString,
      status: { $in: ["pending", "accepted"] },
      reminderSent: false,
    }).populate("doctor", "name");

    for (const appointment of appointments) {
      const patient = await User.findById(appointment.patient);
      if (patient) {
        await sendWhatsApp({
          to: patient.phone,
          message: `Reminder: You have an appointment with Dr. ${appointment.doctor.name} on ${appointment.date} at ${appointment.timeSlot}.`,
        });
        appointment.reminderSent = true;
        await appointment.save();
      }
    }
  });
};

module.exports = startReminderJob;
