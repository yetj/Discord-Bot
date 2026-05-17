const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MessageFlags,
} = require("discord.js");
const { ChannelTimer } = require("../dbmodels/channel_timer");
const tryCatch = require("../utils/tryCatch");

const ChannelTimerCommand = {
  data: new SlashCommandBuilder()
    .setName("channel_timer")
    .setDescription("Setup channel for displaying a current time in UTC format")
    .addSubcommand(
      (subcommand) =>
        subcommand
          .setName("create")
          .setDescription("Create a channel timer.")
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("Channel to display the time")
              .addChannelTypes(ChannelType.GuildVoice)
              .setRequired(true),
          ),
      // .addStringOption((option) =>
      //   option
      //     .setName("text")
      //     .setDescription("Text to display with the time. | Default: {clock} {time} {timezone}"),
      // )
      // .addStringOption((option) =>
      //   option
      //     .setName("timezone")
      //     .setDescription("Timezone to display the time in (e.g. UTC, GMT, EST, etc.)"),
      // ),
    )

    .addSubcommand((subcommand) =>
      subcommand.setName("remove").setDescription("Remove a channel timer."),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "create") {
      const channel = interaction.options.getChannel("channel");
      const timezone = interaction.options.getString("timezone") ?? "UTC";
      const text = interaction.options.getString("text") ?? "{clock} {time} {timezone}";

      try {
        const timer = await ChannelTimer.findOneAndUpdate(
          { gid: interaction.guildId },
          {
            gid: interaction.guildId,
            channel_id: channel.id,
            timezone: timezone ?? "UTC",
            text: text ?? "{clock} {time} {timezone}",
            last_updated: new Date(),
          },
          { upsert: true, new: true },
        );

        await this.updateChannelName(interaction.client, timer, true);

        let message = `Channel timer set up for ${channel} in timezone ${timezone || "UTC"} with text:\n\`${text || "{clock} {time} {timezone}"}\``;

        const embedMessage = new EmbedBuilder()
          .setColor(`#21d805`)
          .setTitle(`Channel Timer Set Up`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [c6cbf7] Error setting up channel timer. Please try again later.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (interaction.options.getSubcommand() === "remove") {
      try {
        const result = await ChannelTimer.findOneAndDelete({ gid: interaction.guildId });
        if (!result) {
          let message = `No channel timer found for this guild.`;

          const embedMessage = new EmbedBuilder()
            .setColor(`#f74444`)
            .setTitle(`Channel Timer Not Found`)
            .setDescription(message);

          return await interaction.reply({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
        }

        let message = `Channel timer removed successfully`;

        const embedMessage = new EmbedBuilder()
          .setColor(`#0cb923`)
          .setTitle(`Channel Timer Removed`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [c69088] Error removing channel timer. Please try again later.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
  async autoload(client) {
    try {
      setInterval(async () => {
        await this.updateTime(client);
      }, 1000 * 60);
    } catch (err) {
      console.error(`> [c4d12a] Error on autoloading channel timer.`, err);
    }
  },
  async updateTime(client) {
    try {
      const timers = await ChannelTimer.find();

      for (const timer of timers) {
        await this.updateChannelName(client, timer, false);
      }
    } catch (error) {
      console.error(`> [c4d42a] Error updating channel timer.`, error);
    }
  },
  async updateChannelName(client, timer, force = false) {
    const channel = await client.channels.fetch(timer.channel_id).catch(() => null);
    if (!channel) {
      // if channel doesn't exist, remove the timer from the database and notify in the system channel if possible
      const guild =
        client.guilds.cache.get(timer.gid) ||
        (await client.guilds.fetch(timer.gid).catch(() => null));
      const systemChannel = guild?.systemChannel;
      if (
        systemChannel &&
        systemChannel.permissionsFor(client.user)?.has(PermissionFlagsBits.SendMessages)
      ) {
        try {
          let message = `The channel timer for <#${timer.channel_id}> has been removed because the configured channel is no longer available.`;
          message += `\nIf you want to set up the channel timer again, please use the \`/channel_timer\` command.`;

          const embedMessage = new EmbedBuilder()
            .setColor(`#DB0000`)
            .setTitle(`Channel Timer Removed`)
            .setDescription(message);

          await systemChannel.send({ embeds: [embedMessage] });
        } catch (sendError) {
          console.error(`> [c4d33a] Failed to send channel-timer removal notification.`, sendError);
        }
      }

      await timer.delete();
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      timeZone: timer.timezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const [timezoneHourStr, timezoneMinuteStr] = timeString.split(":");
    const timezoneHour = Number(timezoneHourStr);
    const timezoneMinute = Number(timezoneMinuteStr);
    const roundedMinute = Math.floor(timezoneMinute / 10) * 10;
    const displayHour = String(timezoneHour).padStart(2, "0");
    const displayMinute = String(roundedMinute).padStart(2, "0");
    const displayTime = `${displayHour}:${displayMinute}`;

    // Skip update if the last update was less than 10 minutes ago
    if (!force && now - timer.last_updated < 1000 * 60 * 10) {
      return;
    }

    let clockEmoji = "🕒";

    (timezoneHour === 0 || timezoneHour === 12) && (clockEmoji = "🕛");
    (timezoneHour === 1 || timezoneHour === 13) && (clockEmoji = "🕐");
    (timezoneHour === 2 || timezoneHour === 14) && (clockEmoji = "🕑");
    (timezoneHour === 3 || timezoneHour === 15) && (clockEmoji = "🕒");
    (timezoneHour === 4 || timezoneHour === 16) && (clockEmoji = "🕓");
    (timezoneHour === 5 || timezoneHour === 17) && (clockEmoji = "🕔");
    (timezoneHour === 6 || timezoneHour === 18) && (clockEmoji = "🕕");
    (timezoneHour === 7 || timezoneHour === 19) && (clockEmoji = "🕖");
    (timezoneHour === 8 || timezoneHour === 20) && (clockEmoji = "🕗");
    (timezoneHour === 9 || timezoneHour === 21) && (clockEmoji = "🕘");
    (timezoneHour === 10 || timezoneHour === 22) && (clockEmoji = "🕙");
    (timezoneHour === 11 || timezoneHour === 23) && (clockEmoji = "🕚");

    const displayText = timer.text
      .replace("{time}", displayTime)
      .replace("{clock}", clockEmoji)
      .replace("{timezone}", timer.timezone);

    try {
      // Only update if the name has actually changed to avoid unnecessary updates
      if (channel.name !== displayText) {
        await channel.setName(displayText);
        await ChannelTimer.findByIdAndUpdate(timer._id, { last_updated: new Date() });
      }
    } catch (err) {
      console.error(`> [c4d32a] Error updating channel name for timer ${timer._id}.`, err);
    }
  },
};

module.exports = {
  ChannelTimerCommand,
};
