require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const startReminderJob = require("./jobs/reminderJob");
const { attachVideoSignaling, parseSocketCorsOrigins } = require("./socket/videoSignaling");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: parseSocketCorsOrigins(),
    methods: ["GET", "POST"],
  },
});
attachVideoSignaling(io);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
  startReminderJob();
};

start();
