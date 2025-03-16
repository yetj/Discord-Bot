const mongoose = require("mongoose");
const Counter = require("./counter");

const EventConfigSchema = new mongoose.Schema({
  gid: String,
  event_log_channel: { type: String, default: "" },
  manager_roles: { type: [String], default: [] },
  creator_roles: { type: [String], default: [] },
  helper_roles: { type: [String], default: [] },
});
const EventConfig = mongoose.model("EventConfig", EventConfigSchema);

const RoleSchema = new mongoose.Schema(
  {
    roleNumber: Number,
    roleName: String,
    maxParticipants: Number,
    strictMax: Boolean, // true - max oznacza limit, false - informacyjnie
    requirements: String, // Można dostosować do tablicy obiektów
    emoji: String,
    participants: [
      {
        participantNumber: Number,
        discordId: String,
        name: String,
      },
    ],
  },
  { _id: false }
);

const EventTemplatesSchema = new mongoose.Schema({
  serverGid: String,
  name: String,
  description: String,
  imageUrl: String,
  buildLink: String,
  roles: [RoleSchema],
});
const EventTemplates = mongoose.model("EventTemplates", EventTemplatesSchema);

const EventsSchema = new mongoose.Schema({
  gid: String,
  event_id: { type: Number, unique: true },
  name: String,
  startDate: Date,
  description: String,
  imageUrl: String,
  buildLink: String,
  organizer: String, // Discord ID organizatora
  organizerName: String,
  participantCount: Number,
  allowLateJoin: Boolean,
  lateJoinLimit: Number, // Minuty po rozpoczęciu
  roles: [RoleSchema],
});
EventsSchema.pre("save", async function (next) {
  if (!this.event_id) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "event_id" },
        { $inc: { value: 1 } },
        { new: true, upsert: true } // Tworzy licznik, jeśli go nie ma
      );
      this.event_id = counter.value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});
const Events = mongoose.model("Events", EventsSchema);

module.exports = {
  EventConfig,
  Events,
  EventTemplates,
};
