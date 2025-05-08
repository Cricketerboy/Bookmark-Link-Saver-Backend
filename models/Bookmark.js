const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  url: String,
  title: String,
  favicon: String,
  summary: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);
