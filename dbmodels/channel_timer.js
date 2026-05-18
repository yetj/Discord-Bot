const mongoose = require("mongoose");

const ChannelTimerSchema = new mongoose.Schema({
  gid: String,
  channel_id: String,
  timezone: { type: String, default: "UTC" },
  text: { type: String, default: "{clock} {time} {timezone}" },
});

const ChannelTimer = mongoose.model("ChannelTimer", ChannelTimerSchema);

module.exports = { ChannelTimer };
