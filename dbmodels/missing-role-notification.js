const mongoose = require("mongoose");

const MissingRoleNotificationSchema = new mongoose.Schema({
  gid: String,
  name: String,
  missing_role_to_check: String,
  required_roles: { type: [String], default: [] },
  require_all_roles: { type: Boolean, default: false },
  protected_roles: { type: [String], default: [] },
  channel_to_notify: String,
  roles_to_notify: { type: [String], default: [] },
});

const MissingRoleNotification = mongoose.model(
  "MissingRoleNotification",
  MissingRoleNotificationSchema
);

module.exports = { MissingRoleNotification };
