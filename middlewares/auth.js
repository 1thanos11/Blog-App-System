const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authentication = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    const decode = jwt.verify(token, process.env.secret_key);

    const user = await User.findOne({ _id: decode._id, tokens: token });

    if (!user) {
      throw new Error();
    }
    req.user = user;
    req.token = token;

    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate" });
  }
};

const authorization = (roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).send({ error: "You don't authorize" });
    }

    next();
  };
};

module.exports = {
  authentication,
  authorization,
};
