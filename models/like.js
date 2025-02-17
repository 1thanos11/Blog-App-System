const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    postID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    commentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },

    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
