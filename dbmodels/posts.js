const mongoose = require("mongoose");

const Posts = new mongoose.Schema({
  gid: String,
  message: String,
  author_id: String,
  author_name: String,
  type: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Posts", Posts);
