const mongoose = require("mongoose");

const PhrasesSchema = new mongoose.Schema({
  gid: String,
  name: String,
  description: String,
  content: String,
  embed: { type: Boolean, default: false },
  allowedRoles: { type: [String], default: [] },
});

const Phrases = mongoose.model("Phrases", PhrasesSchema);

module.exports = { Phrases };
