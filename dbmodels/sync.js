const mongoose = require("mongoose");

const Sync = new mongoose.Schema({
  gid: String,
  source: String,
  role_gid: String,
  role_source: String,
  log_gid: String,
  same_role: { type: Boolean, default: false },
  update_nick: Boolean,
  prefix: String,
  space_after_prefix: { type: Boolean, default: true },
  created_by: String,
  added: { type: Date, default: Date.now },
  name: String,
});

module.exports = mongoose.model("Sync", Sync);
