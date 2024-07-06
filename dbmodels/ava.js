const mongoose = require("mongoose");

// registered_role_id: String,
// plus_one_role_id: String,
// manager_role_id: String,
// plus_one_channel_log_id: String,
// wrong_guild_channel_log: String,
const AvaSettingsSchema = new mongoose.Schema({
  gid: String,
  option: String,
  value: String,
});
const AvaSettings = mongoose.model("AvaSettings", AvaSettingsSchema);

const AvaMembersSchema = new mongoose.Schema({
  gid: String,
  id: String,
  name: String,
  ao_server: String,
  ao_name: String,
  ao_name_id: String,
  ao_guild: String,
  ao_guild_id: String,
  registered: { type: Date, default: Date.now },
  last_check: { type: Date, default: Date.now },
});
const AvaMembers = mongoose.model("AvaMembers", AvaMembersSchema);

const AvaGuildsSchema = new mongoose.Schema({
  gid: String,
  ao_server: String,
  ao_guild: String,
  ao_guild_id: String,
  prefix: String,
});
const AvaGuilds = mongoose.model("AvaGuilds", AvaGuildsSchema);

const AvaPlusOneCategoriesSchema = new mongoose.Schema({
  gid: String,
  category: String,
  basic_role_id: String,
  experienced_role_id: String,
  min_plus_ones: Number,
});
const AvaPlusOneCategories = mongoose.model("AvaPlusOneCategories", AvaPlusOneCategoriesSchema);

const AvaPlusOneLogsSchema = new mongoose.Schema({
  gid: String,
  member_id: String,
  member_name: String,
  category: String,
  city: String,
  value: Number,
  author_id: String,
  author_name: String,
  date: { type: Date, default: Date.now },
});
const AvaPlusOneLogs = mongoose.model("AvaPlusOneLogs", AvaPlusOneLogsSchema);

const AvaActivitySchema = new mongoose.Schema({
  gid: String,
  member_id: String,
  date: { type: Date, default: Date.now },
});
const AvaActivity = mongoose.model("AvaActivity", AvaActivitySchema);

module.exports = {
  AvaSettings,
  AvaMembers,
  AvaGuilds,
  AvaPlusOneCategories,
  AvaPlusOneLogs,
  AvaActivity,
};
