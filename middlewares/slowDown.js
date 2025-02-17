const slowDown = require("express-slow-down");

const globalSpeedLimitter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 10,
  delayMs: () => 4000,
});

const userSpeedLimitter = slowDown({
  windowMs: 10 * 60 * 1000,
  delayAfter: 5,
  delayMs: () => 4000,
  keyGenerator: (req) => req.headers["x-users-id"] || req.ip,
});

const apiSpeedLimitter = (windowMs, delayAfter, delayMs) => {
  return slowDown({
    windowMs: windowMs,
    delayAfter: delayAfter,
    delayMs: () => delayMs,
  });
};

module.exports = {
  globalSpeedLimitter,
  userSpeedLimitter,
  apiSpeedLimitter,
};
