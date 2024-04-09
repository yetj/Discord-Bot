const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ex")
        .setDescription("Return list of members on specific voice channel."),
    async execute(interaction) {
        //const comm = require('../events/guildDelete.js')

        //comm.execute(interaction.client, interaction.guild)

        await interaction.deferReply({ ephemeral: true });

        await interaction.reply({
            content: `> ${interaction.member.nickname} - ${interaction.member.user.username}`,
        });

        console.log(interaction);
    },
};
