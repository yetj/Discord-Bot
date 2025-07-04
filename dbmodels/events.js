const mongoose = require("mongoose");
const Counter = require("./counter");

const EventConfigSchema = new mongoose.Schema({
  gid: String,
  enabled: { type: Boolean, default: false },
  log_channel: { type: String, default: "" },
  manager_roles: { type: [String], default: [] }, // can manage everything
  creator_roles: { type: [String], default: [] }, // can crerate and manage events and templates
  helper_roles: { type: [String], default: [] }, // can manage signups
});
const EventConfig = mongoose.model("EventConfig", EventConfigSchema);

const RoleSchema = new mongoose.Schema(
  {
    roleNumber: Number,
    roleName: String,
    partyNumber: { type: Number, default: 0 },
    maxParticipants: { type: Number, default: 1 }, // 0 - brak limitu
    strictMax: { type: Boolean, default: true }, // true - max oznacza limit, false - informacyjnie
    emoji: { type: String, default: "" },
    requiredRoles: { type: [String], default: [] },
    requiredSignedUps: { type: [Number], default: [] },
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
// simple: Role name
// advanced: 1/Role Name/1/1/1/🛡️/@Caller//<@1231423423>

const EventTemplatesSchema = new mongoose.Schema({
  gid: String,
  name: String,
  description: { type: String, default: "" },
  messageContent: { type: String, default: "" },
  authorId: String,
  authorName: String,
  isSimple: { type: Boolean, default: true },
  imageUrl: { type: String, default: "" },
  buildUrl: { type: String, default: "" },
  roles: [RoleSchema],
});
const EventTemplates = mongoose.model("EventTemplates", EventTemplatesSchema);

const EventsSchema = new mongoose.Schema({
  gid: String,
  event_id: { type: Number },
  name: String,
  startDate: Date,
  description: { type: String, default: "" },
  messageContent: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  buildUrl: { type: String, default: "" },
  organizerId: String, // Discord ID organizatora
  organizerName: String,
  participantCount: { type: Number, default: 0 },
  signedCount: { type: Number, default: 1 }, // next number of signed up
  allowLateJoin: { type: Boolean, default: false }, // Czy można dołączyć po rozpoczęciu
  lateJoinLimit: { type: Number, default: 15 }, // Minuty po rozpoczęciu
  channelId: { type: String, default: "" }, // ID kanału głosowego
  messageId: { type: String, default: "" },
  usedTemplateId: { type: String, default: "" },
  roles: [RoleSchema],
  unsignedParticipants: [
    {
      participantNumber: Number,
      discordId: String,
      name: String,
      reason: { type: String, default: "" }, // mor, skip, absent, signout, etc.
    },
  ],
});
EventsSchema.pre("save", async function (next) {
  if (!this.event_id) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "event_id_" + this.gid },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
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
