const Post = require("../models/post");
const User = require("../models/user");
const Like = require("../models/like");
const Comment = require("../models/comment");
const Notification = require("../models/notification");
const logger = require("../middlewares/winston");

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// To create post :

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (req.files.length === 0 && !content) {
      return res.status(400).send({ message: "Please enter data to upload" });
    }

    const images = req.files ? req.files.map((file) => file.filename) : [];

    const post = new Post({
      content,
      owner: req.user.id,
      images,
    });

    await post.save();

    res.status(201).send({ message: "Post created successfully" });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Internal server error", error: error.message });
  }
};

// To get Post :

exports.getPostByID = async (req, res) => {
  try {
    const id = req.params.id;

    const post = await Post.findById(id)
      .populate({ path: "owner", select: "fName lName profilePicture" })
      .populate({
        path: "comments",
        populate: [
          { path: "owner", select: "fName lName profilePicture" },
          {
            path: "likes",
            populate: { path: "owner", select: "fName lName profilePicture" },
          },
        ],
      })
      .populate({
        path: "likes",
        populate: { path: "owner", select: "fName lName profilePicture" },
      });
    if (!post) {
      return res.status(404).send({ message: "No posts found" });
    }

    res.status(200).send({ post });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Internal server error", error: error.message });
  }
};

// To get all posts for user :

exports.getAllPosts = async (req, res) => {
  try {
    const id = req.params.id; // id for user

    const user = await User.findById(id);
    if (!user) {
      res.status(404).send({ message: "No users found" });
    }

    const posts = await Post.find({ owner: id })
      .populate({ path: "owner", select: "fName lName profilePicture" })
      .populate({
        path: "comments",
        populate: [
          {
            path: "likes",
            populate: { path: "owner", select: "fName lName profilePicture" },
          },
          { path: "owner", select: "fName lName profilePicture" },
        ],
      })
      .populate({
        path: "likes",
        populate: { path: "owner", select: "fName lName profilePicture" },
      });

    if (posts.length === 0) {
      return res.status(404).send({ message: "No posts found" });
    }

    res.status(200).send({ posts });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Internal server error", error: error.message });
  }
};

// To Update Post :

exports.updatePost = async (req, res) => {
  try {
    const user = req.user;
    const id = req.params.id;

    const { content } = req.body;

    const post = await Post.findOne({ owner: user._id, _id: id });
    if (!post) {
      return res.status(404).send({ message: "No posts found" });
    }

    if (post.owner.toString() !== user._id.toString()) {
      return res.status(401).send({ error: "You don't authorize" });
    }

    const oldImages = post.images;
    const newImages = req.files ? req.files.map((file) => file.filename) : [];

    const imagesToRemove = oldImages.filter(
      (image) => !newImages.includes(image)
    );

    // for (const image of imagesToRemove) {
    //   const imagePath = path.join(
    //     __dirname,
    //     "..",
    //     "uploads",
    //     "postsImages",
    //     image
    //   );

    //   // if (fs.existsSync(imagePath)) {
    //   //   fs.unlinkSync(imagePath);
    //   // }

    //   // OR :

    //   try {
    //     await fs.promises.access(imagePath);
    //     await fs.promises.unlink(imagePath);
    //   } catch (error) {
    //     return res.status(500).send({
    //       message: `Can't delete image ${imagePath}`,
    //       error: error.message,
    //     });
    //   }
    // }

    // more profissional code :

    const deleteImages = imagesToRemove.map((image) => {
      const imagePath = path.join(__dirname, `../uploads/postsImages/${image}`);

      return fs.promises
        .stat(imagePath)
        .then(() => {
          return fs.unlink(imagePath);
        })
        .catch((error) => {
          logger.error(`Error deleting image ${image}: ${error.message}`);
          return null;
        });
    });

    await Promise.all(deleteImages);

    post.content = content || post.content;
    post.images = newImages.length > 0 ? newImages : post.images;

    await post.save();

    res.status(200).send({ message: "post updated successfully" });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Internal server error", error: error.message });
  }
};

// To delete post :

exports.deletePost = async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.user;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).send({ message: "No posts found" });
    }

    if (
      post.owner.toString() !== user._id.toString() ||
      user.role !== "admin"
    ) {
      return res.status(401).send({ error: "You don't authorize" });
    }

    if (post.images.length > 0) {
      const imagesDeletion = post.images.map((image) => {
        const imagePath = path.join(
          __dirname,
          `../uploads/postsImages/${image}`
        );

        return fs.promises.unlink(imagePath).catch((error) => {
          logger.error(`Error deleting image ${image}: ${error.message}`);
        });
      });

      await Promise.all(imagesDeletion);
    }

    await Post.findByIdAndDelete(id);

    res.status(200).send({ message: "Post deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting post: ${error.message}`);
    res
      .status(500)
      .send({ message: "Internal server error", error: error.message });
  }
};

// To search for post :

exports.search = async (req, res) => {
  try {
    const { content } = req.query;

    if (!content) {
      return res.status(404).send({ message: "enter a search query" });
    }

    const posts = await Post.find({
      content: { $regex: content, $options: "i" },
    })
      .populate({ path: "owner", select: "fName lName profilePicture" })
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

    if (posts.length === 0) {
      return res.status(404).send({ message: "No Posts found" });
    }

    res.status(200).send({ message: "Posts found :", posts });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Internal server error", error: error.message });
  }
};

// To like a Post :

exports.likePost = async (req, res) => {
  try {
    const user = req.user;
    const id = req.params.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).send({ message: "No Posts found" });
    }

    const isExist = await Like.findOne({ owner: user._id, postID: post._id });

    if (isExist) {
      await Like.deleteOne({ _id: isExist });
      post.likesCount -= 1;
      await post.save();
      return res.status(200).send({ message: "like removed successfully" });
    }

    const like = new Like({
      owner: user._id,
      postID: post._id,
    });

    post.likesCount += 1;

    await post.save();
    await like.save();

    res.status(200).send({ message: "liked successfully" });

    const notification = new Notification({
      to: post.owner,
      from: user._id,
      subject: `${user.fName} liked your Post ${post.content}`,
    });

    await notification.save();
  } catch (error) {
    res
      .status(500)
      .send({ message: "Internal server error", error: error.message });
  }
};
