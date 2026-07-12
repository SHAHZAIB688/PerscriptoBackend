require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const DoctorProfile = require("../src/models/DoctorProfile");
const { DOCTOR_SPECIALIZATION_OPTIONS } = require("../src/constants/doctorSpecializations");

const DAY_MAP = {
  M: "monday",
  Tu: "tuesday",
  W: "wednesday",
  Th: "thursday",
  F: "friday",
  Sa: "saturday",
  Su: "sunday",
};

const SPECIALTY_MAP = {
  gynecologist: "Gynecologist",
  obstetrician: "Gynecologist",
  "general-physician": "General Physician",
  "general physician": "General Physician",
  cardiologist: "Cardiologist",
  dermatologist: "Dermatologist",
  pediatrician: "Pediatrician",
  neurologist: "Neurologist",
  psychiatrist: "Psychiatrist",
  urologist: "Urologist",
  oncologist: "Oncologist",
  gastroenterologist: "Gastroenterologist",
  pulmonologist: "Pulmonologist",
  endocrinologist: "Endocrinologist",
  nephrologist: "Nephrologist",
  rheumatologist: "Rheumatologist",
  "ent-specialist": "ENT Specialist",
  dentist: "Dentist",
  hematologist: "Hematologist",
  "infectious-disease-specialist": "Infectious Disease Specialist",
  neonatologist: "Pediatrician",
};

const DEFAULT_PASSWORD = "OladocImport1!";

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

const isVideoHospital = (hospital) =>
  Boolean(
    hospital?.video_consultation ||
      hospital?.city === "Video Consultation" ||
      /video consultation/i.test(String(hospital?.name || ""))
  );

