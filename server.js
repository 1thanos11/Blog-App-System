const dbConnection = require("./DB/dbConnection");
const userRouter = require("./routers/user");
const sessionMiddleWare = require("./middlewares/sessions");
const logger = require("./middlewares/winston");
const {
  globalLimitter,
  userLimitter,
  apiLimitter,
} = require("./middlewares/rateLimitter");
const {
  globalSpeedLimitter,
  userSpeedLimitter,
  apiSpeedLimitter,
} = require("./middlewares/slowDown");
require("dotenv").config({ path: "./config/.env" });

dbConnection();

const express = require("express");
const app = express();

app.use(express.json());
app.use(sessionMiddleWare);
app.use(globalLimitter);
app.use(userLimitter);

app.use(
  "/api/users",
  apiLimitter(10 * 60 * 1000, 100),
  apiSpeedLimitter(10 * 60 * 1000, 100, 4000),
  userRouter
);

// Listening on port :

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server Is Running On PORT ${PORT}`);
  logger.info("Server IS running");
});
