const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voice-move")
    .setDescription("Moves users from one channel to another")
    .addChannelOption((option) =>
      option
        .setName("from")
        .setDescription("From which channel")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("to")
        .setDescription("To which channel")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const from = interaction.options.getChannel("from");
    const to = interaction.options.getChannel("to");

    if (from.id === to.id) {
      return await interaction.followUp({
        content: `> *⛔ Why do you want to move members to the same channel?*`,
        ephemeral: true,
      });
    }

    let movedMembers = 0;
    let notMovedMembers = 0;

    from.members.each((m) => {
      try {
        m.voice.setChannel(to);
        movedMembers++;
      } catch (e) {
        notMovedMembers++;
      }
    });

    let message = `> *Moved ${movedMembers} member(s) from ${from} to ${to}.*`;

    if (notMovedMembers > 0) {
      message += `\n> *Couldn't move ${notMovedMembers} member(s)...*`;
    }

    await interaction.followUp({
      content: message,
      ephemeral: true,
    });
  },
};
