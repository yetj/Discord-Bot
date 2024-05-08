const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const getDisplayName = require("../utils/getDisplayName.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("regear")
    .setDescription("Displays regears without reacion.")
    .addStringOption((option) =>
      option.setName("custom_string").setDescription("Custom string (default: H C)")
    ),
  async execute(interaction) {
    const custom_string = interaction.options.getString("custom_string");

    const allMessages = await interaction.channel.messages.fetch({ force: true });

    const filteredMessages = await allMessages.filter(
      (m) => m.attachments.size > 0 && m.reactions.cache.size == 0
    );

    const sortedMessages = await filteredMessages.sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp
    );

    await interaction.deferReply({ ephemeral: true });

    if (sortedMessages.size == 0) {
      return await interaction.followUp({ content: `> All regears are done!`, ephemeral: true });
    }

    let content = "";

    const finalString = custom_string?.length > 0 ? custom_string : "H C";

    let page = 1;
    let messageNum = 0;

    sortedMessages.map(async (message) => {
      const member = await interaction.guild.members.fetch(message.author.id, { force: true });

      if (!member) {
        console.log("no member: ", message);
        return;
      }

      if (content.length == 0) {
        content = "Player name | Player mention | Location (post link)";
      }

      content += `\n${getDisplayName(member)}> \`<@${
        member.id
      }>\` [${finalString}](https://discord.com/channels/${interaction.guildId}/${
        interaction.channel.id
      }/${message.id})`;

      if (content.length > 3800) {
        const embed = new EmbedBuilder()
          .setColor("#22cc11")
          .setTitle("Regears to do:")
          .setDescription(`${content}`)
          .setFooter({ text: `Page ${page}` });

        content = "";
        page++;

        await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(console.error);
      }

      if (messageNum++ === sortedMessages.size - 1) {
        if (content.length > 0) {
          const embed = new EmbedBuilder()
            .setColor("#22cc11")
            .setTitle("Regears to do:")
            .setDescription(`${content}`);

          if (page > 1) {
            embed.setFooter({ text: `Page ${page}` });
          }

          await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
      }
    });
  },
};
