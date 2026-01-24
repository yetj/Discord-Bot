const mongoose = require("mongoose");
const Counter = require("./counter");

const CTAConfigSchema = new mongoose.Schema({
  gid: String,
  member_role: { type: String, default: "" },
  manager_roles: { type: [String], default: [] },
  vacation_channel: { type: String, default: "" },
  vacation_log_channel: { type: String, default: "" },
  cta_roles: { type: [String], default: [] },
  registration_roles: { type: [String], default: [] },
  guild_names: { type: [String], default: [] },
  ao_server: { type: String, default: "" },
  allow_self_registration: { type: Boolean, default: false },
  discord_roles_skip: { type: [String], default: [] },
  game_roles_skip: { type: [String], default: [] },
  additional_roles: { type: [String], default: [] },
  default_start_date: { type: Date, default: 0 },
});
const CTAConfig = mongoose.model("CTAConfig", CTAConfigSchema);

const CTAMembersSchema = new mongoose.Schema({
  gid: String,
  id: String, // discord ID
  name: String, // discord username
  game_nickname: String,
  registered: { type: Date, default: Date.now },
  unregistered: { type: Boolean, default: false },
  unregistered_date: { type: Date, default: 0 },
  unregistered_reason: { type: String, default: "" },
});
const CTAMembers = mongoose.model("CTAMembers", CTAMembersSchema);

const CTAVacationsSchema = new mongoose.Schema({
  gid: String,
  vacations_id: Number,
  uid: String,
  start: Date,
  end: Date,
  days: Number,
  reason: String,
  added_by: String,
  force_end: { type: Date, default: 0 },
  force_end_reason: { type: String, default: "" },
  force_end_by: { type: String, default: "" },
});

CTAVacationsSchema.pre("save", async function (next) {
  if (!this.vacations_id) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "vacations_id_" + this.gid },
        { $inc: { value: 1 } },
        { new: true, upsert: true },
      );
      this.vacations_id = counter.value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});
const CTAVacations = mongoose.model("CTAVacations", CTAVacationsSchema);

const CTAEventTypesSchema = new mongoose.Schema({
  gid: String,
  type: String,
});
const CTAEventTypes = mongoose.model("CTAEventTypes", CTAEventTypesSchema);

const CTAEventsSchema = new mongoose.Schema({
  gid: String,
  cta_id: Number,
  name: String,
  type: String,
  created: { type: Date, default: Date.now },
  creator_id: String,
  creator_name: String,
  mandatory: { type: Boolean, default: false },
  weight: { type: Number, default: 1 },
  present: { type: [String], default: [] },
  absent: { type: [String], default: [] },
  skip: { type: [String], default: [] },
  online: { type: [String], default: [] },
  on_vacation: { type: [String], default: [] },
  not_registered: { type: [String], default: [] },
  not_registered_names: { type: [String], default: [] },
});

CTAEventsSchema.pre("save", async function (next) {
  if (!this.cta_id) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "cta_id_" + this.gid },
        { $inc: { value: 1 } },
        { new: true, upsert: true },
      );
      this.cta_id = counter.value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const CTAEvents = mongoose.model("CTAEvents", CTAEventsSchema);

const CTAEventStatsSchema = new mongoose.Schema({
  gid: String,
  name: String,
  types: { type: [String], default: [] },
  start: { type: Date, default: 0 },
  end: { type: Date, default: 0 },
  mandatory: { type: String, default: "" },
  weight: { type: [Number], default: [] },
  created_by: { type: [String], default: [] },
});
const CTAEventStats = mongoose.model("CTAEventStats", CTAEventStatsSchema);

module.exports = {
  CTAConfig,
  CTAMembers,
  CTAVacations,
  CTAEventTypes,
  CTAEvents,
  CTAEventStats,
};
