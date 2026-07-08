const express = require("express");
const { reverseGeocode } = require("../controllers/geoController");

const router = express.Router();

router.get("/reverse", reverseGeocode);

module.exports = router;
