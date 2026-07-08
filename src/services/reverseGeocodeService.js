const stripDistrict = (v) => (v ? String(v).replace(/\s+District$/i, "").trim() : "");

const uniquePush = (parts, seen, value, exclude = "") => {
  const s = value && String(value).trim();
  if (!s) return;
  const key = s.toLowerCase();
  const excludeKey = exclude && String(exclude).toLowerCase();
  if (key === excludeKey || seen.has(key)) return;
  seen.add(key);
  parts.push(s);
};

const parsePhotonProps = (p) => {
  if (!p) return null;

  const city =
    p.locality ||
    p.city ||
    p.district ||
    stripDistrict(p.county) ||
    p.state ||
    p.country ||
    "";

  const parts = [];
  const seen = new Set();
  const isStreet = p.type === "street" || p.osm_key === "highway" || p.type === "house";

  if (isStreet && p.name) uniquePush(parts, seen, p.name, city);
  uniquePush(parts, seen, p.locality, city);
  uniquePush(parts, seen, p.city, city);
  uniquePush(parts, seen, p.district, city);
  uniquePush(parts, seen, p.county, city);
  uniquePush(parts, seen, p.postcode, city);
  uniquePush(parts, seen, p.state, city);
  uniquePush(parts, seen, p.country, city);

  return { city, address: parts.join(", ") };
};

const parseNominatimAddress = (addr) => {
  if (!addr) return null;

  const city =
    addr.village ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.city_block ||
    addr.city ||
    addr.town ||
    stripDistrict(addr.district) ||
    addr.municipality?.replace(/\s+Tehsil$/i, "") ||
    addr.state ||
    addr.country ||
    "";

  const parts = [];
  const seen = new Set();

  if (addr.house_number && addr.road) {
    uniquePush(parts, seen, `${addr.house_number} ${addr.road}`, city);
  } else {
    uniquePush(parts, seen, addr.road, city);
  }
  uniquePush(parts, seen, addr.neighbourhood, city);
  uniquePush(parts, seen, addr.city_block, city);
  uniquePush(parts, seen, addr.village, city);
  uniquePush(parts, seen, addr.suburb, city);
  uniquePush(parts, seen, addr.municipality, city);
  uniquePush(parts, seen, addr.district, city);
  uniquePush(parts, seen, addr.postcode, city);
  uniquePush(parts, seen, addr.state, city);
  uniquePush(parts, seen, addr.country, city);

  return { city, address: parts.join(", ") };
};

async function fetchPhoton(lat, lng) {
  const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&lang=en`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const props = data?.features?.[0]?.properties;
  return parsePhotonProps(props);
}

async function fetchNominatim(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}&format=jsonv2&addressdetails=1&accept-language=en&zoom=18`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DoctorsOnHand/1.0 (reverse-geocode)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return parseNominatimAddress(data?.address);
}

async function fetchBigDataCloud(lat, lng) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const city =
    [data.city, data.locality, data.village].find((x) => x && String(x).trim()) ||
    data.principalSubdivision ||
    data.countryName ||
    "";
  const region = data.principalSubdivision && String(data.principalSubdivision).trim();
  const country = data.countryName && String(data.countryName).trim();
  const parts = [];
  const seen = new Set();
  uniquePush(parts, seen, region, city);
  uniquePush(parts, seen, country, city);
  return { city, address: parts.join(", ") };
}

async function reverseGeocodeLocation(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  const providers = [fetchPhoton, fetchNominatim, fetchBigDataCloud];
  for (const provider of providers) {
    try {
      const result = await provider(la, ln);
      if (result?.city || result?.address) return result;
    } catch {
      /* try next provider */
    }
  }
  return null;
}

module.exports = { reverseGeocodeLocation };
