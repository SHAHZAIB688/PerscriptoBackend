const express = require("express");
const { createReview, getDoctorReviews, respondToReview } = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("patient"), createReview);
router.get("/doctor/:doctorId", getDoctorReviews);
router.put("/:id/respond", protect, authorize("doctor"), respondToReview);

module.exports = router;
