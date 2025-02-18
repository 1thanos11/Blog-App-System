const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const accessLoStream = fs.createWriteStream(
  path.join(__dirname, "../logs/access.log"),
  { flags: "a" }
);

module.exports = accessLoStream;
