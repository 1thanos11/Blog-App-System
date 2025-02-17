const mongoose = require("mongoose");
const logger = require("../middlewares/winston");
const dbConnection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "Blog-App",
    })
    .then((data) => {
      console.log("DataBase Connected Successfully");
      logger.info("DataBase Is Connected");
    })
    .catch((error) => {
      console.log("DataBase Connection Failed", error);
      logger.error("DataBase Is Connected", error);
    });
};

module.exports = dbConnection;
