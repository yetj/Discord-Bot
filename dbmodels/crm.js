const mongoose = require("mongoose");

const CustomRoleManager = new mongoose.Schema({
  gid: String,
  role_manager: String,
  role_add: String,
});

module.exports = mongoose.model("CustomRoleManager", CustomRoleManager);
