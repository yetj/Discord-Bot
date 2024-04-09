const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stream")
        .setDescription("Sending information that player is streaming.")
        .addStringOption((option) =>
            option
                .setName("link")
                .setDescription("Link to the stream")
                .setMinLength(5)
                .setRequired(true)
        ),
    async execute(interaction) {
        const link = interaction.options.getString("link");

        if (module.exports.isValidHttpUrl(link.trim())) {
            let channelData = interaction.guild.channels.cache.find(
                (c) => c.name === "🎥-stream-log"
            );

            if (channelData) {
                channelData.send(
                    `Stream from ${interaction.channel} posted by ${interaction.user}\n<${link}>`
                );

                await interaction.reply(`> ✅ Noted! Thank you!\n> <${link}>`);
            }
        } else {
            await interaction.reply(`> ⛔ Invalid link! Post only link, nothing else!`);
        }
    },
    isValidHttpUrl(string) {
        let url;

        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }

        return url.protocol === "http:" || url.protocol === "https:";
    },
};
