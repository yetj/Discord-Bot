const mongoose = require("mongoose");

const CustomPingSchema = new mongoose.Schema({
  gid: String,
  role_that_can_ping: String,
  role_to_ping: String,
});

const CustomPing = mongoose.model("CustomPing", CustomPingSchema);

module.exports = { CustomPing };
