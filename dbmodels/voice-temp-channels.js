const mongoose = require("mongoose");

const VoiceTempChannels = new mongoose.Schema({
  gid: String,
  channel_id: String,
  owner_id: String,
});

module.exports = mongoose.model("VoiceTempChannels", VoiceTempChannels);
