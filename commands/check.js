const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check")
    .setDescription("Check bot informations.")
    .addSubcommand((subcommand) =>
      subcommand.setName("servers").setDescription("Check servers status")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("invite").setDescription("Check invite status")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("inviteme").setDescription("Check invitation status")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leave")
        .setDescription("Leave the server")
        .addStringOption((option) =>
          option.setName("server").setDescription("Server ID").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("roles_on_server").setDescription("Check number of roles on the server")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channels_on_server")
        .setDescription("Check number of channels on the server")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channels_renaming")
        .setDescription("Renames all channels on the server")
        .addStringOption((option) =>
          option.setName("find").setDescription("Find").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("replace").setDescription("Replace with").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channels_in_category")
        .setDescription("Check number of channels in specific category")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("Select category")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    if (interaction.member.id !== "165542890334978048") {
      return await interaction.reply({
        content: `> You are not authorized to use this command!`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "servers") {
      const guilds = interaction.client.guilds.cache;
      let sGuilds = "";

      guilds.forEach((guild) => {
        sGuilds += `*(${guild.id})* ${guild.name}\n`;
      });

      await interaction.reply({ content: `${sGuilds}` });
    } else if (interaction.options.getSubcommand() === "invite") {
      await interaction.reply({ content: `Link to invite bot:\n${interaction.client.inviteLink}` });
    } else if (interaction.options.getSubcommand() === "inviteme") {
      const channel = interaction.channel;

      if (
        !channel
          .permissionsFor(interaction.client.user)
          .has(PermissionFlagsBits.CreateInstantInvite)
      ) {
        return interaction.reply({
          content: "> ❌ No permission to create invitation for this channel.",
          ephemeral: true,
        });
      }

      try {
        const invite = await channel.createInvite({
          maxAge: 0,
          maxUses: 0,
          unique: true,
        });

        await interaction.reply({ content: `> Invitation link: ${invite.url}`, ephemeral: true });
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "[f258ad] Error while checking invitatation status.",
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "leave") {
      const server = interaction.options.getString("server");

      try {
        const srv = interaction.client.guilds.cache.get(server);

        if (srv) {
          srv
            .leave()
            .then(
              await interaction.reply({
                content: `Bot has left the guild: **${srv.name}** *(${srv.id})*`,
              })
            )
            .catch((err) => {
              console.log(`> [hj533]: There was an error leaving the guild: \n ${err.message}`);
            });
        } else {
          await interaction.reply({ content: `> Error: Bot is not on this guild...` });
        }
      } catch (e) {
        console.log(`Error [hj534]: ${e.message}`);
        await interaction.reply({ content: `> Error: Bot is not on this guild...` });
      }
    } else if (interaction.options.getSubcommand() === "roles_on_server") {
      await interaction.reply({
        content: `Roles on this server: **${interaction.guild.roles.cache.size}**`,
      });
    } else if (interaction.options.getSubcommand() === "channels_on_server") {
      await interaction.reply({
        content: `Channels on this server: **${interaction.guild.channels.cache.size}**`,
      });
    } else if (interaction.options.getSubcommand() === "channels_renaming") {
      const find = interaction.options.getString("find");
      const replace = interaction.options.getString("replace");

      if (!find || !replace) {
        return await interaction.reply({
          content: "> ❌ Please provide both find and replace strings.",
          ephemeral: true,
        });
      }

      const channels = interaction.guild.channels.cache.filter((c) => c.name.includes(find));

      if (channels.size === 0) {
        return await interaction.reply({
          content: `> No channels found with the name containing: **${find}**`,
        });
      }

      const promises = channels.map((channel) => {
        return channel.setName(channel.name.replace(find, replace));
      });

      await Promise.all(promises);

      await interaction.reply({
        content: `> Renamed **${channels.size}** channels from \`${find}\` to \`${replace}\``,
        ephemeral: true,
      });
    } else if (interaction.options.getSubcommand() === "channels_in_category") {
      const category = interaction.options.getChannel("category");
      await interaction.reply({
        content: `Channels in category **${category.name}**: **${
          interaction.guild.channels.cache.filter((c) => c.parentId === category.id).size
        }**`,
      });
    }
  },
};
