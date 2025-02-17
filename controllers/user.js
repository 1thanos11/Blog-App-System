const Follows = require("../models/follow");
const User = require("../models/user");
const Post = require("../models/post");
const Notification = require("../models/notification");

const logger = require("../middlewares/winston");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
// const session = require("../middlewares/sessions"); // Note : this is don't work
const mongoose = require("mongoose");

// To Register :

exports.register = async (req, res) => {
  try {
    const { fName, lName, email, password, role, age, city } = req.body;

    const user = new User({
      fName,
      lName,
      email,
      password,
      role: "user",
      age,
      city,
    });

    await user.save();

    res.status(201).send({ message: "registered successfully" });

    logger.info(`user ${user._id} registered`);
  } catch (error) {
    res.status(500).send({ error: "Internal server error", error });
  }
};

// To Register as admin :

exports.registerAsAdmin = async (req, res) => {
  try {
    const { fName, lName, email, password, role, age, city } = req.body;

    const user = new User({
      fName,
      lName,
      email,
      password,
      role: "admin",
      age,
      city,
    });

    await user.save();

    res.status(201).send({ message: "registered successfully" });

    logger.info(`admin ${user._id} registered`);
  } catch (error) {
    res.status(500).send({ error: "Internal server error", error });
  }
};

// To login :

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByCredentials(email, password);

    await user.generateToken();

    req.session.user = {
      _id: user._id,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      city: user.city,
    };

    res.status(201).send({ message: "logged in successfully", user });

    logger.info(`user ${user._id} logged in`);
  } catch (error) {
    res.status(500).send({ error: "Internal server error", error });
  }
};

// To create main page :

