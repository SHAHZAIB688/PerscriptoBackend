require("dotenv").config();
const connectDB = require("./config/db");
const app = require("./app");
const startReminderJob = require("./jobs/reminderJob");

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
  startReminderJob();
};

start();
