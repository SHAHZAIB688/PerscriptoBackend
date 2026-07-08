/**
 * Maps patient symptoms / diseases (keywords) to doctor specializations.
 * Order in each array = preference (most relevant first).
 */
const CONDITION_RULES = [
  { keywords: ["heart", "chest pain", "palpitation", "blood pressure", "hypertension", "cardiac", "angina", "heartbeat"], specializations: ["Cardiologist", "General Physician"] },
  { keywords: ["skin", "rash", "acne", "eczema", "dermatitis", "itch", "psoriasis", "hair fall", "alopecia"], specializations: ["Dermatologist", "General Physician"] },
  { keywords: ["child", "baby", "infant", "pediatric", "vaccination", "newborn"], specializations: ["Pediatrician", "General Physician"] },
  { keywords: ["brain", "headache", "migraine", "seizure", "epilepsy", "stroke", "numbness", "paralysis", "neurology"], specializations: ["Neurologist", "General Physician"] },
  { keywords: ["bone", "joint", "fracture", "arthritis", "knee pain", "back pain", "spine", "orthopedic", "sprain"], specializations: ["Orthopedic Surgeon", "Rheumatologist", "General Physician"] },
  { keywords: ["depression", "anxiety", "stress", "mental", "panic", "mood", "psychiatric", "sleep disorder", "insomnia"], specializations: ["Psychiatrist", "General Physician"] },
  { keywords: ["pregnancy", "period", "menstrual", "gynec", "ovary", "fertility", "pcos", "pregnant", "women health"], specializations: ["Gynecologist", "General Physician"] },
  { keywords: ["ear", "nose", "throat", "sinus", "tonsil", "hearing", "snoring", "ent"], specializations: ["ENT Specialist", "General Physician"] },
  { keywords: ["eye", "vision", "cataract", "glaucoma", "blind", "ophthalm"], specializations: ["Ophthalmologist", "General Physician"] },
  { keywords: ["urine", "kidney", "bladder", "prostate", "urology", "urinary"], specializations: ["Urologist", "Nephrologist", "General Physician"] },
  { keywords: ["cancer", "tumor", "oncology", "chemotherapy"], specializations: ["Oncologist", "General Physician"] },
  { keywords: ["stomach", "digest", "liver", "gastric", "ulcer", "diarrhea", "constipation", "vomit", "nausea", "acid reflux", "hepatitis"], specializations: ["Gastroenterologist", "General Physician"] },
  { keywords: ["lung", "asthma", "breath", "breathing", "cough", "tb", "tuberculosis", "pneumonia", "copd"], specializations: ["Pulmonologist", "General Physician"] },
  { keywords: ["diabetes", "thyroid", "hormone", "endocrine", "sugar", "obesity", "weight"], specializations: ["Endocrinologist", "General Physician"] },
  { keywords: ["dialysis", "kidney failure", "renal"], specializations: ["Nephrologist", "General Physician"] },
  { keywords: ["autoimmune", "lupus", "rheumat"], specializations: ["Rheumatologist", "General Physician"] },
  { keywords: ["x-ray", "scan", "mri", "ct scan", "imaging", "radiolog"], specializations: ["Radiologist", "General Physician"] },
  { keywords: ["surgery", "operate", "appendix", "hernia", "gallbladder"], specializations: ["General Surgeon", "General Physician"] },
  { keywords: ["fever", "flu", "cold", "infection", "general", "checkup", "weakness", "fatigue"], specializations: ["General Physician", "Family Medicine", "Internal Medicine"] },
  { keywords: ["diabetes", "bp", "chronic"], specializations: ["Internal Medicine", "Family Medicine", "General Physician"] },
];

const DEFAULT_SPECIALIZATIONS = ["General Physician", "Family Medicine", "Internal Medicine"];

function resolveSpecializationsFromCondition(conditionText) {
  const text = String(conditionText || "").trim().toLowerCase();
  if (!text) return [];

  const matched = [];
  const seen = new Set();

  for (const rule of CONDITION_RULES) {
    const hit = rule.keywords.some((kw) => text.includes(kw));
    if (!hit) continue;
    for (const spec of rule.specializations) {
      if (!seen.has(spec)) {
        seen.add(spec);
        matched.push(spec);
      }
    }
  }

  if (matched.length === 0) {
    for (const spec of DEFAULT_SPECIALIZATIONS) {
      if (!seen.has(spec)) {
        seen.add(spec);
        matched.push(spec);
      }
    }
  }

  return matched;
}

module.exports = { CONDITION_RULES, DEFAULT_SPECIALIZATIONS, resolveSpecializationsFromCondition };
