const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("archive")
    .setDescription("Archiving channels and adds logs from their channels")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription(
          "Archive a channel and post logs from this channel to another channel as a file"
        )
        .addChannelOption((option) =>
          option
            .setName("channel_to_archive")
            .setDescription("Select channel to archive")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel_to_log")
            .setDescription("Select channel to post logs")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.PublicThread,
              ChannelType.AnnouncementThread,
              ChannelType.GuildAnnouncement,
              ChannelType.PrivateThread
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("forum")
        .setDescription(
          "Archive a forum, threads and post from this forum to another channel as a files"
        )
        .addChannelOption((option) =>
          option
            .setName("forum_to_archive")
            .setDescription("Select forum to archive")
            .addChannelTypes(ChannelType.GuildForum)
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel_to_log")
            .setDescription("Select channel to post logs")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.PublicThread,
              ChannelType.AnnouncementThread,
              ChannelType.GuildAnnouncement,
              ChannelType.PrivateThread
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("multiple_channels")
        .setDescription(
          "Archive multiple channels and post logs from these channels to another channel as a file"
        )
        .addStringOption((option) =>
          option
            .setName("channels")
            .setDescription("Tag multiple channels you want to archive")
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel_to_log")
            .setDescription("Select channel to post logs")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.PublicThread,
              ChannelType.AnnouncementThread,
              ChannelType.GuildAnnouncement,
              ChannelType.PrivateThread
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("separator")
            .setMaxLength(3)
            .setMinLength(1)
            .setDescription("Separator for roles and channels - default: space")
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "channel") {
      await interaction.deferReply();

      const channel_to_archive = interaction.options.getChannel("channel_to_archive");
      const channel_to_log = interaction.options.getChannel("channel_to_log");

      this.archive(interaction, channel_to_archive, channel_to_log);
    } else if (interaction.options.getSubcommand() === "multiple_channels") {
      await interaction.deferReply();

      const channels = interaction.options.getString("channels");
      const channel_to_log = interaction.options.getChannel("channel_to_log");
      const separator = interaction.options.getString("separator") ?? " ";

      const channels_to_find = channels.trim().split(separator);

      for (channel of channels_to_find) {
        const channel_org = channel;
        channel = channel?.trim();

        if (channel.startsWith("<#") && channel) {
          channel = channel.substring(2, channel.length - 1);

          const channel_data =
            (await interaction.guild.channels.cache.find((c) => {
              return c.name === this.prepChannelName(channel) || c.id === channel;
            })) || null;

          if (channel_data) {
            if (channel_data.type == ChannelType.GuildForum) {
              await interaction.followUp(
                `> *${channel_data} is a forum. Please use different option of archive command.*`
              );
            } else {
              this.archive(interaction, channel_data, channel_to_log);
            }
          } else {
            await interaction.followUp({
              content: `> *Channel **${channel_org}** doesn't exist.*`,
            });
          }
        }
      }
    } else if (interaction.options.getSubcommand() === "forum") {
      await interaction.deferReply();

      const forum_to_archive = interaction.options.getChannel("forum_to_archive");
      const channel_to_log = interaction.options.getChannel("channel_to_log");

      if (forum_to_archive.type != ChannelType.GuildForum) {
        return await interaction.followUp(`> *${forum_to_archive} is not a forum.*`);
      }

      await forum_to_archive.threads.fetch({ cache: false, force: true }).then((data) => {
        data.threads.each((thread) => {
          this.archive(interaction, thread, channel_to_log);
        });
      });
    }
  },
  async archive(interaction, channel_to_archive, channel_to_log) {
    const perms_to_view_channel = channel_to_archive
      .permissionsFor(interaction.client.user.id)
      .has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]);

    if (!perms_to_view_channel) {
      return await interaction.followUp(
        `Bot doesn't have permissions to view or read message history on the channel ${channel_to_archive}.`
      );
    }

    const perms_to_post_messages = channel_to_log
      .permissionsFor(interaction.client.user.id)
      .has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]);

    if (!perms_to_post_messages) {
      return await interaction.followUp(
        `Bot doesn't have permissions to post messages on the channel ${channel_to_log}.`
      );
    }

    const isThread = channel_to_archive.isThread();
    let threadChannel = null;

    if (isThread) {
      threadChannel =
        (await interaction.guild.channels.cache.find((c) => {
          return c.id === channel_to_archive.parentId;
        })) || null;
    }

    let arch = `### This is history of the ${isThread ? "thread" : "channel"}: #${
      channel_to_archive.name
    } ${threadChannel ? `from channel #${threadChannel.name}` : ""}\n### Time is in UTC timezone\n`;

    let messages_len = 1;

    // Create message pointer
    let message = await channel_to_archive.messages
      .fetch({ cache: false, force: true, limit: 1 })
      .then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

    const date = new Date(message.createdTimestamp)?.toLocaleString("en-GB", {
      timeZone: "UTC",
    });
    const user =
      message.author.globalName ?? `${message.author.username}#${message.author.discriminator}`;

    arch += `\n[${date}] ${user} (#${message.author.id}): ${message.content}`;

    if (message.attachments.size > 0) {
      message.attachments.each((attachment) => {
        arch += `\n[ATTACHMENT]>>> ${attachment.url}`;
      });
    }

    while (message) {
      await channel_to_archive.messages
        .fetch({ cache: false, force: true, limit: 100, before: message.id })
        .then((messagePage) => {
          messagePage.forEach((msg) => {
            //console.log(msg);
            //messages.push(msg);
            const date = new Date(msg.createdTimestamp)?.toLocaleString("en-GB", {
              timeZone: "UTC",
            });
            const user =
              msg.author.globalName ?? `${msg.author.username}#${msg.author.discriminator}`;
            arch += `\n[${date}] ${user} (#${msg.author.id}): ${msg.content}`;

            if (msg.attachments.size > 0) {
              msg.attachments.each((attachment) => {
                arch += `\n[ATTACHMENT]>>> ${attachment.url}`;
              });
            }

            messages_len++;
          });

          // Update our message pointer to be the last message on the page of messages
          message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
        });
    }

    const buffer = Buffer.from(arch, "utf-8");

    await channel_to_log.send({
      content: `> History of the ${isThread ? "thread" : "channel"} **${channel_to_archive.name}**${
        threadChannel ? ` from channel **#${threadChannel.name}**` : ""
      }\n> Number of archived messages: **${messages_len}**`,
      files: [
        {
          attachment: buffer,
          name: `${channel_to_archive.name}.log`,
        },
      ],
    });

    await interaction.followUp(
      `> Number of archived messages from ${isThread ? "thread" : "channel"} **${
        channel_to_archive.name
      }**${threadChannel ? ` from channel **#${threadChannel.name}**` : ""}: **${messages_len}**`
    );
  },
  prepChannelName(name) {
    name = name.toLowerCase();
    name = name.replace(/[`~!@#\$%\^&*\(\)|+=?;:",<>\{\}\[\]\\\/]/g, "-");
    name = name.replace(/['\.]/g, "");
    name = name.replace(/ /g, "-");
    name = name.replace("---", "-");
    name = name.replace("--", "-");
    name = name.replace("--", "-");
    name = name.replace("--", "-");
    name = name.replace(/-$/, "");

    return name;
  },
};
