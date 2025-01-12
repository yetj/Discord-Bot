const { SlashCommandBuilder, ChannelType } = require("discord.js");

const CTA_Setup = {
  data: new SlashCommandBuilder()
    .setName("setup_cta")
    .setDescription("Configutre the bot.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("member_role")
        .setDescription("Set Member role")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role that every member should have")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("manager_role")
        .setDescription(
          "Set Manager role, that can manage this bot and have access to all commands"
        )
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("vacation_log_channel")
        .setDescription("Set channel for vacation log")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildForum,
              ChannelType.PrivateThread,
              ChannelType.PublicThread
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("event_role")
        .setDescription("Set event role, that can create and manage events")
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guild_names")
        .setDescription(
          "Set guild names that should be checked when gettings results from Battleboard"
        )
        .addStringOption((option) =>
          option.setName("guild_name").setDescription("Guild name").setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that guild? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ao_server")
        .setDescription("Set which server you want to use in Albion Online")
        .addStringOption((option) =>
          option
            .setName("server")
            .setDescription("Select server")
            .addChoices(
              { name: "Europe", value: "-ams" },
              { name: "Asia", value: "-sgp" },
              { name: "Americas", value: "-" }
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("show").setDescription("Show config for this server")
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "member_role") {
      //
    } else if (interaction.options.getSubcommand() === "manager_role") {
      //
    }
  },
};

const CTA_Registration = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("User registration.")
    .addStringOption((option) =>
      option.setName("game_nickname").setDescription("Nickname from the game").setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("member").setDescription("Select member you want to register")
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "ao") {
      //
    }
  },
};

const CTA_Vacation = {
  data: new SlashCommandBuilder()
    .setName("vacation")
    .setDescription("Configutre the bot.")
    .addSubcommand((subcommand) => subcommand.setName("ao").setDescription("Check servers status")),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "ao") {
      //
    }
  },
};

const CTA_Event = {
  data: new SlashCommandBuilder()
    .setName("cta")
    .setDescription("Configutre the bot.")
    .addSubcommand((subcommand) => subcommand.setName("ao").setDescription("Check servers status")),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "ao") {
      //
    }
  },
};

module.exports = { CTA_Setup, CTA_Registration, CTA_Vacation, CTA_Event };
