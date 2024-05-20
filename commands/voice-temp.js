const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const VoiceTempSettings = require("../dbmodels/voice-temp-settings.js");
const VoiceTempChannels = require("../dbmodels/voice-temp-channels.js");
const getDisplayName = require("../utils/getDisplayName.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voice-temp")
    .setDescription("Clone voice temporary voice channels after join.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add notification")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Select channel that will be cloned")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("new_channel_category")
            .setDescription("Select category for new channels")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("new_channel_name")
            .setDescription("New channel name | Variables: {username} {displayname} {number}")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove configured channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Select channel to be remove configuration")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all configured channels")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "add") {
      const channel = interaction.options.getChannel("channel");
      const new_channel_name = interaction.options.getString("new_channel_name");
      const new_channel_category = interaction.options.getChannel("new_channel_category");

      if (!channel || !new_channel_name || !new_channel_category) {
        return await interaction.reply(`> *Please fill all required fields*`);
      }

      const configuredChannel = await VoiceTempSettings.findOne({
        gid: interaction.guildId,
        channel_id: channel.id,
      });

      if (configuredChannel) {
        return await interaction.reply(`> This channel is already configured`);
      }

      const newDatabase = await new VoiceTempSettings({
        gid: interaction.guildId,
        channel_id: channel.id,
        new_channel_name: new_channel_name,
        new_channel_category: new_channel_category.id,
      });

      await newDatabase.save();

      let message = "";
      message += `> **Channel:** <#${newDatabase.channel_id}>\n`;
      message += `> **Parent category:** **<#${newDatabase.new_channel_category}>** - \`${newDatabase.new_channel_category}\`\n`;
      message += `> **New channel name:** \`${newDatabase.new_channel_name}\``;

      const embedMessage = new EmbedBuilder()
        .setColor("#009900")
        .setTitle(`New Voice Temp channel configured`)
        .setDescription(`${message}`);

      await interaction.reply({ embeds: [embedMessage] });
    } else if (interaction.options.getSubcommand() === "remove") {
      const channel = interaction.options.getChannel("channel");

      let channelToRemove = null;

      try {
        channelToRemove = await VoiceTempSettings.findOne({
          gid: interaction.guildId,
          channel_id: channel.id,
        });
      } catch (err) {}

      if (!channelToRemove) {
        return await interaction.reply({
          content: `> *Channel ${channel} is not configured.*`,
        });
      }

      await interaction.reply(`> *${channel} voice configuration has been removed.*`);

      try {
        await VoiceTempSettings.deleteOne({ gid: interaction.guild.id, channel_id: channel.id });
      } catch (e) {
        console.error(e);
        await interaction.followUp(
          `[h564h] Error while removing channel configuration. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "list") {
      const configuredChannels = await VoiceTempSettings.find({ gid: interaction.guildId });

      let message = "";

      if (!configuredChannels || configuredChannels.length < 1) {
        return await interaction.reply(`> *Not found any configured channels on this server*`);
      }

      configuredChannels.forEach((configuredChannel) => {
        if (message.length > 0) {
          message += `\n-----\n`;
        }

        message += `> **Channel:** <#${configuredChannel.channel_id}> - \`${configuredChannel.channel_id}\`\n`;
        message += `> **Parent category:** **<#${configuredChannel.new_channel_category}>** - \`${configuredChannel.new_channel_category}\`\n`;
        message += `> **New channel name:** \`${configuredChannel.new_channel_name}\``;
      });

      const embedMessage = new EmbedBuilder()
        .setColor("#000099")
        .setTitle(`Configured channels`)
        .setDescription(`${message}`);

      await interaction.reply({ embeds: [embedMessage] });
    }
  },
  async autoload(client) {
    client.on("voiceStateUpdate", async (oldState, newState) => {
      let newChannel;
      let oldChannel;

      if (oldState.channel) {
        oldChannel = await oldState.guild.channels.fetch(oldState.channel.id);
      }

      if (newState.channel) {
        newChannel = await newState.guild.channels.fetch(newState.channel.id);
      }

      if (newChannel) {
        const configuredNewChannel = await VoiceTempSettings.findOne({
          gid: newState.guild.id,
          channel_id: newState.channelId,
        });

        if (configuredNewChannel) {
          let newChannelName = configuredNewChannel.new_channel_name;

          newChannelName = newChannelName.replace("{username}", newState.member.user.username);
          newChannelName = newChannelName.replace("{displayname}", getDisplayName(newState.member));
          newChannelName = newChannelName.replace(
            "{number}",
            Math.floor(Math.random() * (9999 - 1000) + 1000)
          );

          const createdChannel = await newChannel.clone({ name: newChannelName });

          if (createdChannel) {
            const category = await newState.guild.channels.cache.get(
              configuredNewChannel.new_channel_category
            );
            const newPosition = category.children.cache.size;

            await createdChannel.setParent(configuredNewChannel.new_channel_category, {
              lockPermissions: false,
            });
            await createdChannel.setPosition(newPosition - 1);
            await newState.member.voice.setChannel(createdChannel);

            const newDatabase = await new VoiceTempChannels({
              gid: newState.guild.id,
              channel_id: createdChannel.id,
              owner_id: newState.member.id,
            });

            await newDatabase.save();
          }
        }
      }

      if (oldChannel) {
        if (oldChannel?.members?.size == 0) {
          const configuredOldChannel = await VoiceTempChannels.findOne({
            gid: newState.guild.id,
            channel_id: oldState.channelId,
          });

          if (configuredOldChannel) {
            try {
              await VoiceTempChannels.deleteMany({
                gid: oldChannel.guild.id,
                channel_id: oldChannel.id,
              });

              await oldChannel.delete();
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    });
    client.on("guildDelete", async (guild) => {
      try {
        await VoiceTempSettings.deleteMany({
          gid: guild.id,
        });

        await VoiceTempChannels.deleteMany({
          gid: guild.id,
        });
      } catch (e) {
        console.error(e);
      }
    });
    client.on("channelDelete", async (channel) => {
      try {
        await VoiceTempSettings.deleteMany({
          gid: channel.guild.id,
          channel_id: channel.id,
        });
      } catch (e) {
        console.error(e);
      }
    });
  },
};
