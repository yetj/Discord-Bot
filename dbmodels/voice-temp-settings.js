const mongoose = require("mongoose");

const VoiceTempSettings = new mongoose.Schema({
  gid: String,
  channel_id: String,
  new_channel_name: String,
  new_channel_category: String,
});

module.exports = mongoose.model("VoiceTempSettings", VoiceTempSettings);
