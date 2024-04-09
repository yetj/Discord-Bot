const mongoose = require("mongoose");

const Sync = new mongoose.Schema({
  gid: String,
  source: String,
  role_gid: String,
  role_source: String,
  log_gid: String,
  same_role: Number,
  update_nick: Number,
  prefix: String,
  created_by: String,
  added: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sync", Sync);
