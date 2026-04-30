const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      "mongodb://127.0.0.1:27017/perscripto";

    if (!process.env.MONGO_URI && !process.env.MONGODB_URI && !process.env.DATABASE_URL) {
      // eslint-disable-next-line no-console
      console.warn("No MongoDB URI found in env; using local default URI.");
    }

    await mongoose.connect(mongoUri);
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
