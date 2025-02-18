const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// To make a virtual with comments :

postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postID",
});

// To make a virtual with likes :

postSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "postID",
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