const parseOpeningHours = (timeStr) => {
  const match = String(timeStr || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { start: "09:00", end: "17:00" };

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const start = `${String(hours).padStart(2, "0")}:${minutes}`;
  const endHours = Math.min(hours + 3, 23);
  const end = `${String(endHours).padStart(2, "0")}:${minutes}`;
  return { start, end };
};

const mapAvailability = (availableDays, openingHours) => {
  const days = (availableDays || []).map((day) => DAY_MAP[day]).filter(Boolean);
  if (!days.length) return [];

  const { start, end } = parseOpeningHours(openingHours);
  return days.map((day) => ({
    day,
    startDay: day,
    endDay: day,
    start,
    end,
  }));
};

const mapSpecialization = (record) => {
  const slug = normalizeSlug(record.specialty_slug || record.primary_specialty);
  if (SPECIALTY_MAP[slug]) return SPECIALTY_MAP[slug];

  const primary = String(record.primary_specialty || "").trim();
  if (DOCTOR_SPECIALIZATION_OPTIONS.includes(primary)) return primary;

  const firstSlug = normalizeSlug(Array.isArray(record.specialty_slugs) ? record.specialty_slugs[0] : "");
  if (SPECIALTY_MAP[firstSlug]) return SPECIALTY_MAP[firstSlug];

  if (primary) return primary;
  return "General Physician";
};

const getHospitalList = (record) => {
  const merged = [
    ...(record.bookable_hospitals || []),
    ...(record.subscribed_hospitals || []),
    ...(record.hospitals || []),
  ];
  const seen = new Set();
  return merged.filter((hospital) => {
    const key = String(hospital.hospital_id || hospital.name || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mapHospitals = (record) =>
  getHospitalList(record).map((hospital) => ({
    hospitalId: String(hospital.hospital_id || ""),
    name: String(hospital.name || "").trim(),
    locality: String(hospital.locality || "").trim(),
    address: String(hospital.address || "").trim(),
    city: String(hospital.city || "").trim(),
    fee: Number(hospital.fee) || Number(record.maximum_fee) || 0,
    whenAvailable: String(hospital.when_available || "").trim(),
    videoConsultation: isVideoHospital(hospital),
    isPrimary: Boolean(hospital.is_primary),
    bookUrl: String(hospital.book_url || "").trim(),
  }));

const getPhysicalHospital = (record) => {
  const hospitals = getHospitalList(record);
  return (
    hospitals.find((h) => h.is_primary && !isVideoHospital(h)) ||
    hospitals.find((h) => !isVideoHospital(h)) ||
    hospitals.find((h) => h.is_primary) ||
    hospitals[0] ||
    null
  );
};

const mapDoctorRecord = (record) => {
  const hospital = getPhysicalHospital(record);
  const hospitals = mapHospitals(record);
  const oladocDoctorId = String(record.doctor_id || "").trim();
  const specialization = mapSpecialization(record);
  const services = Array.isArray(record.services?.items) ? record.services.items.filter(Boolean) : [];

  const locationAddress = hospital
    ? [hospital.name, hospital.address].filter(Boolean).join(", ")
    : [record.locality, record.locations].filter(Boolean).join(", ");

  return {
    oladocDoctorId,
    name: String(record.name || "").trim(),
    email: `oladoc.${oladocDoctorId}@import.perscripto.pk`,
    phone: String(hospital?.phone || record.phone || "0000000000").trim(),
    specialization,
    qualification: String(record.qualifications || "").trim(),
    experienceYears: Number(record.experience_years) || 0,
    image: String(record.profile_image || "").trim(),
    bio: String(record.description || "").trim(),
    consultationFee: Number(record.maximum_fee) || 0,
    averageRating: Number(record.rating) || 0,
    numReviews: Number(record.reviews_count) || 0,
    availability: mapAvailability(record.available_days, record.opening_hours),
    locationCity: String(hospital?.city || record.city || "").trim(),
    locationAddress,
    locationLat: hospital?.latitude ?? null,
    locationLng: hospital?.longitude ?? null,
    profileUrl: String(record.url || "").trim(),
    services,
    pmdcVerified: Boolean(record.pmdc_verified),
    pmdcId: String(record.pmdc_id || "").trim(),
    videoConsultationAvailable:
      Boolean(record.video_consultation_available) || hospitals.some((h) => h.videoConsultation),
    hospitals,
  };
};

const upsertDoctor = async (mapped) => {
  let profile = await DoctorProfile.findOne({ oladocDoctorId: mapped.oladocDoctorId });
  let user;

  if (profile) {
    user = await User.findById(profile.user);
    if (!user) {
      user = await User.create({
        name: mapped.name,
        email: mapped.email,
        phone: mapped.phone,
        password: DEFAULT_PASSWORD,
        role: "doctor",
        specialization: mapped.specialization,
        experience: mapped.experienceYears,
        image: mapped.image,
        status: "approved",
      });
      profile.user = user._id;
    } else {
      user.name = mapped.name;
      user.phone = mapped.phone;
      user.specialization = mapped.specialization;
      user.experience = mapped.experienceYears;
      user.image = mapped.image;
      user.status = "approved";
      await user.save();
    }
  } else {
    user = await User.findOne({ email: mapped.email });
    if (!user) {
      user = await User.create({
        name: mapped.name,
        email: mapped.email,
        phone: mapped.phone,
        password: DEFAULT_PASSWORD,
        role: "doctor",
        specialization: mapped.specialization,
        experience: mapped.experienceYears,
        image: mapped.image,
        status: "approved",
      });
    } else {
      user.name = mapped.name;
      user.phone = mapped.phone;
      user.specialization = mapped.specialization;
      user.experience = mapped.experienceYears;
      user.image = mapped.image;
      user.status = "approved";
      await user.save();
    }

    profile = await DoctorProfile.findOne({ user: user._id });
    if (!profile) {
      profile = new DoctorProfile({ user: user._id });
    }
  }

  Object.assign(profile, {
    specialization: mapped.specialization,
    qualification: mapped.qualification,
    experienceYears: mapped.experienceYears,
    image: mapped.image,
    status: "approved",
    bio: mapped.bio,
    consultationFee: mapped.consultationFee,
    averageRating: mapped.averageRating,
    numReviews: mapped.numReviews,
    availability: mapped.availability,
    isActive: true,
    locationCity: mapped.locationCity,
    locationAddress: mapped.locationAddress,
    locationLat: mapped.locationLat,
    locationLng: mapped.locationLng,
    profileUrl: mapped.profileUrl,
    services: mapped.services,
    pmdcVerified: mapped.pmdcVerified,
    pmdcId: mapped.pmdcId,
    videoConsultationAvailable: mapped.videoConsultationAvailable,
    hospitals: mapped.hospitals,
  });

  if (mapped.oladocDoctorId) {
    profile.oladocDoctorId = mapped.oladocDoctorId;
  } else {
    profile.oladocDoctorId = undefined;
  }

  await profile.save();
};

const importFile = async (filePath) => {
  const raw = fs.readFileSync(filePath, "utf8");
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) {
    throw new Error("JSON root must be an array of doctor records");
  }

  let imported = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const mapped = mapDoctorRecord(record);
      if (!mapped.oladocDoctorId || !mapped.name) {
        failed += 1;
        continue;
      }
      await upsertDoctor(mapped);
      imported += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed: ${record?.name || "unknown"} — ${error.message}`);
    }
  }

  return { imported, failed, total: records.length };
};

const collectJsonFiles = (inputPath) => {
  const resolved = path.resolve(inputPath);
  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(resolved)
      .filter((name) => name.endsWith(".json"))
      .map((name) => path.join(resolved, name))
      .sort();
  }
  return [resolved];
};

const main = async () => {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error("Usage: node scripts/importOladocDoctors.js <file-or-directory>");
    process.exit(1);
  }

  const files = collectJsonFiles(inputArg);
  if (!files.length) {
    console.error("No JSON files found to import");
    process.exit(1);
  }

  await connectDB();

  let totalImported = 0;
  let totalFailed = 0;

  for (const filePath of files) {
    console.log(`\nImporting ${path.basename(filePath)}...`);
    const result = await importFile(filePath);
    totalImported += result.imported;
    totalFailed += result.failed;
    console.log(`  ${result.imported}/${result.total} imported, ${result.failed} failed`);
  }

  console.log(`\nAll done. Imported/updated: ${totalImported}, failed: ${totalFailed}`);
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
