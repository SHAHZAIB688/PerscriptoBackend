/**
 * Clears empty-string oladocDoctorId values that break sparse unique indexes.
 * Run once: node scripts/fixOladocDoctorIdIndex.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");

const main = async () => {
  await connectDB();
  const col = mongoose.connection.db.collection("doctorprofiles");

  const result = await col.updateMany(
    { $or: [{ oladocDoctorId: "" }, { oladocDoctorId: null }] },
    { $unset: { oladocDoctorId: "" } }
  );

  console.log(`Cleared empty oladocDoctorId on ${result.modifiedCount} doctor profiles`);

  try {
    await col.dropIndex("oladocDoctorId_1");
    console.log("Dropped oladocDoctorId_1 index");
  } catch (error) {
    console.log(`Index drop skipped: ${error.message}`);
  }

  await col.createIndex({ oladocDoctorId: 1 }, { unique: true, sparse: true });
  console.log("Recreated sparse unique index on oladocDoctorId");

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
