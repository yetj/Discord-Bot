const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

const { ScheduledMessages } = require("../dbmodels/scheduled-messages.js");
const getDisplayName = require("../utils/getDisplayName.js");
const formattedDate = require("../utils/formattedDate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Schedule message to be posted on the channel at the specific time.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Schedule message to post it on specific channel")
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription("Use the following format: YYYY/MM/DD HH:MM UTC+X")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("title")
            .setDescription("Title of the message (this is not send in message)")
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Select channel to post message")
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
      subcommand.setName("list").setDescription("List all scheduled messages")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show")
        .setDescription("Show scheduled message")
        .addStringOption((option) =>
          option
            .setName("scheduled_message_id")
            .setDescription("Select scheduled message to show")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove scheduled message")
        .addStringOption((option) =>
          option
            .setName("scheduled_message_id")
            .setDescription("Select scheduled message to remove")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "add") {
      let date = interaction.options.getString("date");
      const title = interaction.options.getString("title").trim();
      const channel = interaction.options.getChannel("channel");
      const pin = interaction.options.getBoolean("pin") ? 1 : 0;
      const embed = interaction.options.getBoolean("embed") ? 1 : 0;

      if (
        !date.match(
          /^(?:(?:19|20)\d{2})\/(?:(?:0[1-9])|(?:1[0-2]))\/(?:(?:0[1-9])|(?:1\d)|(?:2\d)|(?:3[0-1]))\s(?:[01]\d|2[0-3]):(?:[0-5]\d)\s(?:GMT|UTC)(?:[+-]\d{1,2})?$/
        )
      ) {
        return await interaction.reply(
          `> *Date is in wrong format, please use the following format:*\n> **YYYY/MM/DD HH:MM UTC+X**\n> Example: *2023/04/24 16:32 UTC+2*`
        );
      }

      try {
        date = Date.parse(date);
      } catch (err) {
        console.error(err);
        return await interaction.reply(`> *Couldn't parse date!*\n> ERROR: \`${err.message}\``);
      }

      if (date < Math.floor(new Date().getTime())) {
        return await interaction.reply(
          `> The selected date has already passed. Please select date in the future.`
        );
      }

      await interaction.reply({
        content: `> *Post your message which you want to schedule...*\n> **NOTE:** Attachements are not supported yet!`,
      });

      const filter = (m) => m.author.id === interaction.user.id;

      interaction.channel
        .awaitMessages({ filter, max: 1, time: 300000, errors: ["time"] })
        .then(async (collected) => {
          const message = await collected.first().content;

          if (message.length < 5) {
            return await interaction.followUp(`> *Your message is too short...*`);
          }

          const interactionMember = await interaction.guild.members.fetch(interaction.user.id);

          try {
            const scheduledMessage = new ScheduledMessages({
              gid: interaction.guildId,
              author_id: interaction.user.id,
              author_name: getDisplayName(interactionMember),
              date: date,
              channel_id: channel.id,
              title: title,
              message: message,
              pin: pin,
              embed: embed,
            });

            await scheduledMessage.save();

            let confirmationMessage = `**Scheduled date**: ${formattedDate(date, "date_time")}\n`;
            confirmationMessage += `**Title**: ${title}\n`;
            confirmationMessage += `**Channel**: ${channel}\n`;
            confirmationMessage += `**Pin**: ${pin ? "True" : "False"}\n`;
            confirmationMessage += `**Embed**: ${embed ? "True" : "False"}\n`;

            const embedMessage = new EmbedBuilder()
              .setColor(`#009900`)
              .setTitle(`New scheduled message added to the database`)
              .setDescription(confirmationMessage);

            await interaction.followUp({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
          } catch (err) {
            console.error(err);
            return await interaction.followUp({
              content: `> *Something went wrong while saving the scheduled message to the database...*\n> ERROR: \`${err.message}\``,
            });
          }
        });
    } else if (interaction.options.getSubcommand() === "list") {
      const scheduledMessages = await ScheduledMessages.find({
        gid: interaction.guildId,
        posted: 0,
      }).sort({ date: 1 });

      if (!scheduledMessages || scheduledMessages.length < 1) {
        return await interaction.reply({
          content: `> *No scheduled messages for this server*`,
          flags: MessageFlags.Ephemeral,
        });
      }

      let msg = ``;
      for (const scheduledMessage of scheduledMessages) {
        if (msg.length > 0) {
          msg += `\n-----\n`;
        }

        msg += `**Scheduled date**: ${formattedDate(scheduledMessage.date, "date_time")}\n`;
        msg += `**Title**: ${scheduledMessage.title}\n`;
        msg += `**Author**: <@${scheduledMessage.author_id}> *(${scheduledMessage.author_name})*\n`;
        msg += `**Channel**: <#${scheduledMessage.channel_id}>\n`;
        msg += `**Pin**: ${scheduledMessage.pin ? "True" : "False"}\n`;
        msg += `**Embed**: ${scheduledMessage.embed ? "True" : "False"}`;
      }

      const embedMessage = new EmbedBuilder().setColor(`#0000aa`).setDescription(msg);

      await interaction.reply({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
    } else if (interaction.options.getSubcommand() === "show") {
      const id = interaction.options.getString("scheduled_message_id");

      const scheduledMessage = await ScheduledMessages.findOne({
        gid: interaction.guildId,
        _id: id,
      });

      if (!scheduledMessage) {
        return await interaction.reply(`> *Can't find selected scheduled message*`);
      }

      let message = ``;
      message += `**Scheduled date:** ${formattedDate(scheduledMessage.date, "date_time")}\n`;
      message += `**Title:** ${scheduledMessage.title}\n`;
      message += `**Author:** <@${scheduledMessage.author_id}> *(${scheduledMessage.author_name})*\n`;
      message += `**Channel:** <#${scheduledMessage.channel_id}>\n`;
      message += `**Pin:** ${scheduledMessage.pin ? "True" : "False"}\n`;
      message += `**Embed:** ${scheduledMessage.embed ? "True" : "False"}\n`;

      let embedMessage = new EmbedBuilder()
        .setTitle("Scheduled post information")
        .setColor("#00ffff")
        .setDescription(`${message}`);

      await interaction.reply({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });

      if (scheduledMessage.embed == 1) {
        embedMessage = new EmbedBuilder()
          .setColor("#00a4db")
          .setDescription(`${scheduledMessage.message}`);

        await interaction.followUp({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
      } else {
        await interaction.followUp({
          content: `${scheduledMessage.message}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (interaction.options.getSubcommand() === "remove") {
      const id = interaction.options.getString("scheduled_message_id");

      try {
        const scheduledMessage = await ScheduledMessages.findOneAndDelete({
          gid: interaction.guildId,
          _id: id,
        });

        if (!scheduledMessage) {
          return await interaction.reply(`> *Can't find selected scheduled message*`);
        }

        await interaction.reply({
          content: `> Scheduled message with title **${scheduledMessage.title}** removed!`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        console.error("[baac34] ", err);
        return await interaction.reply({
          content: `> *Something went wrong while removing the scheduled message from the database...*\n> ERROR: \`${err.message}\``,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);

    let choices = [];
    if (focusedOption.name === "scheduled_message_id") {
      try {
        const scheduledMessages = await ScheduledMessages.find({
          gid: interaction.guildId,
          date: { $gte: new Date() },
          posted: 0,
        }).sort({ date: 1 });

        for await (const entry of scheduledMessages) {
          choices.push({
            name: `[${formattedDate(entry.date, "date_time")}] ${entry.title}`,
            value: entry._id.toString(),
          });
        }
      } catch (err) {
        console.error("[b4c0aa] ", err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      const limitedResults = filtered.slice(0, 20);
      await interaction.respond(
        limitedResults.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }
  },
  async autoload(client) {
    try {
      setInterval(async () => {
        this.autoPost(client);
      }, 1000 * 30);
    } catch (err) {
      console.error("[bgh24f] ", err);
    }
  },
  async autoPost(client) {
    try {
      const messagesToPost = await ScheduledMessages.find({
        posted: 0,
        date: { $lt: new Date() },
      });

      if (!messagesToPost || messagesToPost.length < 1) {
        return;
      }

      for (const messageToPost of messagesToPost) {
        const server = await client.guilds.cache.get(messageToPost.gid);

        if (!server) {
          console.log(`> Server not found: ${messageToPost.gid}`);
          continue;
        }

        const channel = await server.channels.cache.find((c) => c.id === messageToPost.channel_id);

        if (!channel) {
          console.log(`> Channel not found: ${messageToPost.channel_id}`);
          continue;
        }

        if (messageToPost.embed) {
          const embedMessage = new EmbedBuilder()
            .setColor("#000099")
            .setDescription(`${messageToPost.message}`);

          channel.send({ embeds: [embedMessage] }).then((mess) => {
            if (messageToPost.pin) {
              mess.pin();
            }
          });
        } else {
          channel.send(`${messageToPost.message}`).then((mess) => {
            if (messageToPost.pin) {
              mess.pin();
            }
          });
        }

        await messageToPost.deleteOne();
      }
    } catch (err) {
      console.error("[autoPost] ", err);
    }
  },
};
