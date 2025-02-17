const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
    },

    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
