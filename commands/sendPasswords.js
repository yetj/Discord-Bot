const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendpasswords")
    .setDescription("Send GAC passwords to the users on their channels.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("api")
        .setDescription("Send using API")
        .addStringOption((option) =>
          option
            .setName("region")
            .setDescription("Region with capital leters eg. EU")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("link").setDescription("Link to the passwords file").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("json")
        .setDescription("Send using JSON")
        .addStringOption((option) =>
          option
            .setName("region")
            .setDescription("Region with capital leters eg. EU")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("json").setDescription("JSON text").setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "api") {
      await interaction.deferReply();

      const region = interaction.options.getString("region").trim();
      const link = interaction.options.getString("link").trim();

      try {
        fetch(json)
          .then((response) => response.text())
          .then(async (data) => {
            entries = JSON.parse(data);

            await interaction.reply(`> *Working on it! Should be done soon...*`);

            //
          });
      } catch (e) {
        interaction.followUp(`Error with parsing JSON data...`);
      }
    } else if (interaction.options.getSubcommand() === "json") {
      await interaction.deferReply();

      const region = interaction.options.getString("region");
      const json = interaction.options.getString("json");
    }
  },
};
