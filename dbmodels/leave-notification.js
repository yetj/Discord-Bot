const mongoose = require("mongoose");

const LeaveNotification = new mongoose.Schema({
  gid: String,
  role_id: String,
  channel_id: String,
  role_id_to_be_mentioned: String,
});

module.exports = mongoose.model("LeaveNotification", LeaveNotification);
