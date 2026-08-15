const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

const PrivacyCommand = {
  data: new SlashCommandBuilder().setName("privacy").setDescription("View privacy policy"),
  async execute(interaction) {
    let message = `Our Privacy Policy explains what information the bot may access, how it is used, and how you can request deletion of your data.\n\n`;
    message += `**Privacy Policy**: \n<https://yetj.net/discord_bot/privacy_policy.pdf>\n\n`;
    message += `**Terms of Service**: \n<https://yetj.net/discord_bot/terms_of_service.pdf>\n`;

    const embedMessage = new EmbedBuilder()
      .setColor(`#00acdb`)
      .setTitle(`Manager & Helper — Privacy Policy`)
      .setDescription(message);

    await interaction.reply({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
  },
};

module.exports = {
  PrivacyCommand,
};
