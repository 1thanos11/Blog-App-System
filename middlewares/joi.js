const joi = require("joi");

const userSchema = joi.object({
  fName: joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphnum": "the first name must include characters and numbers only",
    "string.min": "the first name must at least 3 characters",
    "string.max": "the fistr name can not be more than 30 characters",
    "any.required": "the first name is required",
  }),

  lName: joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphnum": "the last name must include characters and numbers only",
    "string.min": "the last name must at least 3 characters",
    "string.max": "the last name can not be more than 30 characters",
    "any.required": "the last name is required",
  }),

  email: joi.string().email().required().messages({
    "string.email": "the email format is invalid",
    "any.required": "the email is required",
  }),

  password: joi.string().min(8).required().messages({
    "string.min": "the password must be at least 8 characters",
    "any.required": "the password is required",
  }),

  role: joi.string().valid("admin", "user").default("user").messages({
    "any.only": "Role Must be either 'admin' or 'user'",
  }),

  age: joi.number().integer().min(18).max(99).messages({
    "number.integer": "the age must be integer number",
    "number.min": "the age must be at least 18",
    "number.max": "the age must be less than 99",
  }),

  city: joi.string().min(2).messages({
    "string.min": "the city must be at least 2 characters",
  }),
});

const postSchema = joi.object({
  content: joi.string().max(1000).required().messages({
    "string.max": "the content can't increase than 1000 character",
    "any.required": "the content is required",
  }),
});

module.exports = {
  userSchema,
  postSchema,
};
