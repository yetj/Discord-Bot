const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Purges messages.")
    .addIntegerOption((option) =>
      option
        .setName("number_of_messages_to_delete")
        .setDescription("Number of messages to remove")
        .setMinValue(1)
        .setMaxValue(99)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    let number_of_messages_to_delete = interaction.options.getInteger(
      "number_of_messages_to_delete"
    );

    await interaction.channel
      .bulkDelete(number_of_messages_to_delete, true)
      .then((d) => {
        let add = "";
        if (d.size !== number_of_messages_to_delete) {
          add = `\n_I can not remove messages older than **14 days**_`;
        }
        interaction.reply({ content: `Purged **${d.size}** message(s)${add}`, ephemeral: true });

        const channelData = interaction.guild.channels.cache.find((c) => c.name === "🔅-bot-log");

        if (channelData) {
          channelData.send(
            `> **${
              interaction.member.nickname !== null
                ? interaction.member.nickname
                : interaction.member.user.username
            }** purged **${d.size}** message(s) from <#${interaction.channelId}>`
          );
        }
      })
      .catch(console.error);
  },
};
