const dbConnection = require("./DB/dbConnection");
const userRouter = require("./routers/user");
const postRouter = require("./routers/post");
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
const accessLoStream = require("./middlewares/morgan");
require("dotenv").config({ path: "./config/.env" });

dbConnection();

const morgan = require("morgan");

morgan.format(
  "customformat",
  ":method :url :status - response-time ms :user-agent"
);

const express = require("express");
const app = express();

app.use(express.json());
app.use(morgan("customFormat", { stream: accessLoStream }));
app.use(sessionMiddleWare);
app.use(globalLimitter);
app.use(userLimitter);
app.use(globalSpeedLimitter);
app.use(userSpeedLimitter);

app.use(
  "/api/users",
  apiLimitter(10 * 60 * 1000, 100),
  apiSpeedLimitter(10 * 60 * 1000, 100, 4000),
  userRouter
);

app.use(
  "/api/posts",
  apiLimitter(10 * 60 * 1000, 100),
  apiSpeedLimitter(10 * 60 * 1000, 100, 4000),
  postRouter
);

// Listening on port :

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server Is Running On PORT ${PORT}`);
});
