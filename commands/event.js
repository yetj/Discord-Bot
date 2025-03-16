const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const {
  CTAConfig,
  CTAMembers,
  CTAVacation,
  CTAEventTypes,
  CTAEvents,
  CTAEventGroups,
} = require("../dbmodels/event");
const getDisplayName = require("../utils/getDisplayName");
