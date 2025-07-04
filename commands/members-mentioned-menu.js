const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const getDisplayName = require("../utils/getDisplayName.js");

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("List mentioned members")
    .setType(ApplicationCommandType.Message)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    //
  },
  async autoload(client) {
    client.on("interactionCreate", async (interaction) => {
      // Only handle message context menu
      if (!interaction.isMessageContextMenuCommand()) return;

      const message = interaction.targetMessage;

      await interaction.deferReply({ ephemeral: true });

      let mentionIDs = new Set();

      // 1. Mentions in message content
      const contentMentions = [...message.content.matchAll(/<@!?(\d+)>/g)];
      contentMentions.forEach((match) => mentionIDs.add(match[1]));

      // 2. Mentions in descriptions of embeds
      for (const embed of message.embeds) {
        if (embed.description) {
          const descMentions = [...embed.description.matchAll(/<@!?(\d+)>/g)];
          descMentions.forEach((match) => mentionIDs.add(match[1]));
        }
        // 3. Mentions in fields of embeds
        for (const field of embed.fields) {
          const fieldMentions = [...field.value.matchAll(/<@!?(\d+)>/g)];
          fieldMentions.forEach((match) => mentionIDs.add(match[1]));
        }
      }

      if (mentionIDs.size === 0) {
        return await interaction.followUp({
          content: `> *Not found any user mentions in this message.*`,
          ephemeral: true,
        });
      }

      // Default output: display names, separated by new lines
      const memberList = await Promise.all(
        [...mentionIDs].map(async (id) => {
          try {
            const member = await message.guild.members.fetch(id);
            if (member) return getDisplayName(member);
          } catch {
            return null;
          }
        })
      );

      const filteredList = memberList.filter(Boolean);
      let messageOut = filteredList.join("\n");

      if (messageOut.length > 3800) {
        messageOut = messageOut.slice(0, 3800) + "\n...output truncated...";
      }

      const embedMessage = new EmbedBuilder()
        .setColor(`#4df886`)
        .setTitle(`Members mentioned in the message:`)
        .setDescription(messageOut);

      await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
    });
  },
};
