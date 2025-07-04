const mongoose = require("mongoose");

const ScheduledMessagesSchema = new mongoose.Schema({
  gid: String,
  author_id: String,
  author_name: String,
  date: Date,
  channel_id: String,
  title: String,
  message: String,
  pin: Boolean,
  embed: Boolean,
  posted: { type: Number, default: 0 }, // 0 = not posted, 1 = posted, 2 = removed
});

const ScheduledMessages = mongoose.model("ScheduledMessages", ScheduledMessagesSchema);

module.exports = { ScheduledMessages };
