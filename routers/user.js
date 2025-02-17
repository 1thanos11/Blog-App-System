const {
  register,
  registerAsAdmin,
  login,
  mainPage,
  profile,
  logout,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  deleteProfilePicture,
  changeRole,
  getUserById,
  getAllUsers,
  search,
  addUsers,
  deleteUser,
  follow,
  adminSearch,
} = require("../controllers/user");

const { authentication, authorization } = require("../middlewares/auth");
const { uploadSingle } = require("../middlewares/multer");
const { userSchema } = require("../middlewares/joi");
const validator = require("../middlewares/validator");
const { apiLimitter } = require("../middlewares/rateLimitter");

const express = require("express");
const router = express.Router();

// Routers :

router.post("/register", validator(userSchema), register);

router.post("/register/as/admin", registerAsAdmin);

router.post("/login", login);

router.get("/main/page", authentication, mainPage);

router.get("/profile", authentication, profile);

router.delete("/logout", authentication, logout);

router.put("/update/profile", authentication, updateProfile);

router.put("/change/password", authentication, changePassword);

router.post(
  "/upload/profile/picture",
  authentication,
  uploadSingle,
  uploadProfilePicture
);

router.delete(
  "/delete/profile/picture",
  authentication,
  authorization(["admin", "user"]),
  deleteProfilePicture
);

router.put(
  "/change/role/:id",
  authentication,
  authorization(["admin"]),
  changeRole
);

router.get("/get/user/:id", authentication, getUserById);

router.get("/get/all/users", authentication, getAllUsers);

router.get("/search", authentication, search);

router.get(
  "/admin/search",
  authentication,
  authorization(["admin"]),
  adminSearch
);

router.post("/follow/:id", authentication, follow);

router.delete(
  "/delete/user/:id",
  authentication,
  authorization(["admin", "user"]),
  deleteUser
);

router.post(
  "/add/user",
  authentication,
  authorization(["admin"]),
  validator(userSchema),
  addUsers
);

module.exports = router;
