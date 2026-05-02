const express = require("express");
const { body } = require("express-validator");
const { register, login, me, updateAccountProfile, updateHealthSummary } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const { DOCTOR_SPECIALIZATION_OPTIONS } = require("../constants/doctorSpecializations");

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "degreeFile", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("phone").notEmpty(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["patient", "doctor", "admin"]),
    body("specialization")
      .if(body("role").equals("doctor"))
      .trim()
      .notEmpty()
      .withMessage("Medical specialization is required for doctors")
      .isIn(DOCTOR_SPECIALIZATION_OPTIONS)
      .withMessage("Choose a valid medical specialization from the list"),
    body("experience")
      .if(body("role").equals("doctor"))
      .notEmpty()
      .withMessage("Years of experience is required for doctors")
      .isInt({ min: 0, max: 80 })
      .withMessage("Experience must be a number from 0 to 80"),
  ],
  validate,
  register
);
router.post("/login", [body("email").isEmail(), body("password").notEmpty()], validate, login);
router.get("/me", protect, me);
router.put("/profile", protect, authorize("patient", "doctor", "admin"), updateAccountProfile);
router.put("/health-summary", protect, authorize("patient"), updateHealthSummary);

module.exports = router;
