const rateLimitter = require("express-rate-limit");

const globalLimitter = rateLimitter({
  windowMs: 15 * 60 * 1000, // 1 minute
  max: 100,
  message: "Too many requests (from global limitter)",
});

const userLimitter = rateLimitter({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: "Too many requests (from user limitter)",
  keyGenerator: (req) => req.headers["x-user-id"] || req.ip,
});

const apiLimitter = (windowMs, max) => {
  return rateLimitter({
    windowMs: windowMs,
    max: max,
    message: "Too many requests (from API limitter)",
  });
};

module.exports = {
  globalLimitter,
  userLimitter,
  apiLimitter,
};
