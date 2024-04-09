const mongoose = require("mongoose");

const Settings = new mongoose.Schema({
  gid: String,
  key: String,
  value: String,
});

module.exports = mongoose.model("Settings", Settings);
