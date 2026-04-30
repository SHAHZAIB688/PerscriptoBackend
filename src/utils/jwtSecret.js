const getJwtSecret = () => {
  const secret =
    process.env.JWT_SECRET ||
    process.env.JWT_KEY ||
    process.env.AUTH_SECRET ||
    "super_secret_key";

  if (!process.env.JWT_SECRET && !process.env.JWT_KEY && !process.env.AUTH_SECRET) {
    // eslint-disable-next-line no-console
    console.warn("No JWT secret found in env; using local default secret.");
  }

  return secret;
};

module.exports = getJwtSecret;
