const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

// Storage for Pdofile Pictures :

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/pdofilePictures");
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");

    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Storage for POSTS :

const postsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/postsImages");
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");

    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Storage for Comments :

const commentsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/commentsImages");
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");

    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const checkFileTypes = function (file, cb) {
  const fileTypes = ["image/jpeg", "image/png", "image/webp"];

  if (fileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, png, and webp files are allowed"));
  }
};

// upload for Profile Pictures :

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    checkFileTypes(file, cb);
  },
});

// upload for Posts :

const uploadPosts = multer({
  storage: postsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    checkFileTypes(file, cb);
  },
});

// upload for Comments :

const uploadComments = multer({
  storage: commentsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    checkFileTypes(file, cb);
  },
});

const uploadSingle = upload.single("profilePicture");
const uploadMultiplePost = uploadPosts.array("images", 5);
const uploadMultipleComment = uploadComments.array("commentImages", 5);

module.exports = {
  uploadSingle,
  uploadMultiplePost,
  uploadMultipleComment,
};
