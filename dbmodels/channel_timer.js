const mongoose = require("mongoose");

const ChannelTimerSchema = new mongoose.Schema({
  gid: String,
  last_updated: Date,
  channel_id: String,
  timezone: { type: String, default: "UTC" },
  text: { type: String, default: "{clock} {time} UTC" },
});

const ChannelTimer = mongoose.model("ChannelTimer", ChannelTimerSchema);

module.exports = { ChannelTimer };
