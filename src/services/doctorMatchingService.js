const { resolveSpecializationsFromCondition } = require("../constants/conditionToSpecialization");

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const specRank = (doctorSpec, targetSpecs) => {
  const doc = String(doctorSpec || "").trim().toLowerCase();
  if (!doc || targetSpecs.length === 0) return -1;
  const idx = targetSpecs.findIndex((s) => {
    const t = String(s).toLowerCase();
    return doc === t || doc.includes(t) || t.includes(doc);
  });
  return idx;
};

const computeMatchScore = (doctor, targetSpecs, distanceKm) => {
  const rank = specRank(doctor.specialization, targetSpecs);
  let score = 0;

  if (rank === 0) score += 100;
  else if (rank > 0) score += 70 - rank * 8;
  else score += 15;

  const years = Number(doctor.experienceYears) || 0;
  const rating = Number(doctor.averageRating) || 0;
  const reviews = Number(doctor.numReviews) || 0;

  score += Math.min(years, 35) * 1.2;
  score += Math.min(rating, 5) * 10;
  score += Math.min(reviews, 100) * 0.15;

  if (Number.isFinite(distanceKm)) {
    score -= Math.min(distanceKm, 200) * 0.4;
  }

  return Math.round(score * 10) / 10;
};

const rankDoctorsForCondition = (doctors, { condition = "", lat, lng, radiusKm = 100 } = {}) => {
  const targetSpecs = resolveSpecializationsFromCondition(condition);
  const hasCondition = String(condition || "").trim().length > 0;
  const plat = Number(lat);
  const plng = Number(lng);
  const hasGeo = Number.isFinite(plat) && Number.isFinite(plng);
  const radius = Math.min(Math.max(Number(radiusKm) || 100, 5), 500);

  let list = doctors.map((d) => ({ ...d }));

  if (hasGeo) {
    list = list
      .map((d) => {
        const dlat = d.locationLat;
        const dlng = d.locationLng;
        if (!Number.isFinite(dlat) || !Number.isFinite(dlng)) {
          return { ...d, distanceKm: null };
        }
        const dist = haversineKm(plat, plng, dlat, dlng);
        return { ...d, distanceKm: Math.round(dist * 10) / 10 };
      })
      .filter((d) => d.distanceKm == null || d.distanceKm <= radius);
  }

  if (hasCondition) {
    list = list.map((d) => {
      const rank = specRank(d.specialization, targetSpecs);
      const matchScore = computeMatchScore(d, targetSpecs, d.distanceKm);
      return {
        ...d,
        matchScore,
        specializationMatch: rank >= 0,
        matchedSpecializations: targetSpecs,
      };
    });

    list.sort((a, b) => {
      if ((b.matchScore || 0) !== (a.matchScore || 0)) return (b.matchScore || 0) - (a.matchScore || 0);
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return (b.experienceYears || 0) - (a.experienceYears || 0);
    });

    if (list.length > 0) {
      list[0] = { ...list[0], recommended: true };
    }
  } else if (hasGeo) {
    list.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return {
    doctors: list,
    matchedSpecializations: targetSpecs,
    autoMatched: hasCondition,
  };
};

module.exports = { rankDoctorsForCondition, resolveSpecializationsFromCondition, computeMatchScore };
