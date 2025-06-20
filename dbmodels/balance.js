const mongoose = require("mongoose");

const BalanceSettingsSchema = new mongoose.Schema({
  gid: String,
  manager_roles: { type: [String], default: [] },
  payout_roles: { type: [String], default: [] },
  enabled: { type: Boolean, default: false },
  allow_transfers: { type: Boolean, default: false },
  log_channel: { type: String, default: "" },
});

const BalanceSettings = mongoose.model("BalanceSettings", BalanceSettingsSchema);

const BalanceSchema = new mongoose.Schema({
  gid: String,
  user_id: String,
  user_name: String,
  balance: { type: Number, default: 0 },
});

const Balance = mongoose.model("Balance", BalanceSchema);

const BalanceLogsSchema = new mongoose.Schema({
  gid: String,
  type: String,
  payout_id: { type: String, default: "" },
  payout_name: { type: String, default: "" },
  sender_id: { type: String, default: "" },
  sender_name: { type: String, default: "" },
  receiver_id: { type: String, default: "" },
  receiver_name: { type: String, default: "" },
  amount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
});

const BalanceLogs = mongoose.model("BalanceLogs", BalanceLogsSchema);

module.exports = { BalanceSettings, Balance, BalanceLogs };
