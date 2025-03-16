const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");

const Cmd1 = {
  data: new SlashCommandBuilder()
    .setName("ex")
    .setDescription("Return list of members on specific voice channel.")
    .addUserOption((option) => option.setName("user").setDescription("User")),
  async execute(interaction) {
    console.log(interaction.options._hoistedOptions);

    await interaction.reply({
      content: `> ${interaction.member.nickname} - ${interaction.member.user.username}`,
    });
  },
};

const Cmd2 = {
  data: new SlashCommandBuilder()
    .setName("ex2")
    .setDescription("Return list of members on specific voice channel.")
    .addUserOption((option) => option.setName("user").setDescription("User")),
  async execute(interaction) {
    console.log(interaction.options._hoistedOptions);

    await interaction.reply({
      content: `> ${interaction.member.nickname} - ${interaction.member.user.username}`,
    });
  },
};

module.exports = { Cmd1, Cmd2 };
