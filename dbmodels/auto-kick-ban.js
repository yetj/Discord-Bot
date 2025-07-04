const mongoose = require("mongoose");

const AutoKickBanSettingsSchema = new mongoose.Schema({
  gid: String,
  protected_roles: { type: [String], deafult: [] },
  ban_after_x_kicks: { type: Number, default: 3 },
});

const AutoKickBanSettings = mongoose.model("AutoKickBanSettings", AutoKickBanSettingsSchema);

const AutoKickBanLogsSchema = new mongoose.Schema({
  gid: String,
  user: String,
  user_name: String,
  command: String,
  full_command: String,
  role: String,
  role_name: String,
  victim: String,
  victim_name: String,
  date: { type: Date, default: Date.now },
});

const AutoKickBanLogs = mongoose.model("AutoKickBanLogs", AutoKickBanLogsSchema);

module.exports = { AutoKickBanSettings, AutoKickBanLogs };
