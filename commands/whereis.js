const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whereis")
    .setDescription("Return information on which voice channel is mentioned user.")
    .addUserOption((option) => option.setName("user").setDescription("User").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("user");

    if (!user || !user.id) {
      return await interaction.reply({ content: `> *Can't find this user.*`, ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(user.id, { force: true });

    if (!member || !member.voice) {
      return await interaction.reply({ content: `> *Can't find this member.*`, ephemeral: true });
    }

    const channelId = member.voice.channelId;

    if (!channelId) {
      return await interaction.reply({
        content: `> ${member} is NOT connected to any channel.`,
        ephemeral: true,
      });
    }

    const channel = await interaction.guild.channels.fetch(channelId);

    if (!channel.permissionsFor(interaction.user).has(PermissionFlagsBits.ViewChannel)) {
      return await interaction.reply({
        content: `> ${member} is NOT connected to any channel.`,
        ephemeral: true,
      });
    }

    await interaction.reply({ content: `> ${member} is connected to ${channel}`, ephemeral: true });
  },
};
