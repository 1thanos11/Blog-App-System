const {
  createPost,
  getPostByID,
  getAllPosts,
  updatePost,
  deletePost,
  search,
  likePost,
} = require("../controllers/post");

const { authentication, authorization } = require("../middlewares/auth");
const { postSchema } = require("../middlewares/joi");
const validator = require("../middlewares/validator");
const { uploadMultiplePost } = require("../middlewares/multer");

const express = require("express");
const router = express.Router();

router.post("/create/post", authentication, uploadMultiplePost, createPost);

router.get("/get/post/:id", authentication, getPostByID);

router.get(
  "/get/all/posts/:id",
  authentication,
  authorization(["admin"]),
  getAllPosts
);

router.put("/update/post/:id", authentication, uploadMultiplePost, updatePost);

router.delete(
  "/delete/post/:id",
  authentication,
  authorization(["admin", "user"]),
  deletePost
);

router.get("/search", authentication, search);

router.post("/like/post/:id", authentication, likePost);

module.exports = router;
