const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const getDisplayName = require("../utils/getDisplayName.js");

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
    .addBooleanOption((option) =>
      option.setName("show_reply").setDescription("Show reply to everyone? (default: false)")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("role");
    const show_reply = interaction.options.getBoolean("show_reply") ?? false;

    let onlineWithRoleList = [];

    channel.members
      .sort((a, b) => getDisplayName(b) - getDisplayName(a))
      .each((m) => {
        if (role) {
          if (m.roles.cache.has(role.id)) {
            onlineWithRoleList.push(getDisplayName(m));
          }
        } else {
          onlineWithRoleList.push(getDisplayName(m));
        }
      });

    let message = ``;

    if (role) {
      message += `Online members on channel ${channel} in total: **${channel.members.size}**\n`;
      message += `Online members with Role **${role.name}**: ${onlineWithRoleList.length}\n`;

      if (onlineWithRoleList.length > 0) {
        message += `> ${onlineWithRoleList.sort().join("\n> ")}`;
      } else {
        message += `> *No members to show*`;
      }

      await interaction.reply({ content: message, ephemeral: !show_reply });
    } else {
      message += `Online members on channel ${channel}: **${channel.members.size}**\n`;

      if (onlineWithRoleList.length > 0) {
        message += `> ${onlineWithRoleList.sort().join("\n> ")}`;
      } else {
        message += `> *No members to show*`;
      }

      await interaction.reply({ content: message, ephemeral: !show_reply });
    }
  },
};
