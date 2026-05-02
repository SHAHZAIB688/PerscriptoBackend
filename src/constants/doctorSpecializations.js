/**
 * Allowed doctor medical specializations (signup + profile updates).
 * Keep in sync with frontend: perscriptofrontend/.../HomeConstants.js → DOCTOR_SIGNUP_SPECIALIZATIONS
 */
const DOCTOR_SPECIALIZATION_OPTIONS = [
  "General Physician",
  "Family Medicine",
  "Internal Medicine",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Neurologist",
  "Orthopedic Surgeon",
  "Psychiatrist",
  "Gynecologist",
  "ENT Specialist",
  "Ophthalmologist",
  "Urologist",
  "Oncologist",
  "Gastroenterologist",
  "Pulmonologist",
  "Endocrinologist",
  "Nephrologist",
  "Rheumatologist",
  "Radiologist",
  "Anesthesiologist",
  "General Surgeon",
];

function isValidDoctorSpecialization(value) {
  const s = String(value ?? "").trim();
  return s.length > 0 && DOCTOR_SPECIALIZATION_OPTIONS.includes(s);
}

module.exports = {
  DOCTOR_SPECIALIZATION_OPTIONS,
  isValidDoctorSpecialization,
};
