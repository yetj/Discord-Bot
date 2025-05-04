const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const getDisplayName = require("../utils/getDisplayName.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("members-from-embed")
    .setDescription("Return list of members from specific message in that channel.")
    .addStringOption((option) =>
      option.setName("message").setDescription("Message ID").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("output")
        .setDescription("Output list type (default: Display name)")
        .addChoices(
          { name: "ID", value: "id" },
          { name: "Display name", value: "displayname" },
          { name: "Username", value: "username" },
          { name: "Mention", value: "mention" },
          { name: "ID & Display name", value: "id_displayname" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("output_separator")
        .setDescription("Output separator (default: New line)")
        .addChoices(
          { name: "Space", value: " " },
          { name: "Comma", value: ", " },
          { name: "New line", value: "\n" },
          { name: "Tab", value: "\t" },
          { name: "Dash", value: " - " }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const channel = interaction.channel;
    const messageId = interaction.options.getString("message");
    const output = interaction.options.getString("output") ?? "displayname";
    const output_separator = interaction.options.getString("output_separator") ?? "\n";

    const message = await channel.messages.fetch(messageId);

    if (!message) {
      return interaction.reply({ content: "> *Message not found.*", ephemeral: true });
    }

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

    let memberList = [];

    switch (output) {
      case "id":
        memberList = [...mentionIDs];
        break;
      case "username":
        memberList = await Promise.all(
          [...mentionIDs].map(async (id) => {
            const member = await message.guild.members.fetch(id);
            if (member) {
              return member.user.username;
            }
          })
        );
        break;
      case "mention":
        memberList = [...mentionIDs].map((id) => `\`<@${id}>\``);
        break;
      case "id_displayname":
        memberList = await Promise.all(
          [...mentionIDs].map(async (id) => {
            const member = await message.guild.members.fetch(id);
            if (member) {
              return `${member.id} - ${getDisplayName(member)}`;
            }
          })
        );
        break;
      default:
        memberList = await Promise.all(
          [...mentionIDs].map(async (id) => {
            const member = await message.guild.members.fetch(id);
            if (member) {
              return getDisplayName(member);
            }
          })
        );
        break;
    }

    let messageOut = "";

    for (const entry of memberList) {
      if (messageOut.length > 0) {
        messageOut += output_separator;
      }
      messageOut += entry;

      if (messageOut.length > 3800) {
        const embedMessage = new EmbedBuilder()
          .setColor(`#4df886`)
          .setTitle(`Members mentioned in the message:`)
          .setDescription(messageOut);

        await interaction.followUp({ embeds: [embedMessage], ephemeral: true });

        messageOut = "";
      }
    }

    if (messageOut.length > 0) {
      const embedMessage = new EmbedBuilder()
        .setColor(`#4df886`)
        .setTitle(`Members mentioned in the message:`)
        .setDescription(messageOut);

      await interaction.followUp({ embeds: [embedMessage], ephemeral: true });
    }
  },
};
