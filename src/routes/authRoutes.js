const express = require("express");
const { body } = require("express-validator");
const { register, login, me, updateHealthSummary } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

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
  ],
  validate,
  register
);
router.post("/login", [body("email").isEmail(), body("password").notEmpty()], validate, login);
router.get("/me", protect, me);
router.put("/health-summary", protect, authorize("patient"), updateHealthSummary);

module.exports = router;
