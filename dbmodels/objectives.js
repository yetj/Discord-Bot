const mongoose = require("mongoose");

const ObjectivesSettingsSchema = new mongoose.Schema({
  gid: String,
  option: String,
  value: String,
});

const ObjectivesSettings = mongoose.model("ObjectivesSettings", ObjectivesSettingsSchema);

const ObjectivesTypesSchema = new mongoose.Schema({
  gid: String,
  name: String,
  thumbnail_url: String,
});

const ObjectivesTypes = mongoose.model("ObjectivesTypes", ObjectivesTypesSchema);

const ObjectivesSchema = new mongoose.Schema({
  gid: String,
  user: String,
  user_name: String,
  map_name: String,
  objective: String,
  channel_id: String,
  message_id: String,
  additional_note: String,
  taken: { type: Boolean, default: null },
  taken_user: String,
  taken_user_name: String,
  time: { type: Date },
  reminder: { type: Boolean, default: true },
  reminder_time: { type: Number, default: 15 },
  added: { type: Date, default: Date.now },
});

const Objectives = mongoose.model("Objectives", ObjectivesSchema);

module.exports = { ObjectivesSettings, ObjectivesTypes, Objectives };
