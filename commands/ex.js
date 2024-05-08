const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ex")
    .setDescription("Return list of members on specific voice channel.")
    .addUserOption((option) => option.setName("user").setDescription("User")),
  async execute(interaction) {
    //const comm = require('../events/guildDelete.js')

    //comm.execute(interaction.client, interaction.guild)

    const user = interaction.options.getUser("user");

    const member = interaction.guild.members.cache.find(
      (m) =>
        m.user.id == "165542890334978048" ||
        m.nickname == "" ||
        (m.user.username == "" && m.user.discriminator == "") ||
        (m.user.globalName == "" && m.user.discriminator == "0")
    );

    console.log(member.voice);

    //await interaction.deferReply({ ephemeral: true });

    await interaction.reply({
      content: `> ${interaction.member.nickname} - ${interaction.member.user.username}`,
    });

    //console.log(interaction);
  },
};
