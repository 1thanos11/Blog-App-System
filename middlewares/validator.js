const validator = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return res
      .status(400)
      .send({ message: "Error Joi :", errors: error.message });
  }

  next();
};

module.exports = validator;
