const jwt = require("jsonwebtoken");
const getJwtSecret = require("./jwtSecret");

const generateToken = (id, role) =>
  jwt.sign({ id, role }, getJwtSecret(), { expiresIn: "7d" });

module.exports = generateToken;
