const mongoose = require("mongoose");

const VoiceTempSettingsSchema = new mongoose.Schema({
  gid: String,
  channel_id: String,
  new_channel_name: String,
  new_channel_category: String,
});

const VoiceTempSettings = mongoose.model("VoiceTempSettings", VoiceTempSettingsSchema);

const VoiceTempChannelsSchema = new mongoose.Schema({
  gid: String,
  channel_id: String,
  owner_id: String,
});

const VoiceTempChannels = mongoose.model("VoiceTempChannels", VoiceTempChannelsSchema);

module.exports = { VoiceTempSettings, VoiceTempChannels };
