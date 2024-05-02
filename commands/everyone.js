const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("everyone")
    .setDescription("Ping @everyone in the thread."),
  async execute(interaction) {
    const { ownerId } = interaction.channel;

    if (!interaction.channel.isThread()) {
      return await interaction.reply({
        content: `> *You are not allowed to use this command on this channel.*`,
        ephemeral: true,
      });
    }

    if (ownerId !== interaction.user.id) {
      return await interaction.reply({
        content: `> *Only the thread author can use this command.*`,
        ephemeral: true,
      });
    }

    await interaction.reply(`@everyone`);
  },
};
