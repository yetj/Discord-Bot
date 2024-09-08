const mongoose = require("mongoose");

const MultiThreadsCreatorSettingsSchema = new mongoose.Schema(
  {
    gid: String,
    allowedRoles: { type: [String], deafult: [] },
  },
  { timestamps: true }
);

const MultiThreadsCreatorSettings = mongoose.model(
  "MultiThreadsCreatorSettings",
  MultiThreadsCreatorSettingsSchema
);

const MultiThreadsCreatorSchema = new mongoose.Schema(
  {
    gid: String,
    name: String,
    description: String,
    color: String,
    channels: { type: [String], deafult: [] },
  },
  { timestamps: true }
);

const MultiThreadsCreator = mongoose.model("MultiThreadsCreator", MultiThreadsCreatorSchema);

module.exports = { MultiThreadsCreatorSettings, MultiThreadsCreator };
