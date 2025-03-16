const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");

const Cmd1 = {
  data: new SlashCommandBuilder()
    .setName("role-follow")
    .setDescription("Follow and log adding and removal selected roles.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup_add")
        .setDescription("Add role to follow")
        .addRoleOption((option) =>
          option.setName("role").setDescription("Role that will be followed").setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to post notifications")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    console.log(interaction.options._hoistedOptions);

    await interaction.reply({
      content: `> ${interaction.member.nickname} - ${interaction.member.user.username}`,
    });
  },
};

module.exports = { Cmd1 };
