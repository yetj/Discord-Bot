const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const getDisplayName = require("../utils/getDisplayName.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("regear")
    .setDescription("Displays regears without reacion.")
    .addStringOption((option) =>
      option.setName("custom_link").setDescription("Custom link (default: H C)")
    )
    .addStringOption((option) =>
      option
        .setName("output_string")
        .setDescription(
          "Options: {displayname} {userid} {post_link} | Default: {displayname}> `<@{userid}>` {post_link}"
        )
    ),
  async execute(interaction) {
    const custom_link = interaction.options.getString("custom_link");
    let output_string = interaction.options.getString("output_string");

    const finalLinkString = custom_link?.length > 0 ? custom_link : "H C";
    output_string =
      output_string?.length > 0 ? output_string : "{displayname}> `<@{userid}>` {post_link}";

    await interaction.deferReply({ ephemeral: true });

    let messages_len = 1;
    let todo = 0;
    let checked = 0;
    let contentArray = [];

    // Create message pointer
    let message = await interaction.channel.messages
      .fetch({ force: true, limit: 1 })
      .then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

    if (message.attachments.size > 0 && message.reactions.cache.size == 0) {
      const member = await interaction.guild.members.fetch(message.author.id, {
        force: true,
      });

      if (member) {
        let finalOutputString = output_string
          .replace(/{displayname}/g, getDisplayName(member))
          .replace(/{userid}/g, member.id)
          .replace(
            /{post_link}/g,
            `[${finalLinkString}](https://discord.com/channels/${interaction.guildId}/${
              interaction.channel.id
            }/${message.id})`
          );

        contentArray.push(`\n${finalOutputString}`);
        todo++;
      }
    } else if (message.attachments.size > 0 && message.reactions.cache.size > 0) {
      checked++;
    }

    while (message) {
      await interaction.channel.messages
        .fetch({ force: true, limit: 100, before: message.id })
        .then((messagePage) => {
          messagePage.forEach(async (msg) => {
            if (msg.attachments.size > 0 && msg.reactions.cache.size == 0) {
              const member = await interaction.guild.members.fetch(msg.author.id, {
                force: true,
              });

              if (member) {
                let finalOutputString = output_string
                  .replace(/{displayname}/g, getDisplayName(member))
                  .replace(/{userid}/g, member.id)
                  .replace(
                    /{post_link}/g,
                    `[${finalLinkString}](https://discord.com/channels/${interaction.guildId}/${
                      interaction.channel.id
                    }/${msg.id})`
                  );

                contentArray.push(`\n${finalOutputString}`);

                todo++;
              }
            } else if (msg.attachments.size > 0 && msg.reactions.cache.size > 0) {
              checked++;
            }
            messages_len++;
          });

          // Update our message pointer to be the last message on the page of messages
          message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
        });
    }

    let page = 1;
    let content = "";
    let header = output_string
      .replace(/{displayname}/g, "Display Name")
      .replace(/{userid}/g, "User ID")
      .replace(/{post_link}/g, "Message Link");

    for (let i = contentArray.length - 1; i >= 0; i--) {
      content += contentArray[i];

      if (content.length > 3800) {
        const embed = new EmbedBuilder()
          .setColor("#22cc11")
          .setTitle("Regears:")
          .setDescription(`${header}${content}`)
          .setFooter({ text: `Page ${page}` });

        content = "";
        page++;

        await interaction
          .followUp({
            content: `> ***Number of posted regears:** ${messages_len}*\n> ***Checked:** ${checked}*\n> ***TODO:** ${todo}*`,
            embeds: [embed],
            ephemeral: true,
          })
          .catch(console.error);
      }

      if (i == 0) {
        if (content.length > 0) {
          const embed = new EmbedBuilder()
            .setColor("#22cc11")
            .setTitle("Regears")
            .setDescription(`${header}${content}`);

          if (page > 1) {
            embed.setFooter({ text: `Page ${page}` });
          }

          await interaction.followUp({
            content: `> ***Number of posted regears:** ${messages_len}*\n> ***Checked:** ${checked}*\n> ***TODO:** ${todo}*`,
            embeds: [embed],
            ephemeral: true,
          });
        }
      }
    }
  },
};
