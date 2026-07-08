const { reverseGeocodeLocation } = require("../services/reverseGeocodeService");

const reverseGeocode = async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ message: "Valid lat and lng query parameters are required" });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ message: "Coordinates out of range" });
  }

  try {
    const location = await reverseGeocodeLocation(lat, lng);
    if (!location) {
      return res.status(404).json({ message: "Could not resolve coordinates to a place name" });
    }
    return res.json(location);
  } catch {
    return res.status(502).json({ message: "Reverse geocoding service unavailable" });
  }
};

module.exports = { reverseGeocode };
