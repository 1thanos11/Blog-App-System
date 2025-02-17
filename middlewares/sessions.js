const session = require("express-session");
const MongoStore = require("connect-mongo");

const sessions = session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true,

  store: MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1/Blog-App",
    ttl: 14 * 24 * 60 * 60,
  }),

  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 600 * 1000,
  },
});

module.exports = sessions;
