const mongoose = require("mongoose");
const Counter = require("./counter");

const CTAConfigSchema = new mongoose.Schema({
  gid: String,
  member_role: { type: String, default: "" },
  manager_roles: { type: [String], default: [] },
  vacation_log_channel: { type: String, default: "" },
  cta_roles: { type: [String], default: [] },
  registration_roles: { type: [String], default: [] },
  guild_names: { type: [String], default: [] },
  ao_server: { type: String, default: "" },
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

const CTAVacationSchema = new mongoose.Schema({
  gid: String,
  id: String, // discord ID
  name: String, // discord username
  start: Date,
  end: Date,
  days: Number,
  reason: String,
  added_by_id: String,
  added_by_name: String,
  force_end: Date,
});
const CTAVacation = mongoose.model("CTAVacation", CTAVacationSchema);

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
        { new: true, upsert: true } // Tworzy licznik, jeśli go nie ma
      );
      this.cta_id = counter.value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const CTAEvents = mongoose.model("CTAEvents", CTAEventsSchema);

const CTAEventGroupsSchema = new mongoose.Schema({
  gid: String,
  name: String,
  types: { type: [String], default: [] },
  start: Date,
  end: Date,
  only_mandatory: Boolean,
  only_created_by: { type: [String], default: [] },
});
const CTAEventGroups = mongoose.model("CTAEventGroups", CTAEventGroupsSchema);

module.exports = {
  CTAConfig,
  CTAMembers,
  CTAVacation,
  CTAEventTypes,
  CTAEvents,
  CTAEventGroups,
};
