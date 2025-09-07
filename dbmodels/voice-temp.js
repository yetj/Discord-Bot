const mongoose = require("mongoose");

const VoiceTempSettingsSchema = new mongoose.Schema({
  gid: String,
  channel_id: String,
  new_channel_name: String,
  new_channel_category: String,
  can_edit_name: { type: Boolean, default: true },
  can_edit_limit: { type: Boolean, default: true },
});

const VoiceTempSettings = mongoose.model("VoiceTempSettings", VoiceTempSettingsSchema);

const VoiceTempChannelsSchema = new mongoose.Schema({
  gid: String,
  channel_id: String,
  owner_id: String,
  can_edit_name: { type: Boolean, default: true },
  can_edit_limit: { type: Boolean, default: true },
});

const VoiceTempChannels = mongoose.model("VoiceTempChannels", VoiceTempChannelsSchema);

module.exports = { VoiceTempSettings, VoiceTempChannels };
