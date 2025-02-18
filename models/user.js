const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    fName: {
      type: String,
      trim: true,
      required: [true, "First name is required"],
      minlength: [3, "First name must be at least 3 characters"],
      maxlength: [30, "First name cannot exceed 30 characters"],
    },

    lName: {
      type: String,
      trim: true,
      required: [true, "Last name is required"],
      minlength: [3, "Last name must be at least 3 characters"],
      maxlength: [30, "Last name cannot exceed 30 characters"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email is required"],
      validate(email) {
        if (!validator.isEmail(email)) {
          throw new Error("Invalid Email");
        }
      },
    },

    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters long"],
      required: [true, "Password is required"],
      trim: true,

      validate(value) {
        let password = new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"
        );
        if (!password.test(value)) {
          throw new Error(
            "Password must include uppercase , lowercase , numbers , speacial characters"
          );
        }
      },
    },

    profilePicture: {
      type: String,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    age: {
      type: Number,
      required: [true, "Age is required"],

      validate(age) {
        if (age < 18) {
          throw new Error("You must be bigger than 18 years old");
        }
      },
    },

    city: {
      type: String,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    followersCount: {
      type: Number,
      default: 0,
    },

    followingsCount: {
      type: Number,
      default: 0,
    },

    tokens: [
      {
        type: String,
        required: true,
      },
    ],
  },
  { timestamps: true }
);

// To make a virtual relation to posts :

userSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "owner",
});

// To make a virtual relation to posts :

userSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "owner",
});

// To make a virtual relation to likes :

userSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "owner",
});

// To Hash the password before saving :

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// To generate token :

userSchema.methods.generateToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, process.env.secret_key);

  user.tokens = user.tokens.concat(token);

  await user.save();

  return token;
};

// To do login function :

userSchema.statics.findByCredentials = async (reqEmail, reqPassword) => {
  const user = await User.findOne({ email: reqEmail });

  if (!user) {
    throw new Error("Your Email Or Your Password Is In correct");
  }

  const isPassword = await bcrypt.compare(reqPassword, user.password);

  if (!isPassword) {
    throw new Error("Your Email Or Your Password Is In correct");
  }

  return user;
};

// To Hide private data :

userSchema.methods.toJSON = function () {
  const userJSON = this;

  const userOBJ = userJSON.toObject();

  delete userOBJ.password;
  delete userOBJ.email;
  delete userOBJ.role;

  return userOBJ;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
