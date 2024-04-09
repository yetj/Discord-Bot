const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const Posts = require("../dbmodels/posts.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("post")
    .setDescription("Post a message on specific channel")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channels")
        .setDescription("Post a message on specific channels")
        .addStringOption((option) =>
          option
            .setName("channels")
            .setDescription("Mention channels where message should be posted, space separated")
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option.setName("pin").setDescription("Pin the posted message?")
        )
        .addBooleanOption((option) =>
          option.setName("embed").setDescription("Post message as embed?")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("category")
        .setDescription("Post a message on channels in specific category")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("Select category where to post message")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option.setName("pin").setDescription("Pin the posted message?")
        )
        .addBooleanOption((option) =>
          option.setName("embed").setDescription("Post message as embed?")
        )
        .addStringOption((option) =>
          option
            .setName("skip1")
            .setDescription("Skip channels with this character")
            .addChoices({ name: "┃", value: "┃" }, { name: "-", value: "-" })
        )
        .addStringOption((option) =>
          option.setName("skip2").setDescription("Skip channels with this character")
        )
        .addStringOption((option) =>
          option.setName("skip3").setDescription("Skip channels with this character")
        )
        .addStringOption((option) =>
          option.setName("skip4").setDescription("Skip channels with this character")
        )
        .addStringOption((option) =>
          option.setName("skip5").setDescription("Skip channels with this character")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all posted in bulk messages")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove posted bulk messages")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ID of messages posted using this command")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("find")
        .setDescription("Find #ID based on messsage ID")
        .addStringOption((option) =>
          option.setName("message_id").setDescription("Message ID").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update_message")
        .setDescription("Update posted message")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel where message was posted")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("message_id").setDescription("Message ID").setRequired(true)
        )
        .addBooleanOption((option) =>
          option.setName("embed").setDescription("Post message as embed?")
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "channels") {
      const channels = interaction.options.getString("channels");
      const pin = interaction.options.getBoolean("pin") ?? false;
      const embed = interaction.options.getBoolean("embed") ?? false;

      let promisses = [];
      let postedMessagesInfo = [];
      let files = [];

      await interaction.reply({
        content: `> *Post your message which you want to send and send it...*`,
      });

      const filter = (m) => m.author.id === interaction.user.id;

      interaction.channel
        .awaitMessages({ filter, max: 1, time: 300000, errors: ["time"] })
        .then(async (collected) => {
          //console.log(collected.first().attachments)

          const channelsSplitted = channels.trim().split(" ");
          const message = await collected.first().content;

          if (message.length < 5) {
            return await interaction.followUp(`> *Your message is too short...*`);
          }

          await collected.first().attachments.forEach((attachment) => {
            files.push(new AttachmentBuilder(attachment.url, { name: attachment.name }));
          });
          //collected.first().delete()

          for (channelMention of channelsSplitted) {
            channelMention = channelMention.trim();

            if (channelMention.length > 5) {
              if (channelMention.startsWith("<#") && channelMention.endsWith(">")) {
                channelMention = channelMention.slice(2, -1);

                let channelData = interaction.guild.channels.cache.get(channelMention);

                if (channelData) {
                  if (embed == true) {
                    const embedMessage = new EmbedBuilder()
                      .setColor("#0000cc")
                      .setDescription(`${message}`);

                    promisses.push(
                      channelData.send({ embeds: [embedMessage], files: files }).then((mess) => {
                        postedMessagesInfo.push({
                          channel: channelData.id,
                          message: mess.id,
                        });
                        if (pin === true) {
                          mess.pin();
                        }
                      })
                    );
                  } else {
                    promisses.push(
                      channelData.send({ content: message, files: files }).then((mess) => {
                        postedMessagesInfo.push({
                          channel: channelData.id,
                          message: mess.id,
                        });
                        if (pin === true) {
                          mess.pin();
                        }
                      })
                    );
                  }
                }
              }
            }
          }

          interaction.followUp({
            content: `> *Your message will be posted on ${promisses.length} channel(s)*`,
          });

          if (promisses.length > 0) {
            await Promise.all(promisses);

            const newDatabase = await new Posts({
              gid: interaction.guildId,
              message: JSON.stringify(postedMessagesInfo),
              author_id: interaction.member.id,
              author_name: interaction.member.nickname
                ? interaction.member.nickname
                : interaction.member.user.username,
              type: "channels",
            });

            await newDatabase.save();

            interaction.followUp({
              content: `> *All messages were posted with ID: **${newDatabase._id.toString()}***`,
            });
          }
        })
        .catch((collected) => {
          interaction.followUp({
            content: `> *No message collected or message was in wrong format...*`,
          });
          console.log(`> *No message collected or message was in wrong format...*`);
          console.error(collected);
        });
    } else if (interaction.options.getSubcommand() === "category") {
      const category = interaction.options.getChannel("category");
      const pin = interaction.options.getBoolean("pin") ?? false;
      const embed = interaction.options.getBoolean("embed") ?? false;

      const skip1 = interaction.options.getString("skip1") ?? null;
      const skip2 = interaction.options.getString("skip2") ?? null;
      const skip3 = interaction.options.getString("skip3") ?? null;
      const skip4 = interaction.options.getString("skip4") ?? null;
      const skip5 = interaction.options.getString("skip5") ?? null;

      let promisses = [];
      let postedMessagesInfo = [];
      let files = [];

      let channels = await interaction.guild.channels.cache.filter(
        (c) => c.parentId === category.id
      );

      if (skip1 && skip1.length > 0) {
        channels = await channels.filter((c) => !c.name.includes(skip1));
      }
      if (skip2 && skip2.length > 0) {
        channels = await channels.filter((c) => !c.name.includes(skip2));
      }
      if (skip3 && skip3.length > 0) {
        channels = await channels.filter((c) => !c.name.includes(skip3));
      }
      if (skip4 && skip4.length > 0) {
        channels = await channels.filter((c) => !c.name.includes(skip4));
      }
      if (skip5 && skip5.length > 0) {
        channels = await channels.filter((c) => !c.name.includes(skip5));
      }

      if (channels.size < 1) {
        return await interaction.reply({ content: `> *No channels in this category*` });
      }

      await interaction.reply({
        content: `> *Post your message and add attachements which you want to send and send it...*`,
      });

      const filter = (m) => m.author.id === interaction.user.id;

      interaction.channel
        .awaitMessages({ filter, max: 1, time: 300000, errors: ["time"] })
        .then(async (collected) => {
          const message = await collected.first().content;
          await collected.first().attachments.forEach((attachment) => {
            files.push(new AttachmentBuilder(attachment.url, { name: attachment.name }));
          });
          //collected.first().delete()

          for (const [index, channelData] of channels) {
            if (embed == true) {
              const embedMessage = new EmbedBuilder()
                .setColor("#000099")
                .setDescription(`${message}`);

              promisses.push(
                channelData.send({ embeds: [embedMessage], files: files }).then((mess) => {
                  postedMessagesInfo.push({
                    channel: channelData.id,
                    message: mess.id,
                  });
                  if (pin === true) {
                    mess.pin();
                  }
                })
              );
            } else {
              promisses.push(
                channelData.send({ content: message, files: files }).then((mess) => {
                  postedMessagesInfo.push({
                    channel: channelData.id,
                    message: mess.id,
                  });
                  if (pin === true) {
                    mess.pin();
                  }
                })
              );
            }
          }

          interaction.followUp({
            content: `> *Your message will be posted on ${promisses.length} channel(s)*`,
          });

          if (promisses.length > 0) {
            await Promise.all(promisses);

            const newDatabase = await new Posts({
              gid: interaction.guildId,
              message: JSON.stringify(postedMessagesInfo),
              author_id: interaction.member.id,
              author_name: interaction.member.nickname
                ? interaction.member.nickname
                : interaction.member.user.username,
              type: "category",
            });

            await newDatabase.save();

            interaction.followUp({
              content: `> *All messages were posted with ID: ${newDatabase._id.toString()}*`,
            });
          }
        });
    } else if (interaction.options.getSubcommand() === "list") {
      const logs = await Posts.find({ gid: interaction.guildId });

      let message = "";

      if (!logs || logs.length < 1) {
        return await interaction.reply(`> *Not found any logs on this server*`);
      }

      logs.forEach((log) => {
        if (message.length > 0) {
          message += `\n-----\n`;
        }

        let mdate = "";
        if (log.date > 0) {
          let tmp = new Date(log.date);
          mdate = `${tmp.getFullYear()}/${
            tmp.getMonth() + 1
          }/${tmp.getDate()} ${tmp.getHours()}:${tmp.getMinutes()}:${tmp.getSeconds()}`;
        } else {
          mdate = `-`;
        }

        let logmsg = JSON.parse(log.message)[0];
        let link = `https://discord.com/channels/${interaction.guildId}/${logmsg.channel}/${logmsg.message}`;

        message += `> **ID:** [#${log._id.toString()}](${link})\n> **Author:** <@${
          log.author_id
        }>\n> **Date:** ${mdate}\n> **Type:** ${log.type}`;
      });

      const embedMessage = new EmbedBuilder().setColor("#000099").setDescription(`${message}`);

      await interaction.reply({ embeds: [embedMessage] });
    } else if (interaction.options.getSubcommand() === "remove") {
      const id = interaction.options.getString("id");

      const log = await Posts.findOne({ gid: interaction.guildId, _id: id });

      if (!log || log.length < 1) {
        return await interaction.reply({
          content: `> *Not found log with ID **${id}** on this server*`,
        });
      }

      let promises = [];

      let logmsg;
      try {
        logmsg = JSON.parse(log.message);
      } catch (e) {
        console.log(e);
        return interaction.reply({
          content: `> *Something went wrong with fetching logged message, please report it* ${e.message}`,
        });
      }

      for (logone of logmsg) {
        promises.push(
          interaction.guild.channels.cache
            .get(logone.channel)
            .messages.fetch(logone.message)
            .then((m) => m.delete())
            .catch(console.error)
        );
      }

      await interaction.reply({ content: `> *Removing ${promises.length} message(s)*` });

      if (promises && promises.length > 0) {
        await Promise.all(promises);

        await Posts.deleteOne({ _id: id });

        await interaction.followUp({
          content: `> *All messages posted with ID: **${id}** got REMOVED*`,
        });
      }
    } else if (interaction.options.getSubcommand() === "find") {
      const message_id = interaction.options.getString("message_id");

      if (!/^-?\d+$/.test(message_id)) {
        return await interaction.reply(`> *Incorrect Message ID*`);
      }

      const log = await Posts.findOne({
        gid: interaction.guildId,
        message: { $regex: '"message":"' + message_id + '"' },
      });

      if (!log) {
        return await interaction.reply({
          content: `> *Not found any log which could contains Message ID **${message_id}** on this server*`,
        });
      }

      let mdate = "";
      if (log.date > 0) {
        let tmp = new Date(log.date);
        mdate = `${tmp.getFullYear()}/${
          tmp.getMonth() + 1
        }/${tmp.getDate()} ${tmp.getHours()}:${tmp.getMinutes()}:${tmp.getSeconds()}`;
      } else {
        mdate = `-`;
      }

      const embedMessage = new EmbedBuilder()
        .setColor("#000099")
        .setTitle(`Found entry with ID: #${log.id}`)
        .setDescription(
          `> **ID:** ${log.id}\n> **Author:** <@${log.author_id}>\n> **Date:** ${mdate}\n> **Type:** ${log.type}`
        );

      await interaction.reply({ embeds: [embedMessage] });
    } else if (interaction.options.getSubcommand() === "update_message") {
      const channel = interaction.options.getChannel("channel");
      const message_id = interaction.options.getString("message_id").trim();
      const embed = interaction.options.getBoolean("embed") ?? false;

      let files = [];

      try {
        const channelHandle = await interaction.client.channels.cache.get(channel.id);
        const originalMessage = await channelHandle.messages.fetch(message_id);

        if (originalMessage.author.id !== interaction.client.user.id) {
          return await interaction.reply(
            `> *I'm not the author of this message! I can't update it!*`
          );
        }

        await interaction.reply({
          content: `> *Post your updated message and send it...*`,
        });

        const filter = (m) => m.author.id === interaction.user.id;

        interaction.channel
          .awaitMessages({ filter, max: 1, time: 300000, errors: ["time"] })
          .then(async (collected) => {
            const message = await collected.first().content;

            if (message.length < 5) {
              return await interaction.followUp(`> *Your message is too short...*`);
            }

            await collected.first().attachments.forEach((attachment) => {
              files.push(new AttachmentBuilder(attachment.url, { name: attachment.name }));
            });

            if (embed == true) {
              const embedMessage = new EmbedBuilder()
                .setColor("#0000cc")
                .setDescription(`${message}`);

              originalMessage.edit({
                content: "",
                embeds: [embedMessage],
                files: files,
              });
            } else {
              originalMessage.edit({ content: message, embeds: [], files: files });
            }

            interaction.followUp({
              content: `> *Your message has been updated!*`,
            });
          })
          .catch((collected) => {
            interaction.followUp({
              content: `> *No message collected or message was in wrong format...*`,
            });
            console.error(collected);
          });
      } catch (error) {
        return await interaction.reply(
          `> *Failed to update message with ID **${message_id}** on the channel **${channel}** *`
        );
      }
    }
  },
};
