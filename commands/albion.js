const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("albion")
    .setDescription("Check bot informations.")
    .addSubcommand((subcommand) => subcommand.setName("ao").setDescription("Check servers status")),
  async execute(interaction) {
    if (interaction.member.id !== "165542890334978048") {
      return await interaction.reply({ content: `You are not authorized to use this command!` });
    }

    if (interaction.options.getSubcommand() === "ao") {
      //
    }
  },
};
