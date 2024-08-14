const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voicemembers")
    .setDescription("Return list of members on specific voice channel.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Select voice channel")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName("role").setDescription("Show only members with this role")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("role");

    let onlineWithRoleList = [];

    channel.members
      .sort((a, b) => b.displayName - a.displayName)
      .each((m) => {
        if (role) {
          if (m.roles.cache.has(role.id)) {
            onlineWithRoleList.push(m.displayName);
          }
        } else {
          onlineWithRoleList.push(m.displayName);
        }
      });

    if (role) {
      await interaction.reply(
        `Online members on channel ${channel} in total: **${
          channel.members.size
        }**\nOnline members with Role **${role.name}**: ${
          onlineWithRoleList.length
        } \n> ${onlineWithRoleList.sort().join("\n> ")}`
      );
    } else {
      await interaction.reply(
        `Online members on channel ${channel}: **${channel.members.size}**\n> ${onlineWithRoleList
          .sort()
          .join("\n> ")}`
      );
    }
  },
};