exports.mainPage = async (req, res) => {
  try {
    const id = req.user._id;
    const user = req.user;

    const docs = await Follows.find({ follower: id }).select("following");

    if (!docs.length) {
      return res.status(404).send({ message: "No content yet" });
    }

    const followingIds = docs.map((doc) => doc.following);

    const posts = await Post.find({ owner: { $in: followingIds } })
      .populate({
        path: "likes",
        populate: { path: "owner", select: "fName lName profilePicture" },
      })
      .populate({
        path: "comments",
        populate: [
          { path: "owner", select: "fName lName profilePicture" },
          {
            path: "likes",
            populate: {
              path: "owner",
              select: "fName lName profilePicture",
            },
          },
        ],
      });

    if (!posts.length) {
      return res.status(404).send({ message: "No content yet" });
    }

    res.status(200).send({ posts, user });

    // @important : another approch to get posts (with Promise.all) but its performance is bad :

    // const posts = await Promise.all(
    //   followingIds.map(async (followingId) => {
    //     return await Post.find({ owner: followingId })
    //       .populate({
    //         path: "likes",
    //         populate: { path: "owner", select: "fName lName profilePicture" },
    //       })
    //       .populate({
    //         path: "comments",
    //         populate: [
    //           { path: "owner", select: "fName lName profilePicture" },
    //           {
    //             path: "likes",
    //             populate: {
    //               path: "owner",
    //               select: "fName lName profilePicture",
    //             },
    //           },
    //         ],
    //       });
    //   })
    // );

    // const flattenedPosts = posts.flat();

    // if (flattenedPosts.length === 0) {
    //   return res.status(404).send({ message: "No content yet" });
    // }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
};

// To get profile :

exports.profile = async (req, res) => {
  try {
    const user = req.user;
    const posts = await Post.find({ owner: user._id })
      .populate({
        path: "likes",
        populate: { path: "owner", select: "fName lName profilePicture" },
      })
      .populate({
        path: "comments",
        populate: [
          { path: "owner", select: "fName lName profilePicture" },
          {
            path: "likes",
            populate: { path: "owner", select: "fName lName profilePicture" },
          },
        ],
      });

    res.status(200).send({ message: "this is your profile", user, posts });

    logger.info(`user ${user._id} in his profile`);
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

// To logout :

exports.logout = async (req, res) => {
  try {
    const user = req.user;

    user.tokens = user.tokens
      ? user.tokens.filter((token) => token !== req.token)
      : [];

    req.session.destroy((error) => {
      if (error) {
        return res
          .status(500)
          .send({ error: "Internal server error can't log out" });
      }
    });

    await req.user.save();

    res.status(200).send({ message: "logged out successfully" });

    logger.info(`user ${user._id} logged out`);
  } catch (error) {
    res.status(500).send({ error: "Internal server error", error });
    logger.error("Error :", error);
  }
};

// To updat profile data :

exports.updateProfile = async (req, res) => {
  try {
    const { fName, lName, email, city } = req.body;
    const user = await User.findOne({ _id: req.user._id }).select(
      "-password -tokens"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = {};
    if (fName && fName !== user.fName) updates.fName = fName;
    if (lName && lName !== user.lName) updates.lName = lName;
    if (email && email !== user.email) updates.email = email;
    if (city && city !== user.city) updates.city = city;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No changes detected" });
    }

    Object.assign(user, updates);
    await user.save();

    res
      .status(200)
      .json({ message: "User updated successfully", user: user.toJSON() });

    logger.info(`User ${user._id} updated profile: ${JSON.stringify(updates)}`);
  } catch (error) {
    res.status(500).json({ error: "Internal server error", error });
  }
};

// To change password :

exports.changePassword = async (req, res) => {
  try {
    const user = req.user;

    const { oldPassword, newPassword } = req.body;

    const keys = Object.keys(req.body);

    if (keys.length > 2) {
      return res
        .status(400)
        .send({ error: "Enetr the old password and new passowrd only" });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);

    if (!isValid) {
      return res.status(400).send({ error: "the password is not correct" });
    }

    user.password = newPassword;

    await user.save();

    res.status(201).send({ message: "password changed successfully" });

    logger.info(`user ${user._id} change his password to ${newPassword}`);
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

// To upload Profile Picture :

exports.uploadProfilePicture = async (req, res) => {
  try {
    const user = req.user;

    if (!req.file) {
      return res.status(400).send({ error: "No Images Uploaded" });
    }

    if (user.profilePicture) {
      const oldImage = path.join(
        __dirname,
        "..",
        `uploads/pdofilePictures/${user.profilePicture}`
      );

      try {
        await fs.promises.unlink(oldImage);
      } catch (error) {
        if (error.code !== "ENOENT") {
          logger.error(`can't delete Image ${oldImage}`);
        }
      }
    }

    user.profilePicture = req.file.filename;
    await user.save();

    res.status(201).send({
      message: "Profile picture uploaded successfully",
      filePath: req.file.path,
      fileName: req.file.filename,
    });

    logger.info(`User ${user._id} changed their profile picture.`);
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

// To delete profle picture :

exports.deleteProfilePicture = async (req, res) => {
  try {
    const user = req.user;

    if (user.profilePicture) {
      const oldImage = path.join(
        __dirname,
        "..",
        `uploads/pdofilePictures/${user.profilePicture}`
      );

      try {
        await fs.promises.access(oldImage);
        await fs.promises.unlink(oldImage);
      } catch (error) {
        if (error.code !== "ENOENT") {
          logger.error(`Failed to delete image ${oldImage}:`, error);
        }
      }
    }

    user.profilePicture = null;

    await user.save();

    res.status(200).send({ message: "profile picture deleted successfully" });

    logger.info(`user ${user._id} deleted his Profile Picture`);
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

// To change role :
// Note : check if the system will accept not existing role :

exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;

    const id = req.params.id;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send({ error: "user not found" });
    }

    if (user.role === role) {
      return res
        .status(400)
        .send({ error: `The user ${user._id} is already ${role}` });
    }

    user.role = role;

    await user.save();

    res.status(201).send({ message: "role changed successfully" });

    const notification = new Notification({
      from: req.user._id,
      to: user._id,
      subject: `the admin ${req.user.fName} change your role to ${role}`,
    });

    await notification.save();

    logger.info(
      `admin ${req.user._id} deleted change role of user ${user._id}`
    );
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

// To Get specific user :

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id)
      .populate({
        path: "posts",
        populate: {
          path: "likes",
          populate: { path: "owner", select: "fName lName profilePicture" },
        },
      })
      .populate({
        path: "comments",
        populate: [
          { path: "owner", select: "fName lName profilePicture" },

          {
            path: "likes",
            populate: { path: "owner", select: "fName lName profilePicture" },
          },
        ],
      });

    if (!user) {
      return res.status(404).send({ message: "user not found" });
    }

    res.status(200).send({ message: "the user :", user });
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

// To Get All Users :

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});

    if (users.length === 0) {
      return res.status(404).send({ message: "No users found" });
    }

    res.status(200).send({ message: "users :", users });
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

// To search for users :

exports.search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Enter a query key please" });
    }

    const users = await User.find({
      $or: [
        { fName: { $regex: q, $options: "i" } },
        { lName: { $regex: q, $options: "i" } },
      ],
    }).select("fName lName profilePicture");

    res.status(200).json({ message: "Users found", users });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// To do admin Search :

exports.adminSearch = async (req, res) => {
  try {
    const { fName, lName, minAge, maxAge, city, email, id, role } = req.query;

    if (
      !fName &&
      !lName &&
      !minAge &&
      !maxAge &&
      !city &&
      !email &&
      !id &&
      !role
    ) {
      return res.status(400).send({ error: "Enter a Search Query" });
    }

    let filter = {};

    if (fName) filter.fName = { $regex: new RegExp(fName, "i") };
    if (lName) filter.lName = { $regex: new RegExp(lName, "i") };
    if (email) filter.email = { $regex: new RegExp(email, "i") };
    if (role) filter.role = { $regex: new RegExp(role, "i") };
    if (city) filter.role = { $regex: new RegExp(city, "i") };

    // convert id :

    if (id) {
      try {
        filter._id = new mongoose.Types.ObjectId(id);
      } catch (error) {
        return res.status(400).send({ error: "invalid id format" });
      }
    }

    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = parseInt(minAge);
      if (maxAge) filter.age.$lte = parseInt(maxAge);
    }

    const users = await User.find(filter);

    if (!users) {
      return res.status(404).send({ message: "No users found" });
    }

    res.status(200).send({ message: "users found", users });

    // => another approach :

    // if (
    //   !fName &&
    //   !lName &&
    //   !minAge &&
    //   !maxAge &&
    //   !city &&
    //   !email &&
    //   !id &&
    //   !role
    // ) {
    //   return res.status(400).send({ error: "Enter a Search Query" });
    // }

    // const users = await User.find({
    //   $or: [
    //     { fName: { $regex: fName || "", $options: "i" } },
    //     { lName: { $regex: lName || "", $options: "i" } },
    //     { email: { $regex: email || "", $options: "i" } },
    //     { city: { $regex: city || "", $options: "i" } },
    //     { role: { $regex: role || "", $options: "i" } },
    //     { id: id ? { $regex: id, $options: "i" } : undefined },
    //     {
    //       $and:
    //         minAge && maxAge
    //           ? [
    //               { age: { $gte: parseInt(minAge) } },
    //               { age: { $lte: parseInt(maxAge) } },
    //             ]
    //           : [],
    //     },
    //   ].filter(Boolean),
    // });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// To Add users By admin :

exports.addUsers = async (req, res) => {
  try {
    const { fName, lName, email, password, role, age, city } = req.body;

    const user = new User({ fName, lName, email, password, role, age, city });
    await user.save();

    res.status(201).send({
      message: "The user added successfully",
      data: { fName, lName, email, role, age, city },
    });

    logger.info(`Admin ${req.user._id} added new user ${user._id}`);
  } catch (error) {
    console.error("Add user error:", error);
    res.status(500).send({ error: "Internal server error", error });
  }
};

// To delete User :

exports.deleteUser = async (req, res) => {
  try {
    const user = req.user;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid user ID" });
    }

    const userInDataBase = await User.findById(id);

    if (!userInDataBase) {
      return res.status(404).send({ error: "User not found" });
    }

    if (user._id.toString() !== id && user.role !== "admin") {
      return res.status(403).send({ error: "You are not authorized" });
    }

    if (user.profilePicture) {
      const oldImage = path.join(__dirname, "..", user.profilePicture);
      try {
        await fs.promises.access(oldImage);
        await fs.promises.unlink(oldImage);
      } catch (error) {
        logger.error(`Failed to delete image ${oldImage}:`, error);
      }
    }

    await User.findByIdAndDelete(id);

    res.status(200).send({ message: "User deleted successfully" });

    logger.info(`User ${userInDataBase._id} deleted their account.`);
  } catch (error) {
    logger.error("Error deleting user:", error);
    res.status(500).send({ error: "Internal server error" });
  }
};

// To follow and un follow :

exports.follow = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const followerId = req.user._id;
    const followingId = req.params.id;

    if (!followingId) {
      throw new Error("No users found");
    }

    const following = await User.findById(followingId).session(session);
    if (!following) {
      throw new Error("No users found");
    }

    const existingFollow = await Follows.findOne(
      { follower: followerId, following: followingId },
      null,
      { session }
    );

    if (existingFollow) {
      await Follows.deleteOne({ _id: existingFollow._id }, { session });
      await User.updateOne(
        { _id: followerId },
        { $inc: { followingsCount: -1 } },
        { session }
      );
      await User.updateOne(
        { _id: followingId },
        { $inc: { followersCount: -1 } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).send({ message: "Unfollowed successfully" });
    }

    const followDoc = new Follows({
      follower: followerId,
      following: followingId,
    });
    await followDoc.save({ session });

    await User.updateOne(
      { _id: followerId },
      { $inc: { followingsCount: 1 } },
      { session }
    );
    await User.updateOne(
      { _id: followingId },
      { $inc: { followersCount: 1 } },
      { session }
    );

    const notification = new Notification({
      from: followerId,
      to: followingId,
      subject: `User ${req.user.fName} followed you`,
    });

    await notification.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).send({ message: "Followed successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Follow error:", error);
    res.status(500).send({ error: error.message || "Internal server error" });
  }
};
