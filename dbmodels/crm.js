const mongoose = require("mongoose");

const CustomRoleManagerSchema = new mongoose.Schema({
  gid: String,
  role_manager: String,
  role_add: String,
});

const CustomRoleManager = mongoose.model("CustomRoleManager", CustomRoleManagerSchema);

const CustomRoleManagerLogsSchema = new mongoose.Schema({
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

const CustomRoleManagerLogs = mongoose.model("CustomRoleManagerLogs", CustomRoleManagerLogsSchema);

module.exports = { CustomRoleManager, CustomRoleManagerLogs };
