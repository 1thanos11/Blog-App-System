const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },

    commentImages: {
      type: [String],
      default: [],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    PostID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// To make virtual with likes :

commentSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "commentID",
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
