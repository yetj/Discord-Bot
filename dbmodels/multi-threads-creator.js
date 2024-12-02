const mongoose = require("mongoose");

const MultiThreadsCreatorSettingsSchema = new mongoose.Schema(
  {
    gid: String,
    name: String,
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
    template: { type: mongoose.Schema.Types.ObjectId, ref: "MultiThreadsCreatorSettings" },
    name: String,
    description: String,
    defaultContent: String,
    color: String,
    isPrivate: { type: Boolean, default: false },
    channels: { type: [String], deafult: [] },
  },
  { timestamps: true }
);

const MultiThreadsCreator = mongoose.model("MultiThreadsCreator", MultiThreadsCreatorSchema);

module.exports = { MultiThreadsCreatorSettings, MultiThreadsCreator };
