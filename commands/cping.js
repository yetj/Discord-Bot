const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const { CustomPing } = require("../dbmodels/cping.js");

const CustomPingSetupCommands = {
  data: new SlashCommandBuilder()
    .setName("cping-setup")
    .setDescription("Custom ping.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add role that can ping another role")
        .addRoleOption((option) =>
          option
            .setName("role_that_can_ping")
            .setDescription("Role that can ping different role")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("role_to_ping").setDescription("Role that can be pinged").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove configured custom ping")
        .addRoleOption((option) =>
          option
            .setName("role_that_can_ping")
            .setDescription("Role that can ping different role")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("role_to_ping").setDescription("Role that can be pinged").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List of custom ping configuration")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "add") {
      const role_that_can_ping = interaction.options.getRole("role_that_can_ping");
      const role_to_ping = interaction.options.getRole("role_to_ping");

      if (!role_that_can_ping || !role_to_ping) {
        return await interaction.reply({
          content: `> *Please fill all required fields*`,
          ephemeral: true,
        });
      }

      try {
        const configuredCustomPing = await CustomPing.findOne({
          gid: interaction.guildId,
          role_that_can_ping: role_that_can_ping.id,
          role_to_ping: role_to_ping.id,
        });

        if (configuredCustomPing) {
          return await interaction.reply({
            content: `> *Role ${role_that_can_ping} already has permissions to ping role ${role_to_ping}.*`,
            ephemeral: true,
          });
        }

        const newDatabase = await new CustomPing({
          gid: interaction.guildId,
          role_that_can_ping: role_that_can_ping.id,
          role_to_ping: role_to_ping.id,
        });

        await newDatabase.save();

        let message = "";
        message += `> **Role than can ping:** ${role_that_can_ping}\n`;
        message += `> **Role that can be pinged:** ${role_to_ping}\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#009900")
          .setTitle(`New Custom Ping added`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: `[g45h4d] Error while creating new Custom Ping. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "remove") {
      const role_that_can_ping = interaction.options.getRole("role_that_can_ping");
      const role_to_ping = interaction.options.getRole("role_to_ping");

      try {
        const customCustomPingToBeRemoved = await CustomPing.findOne({
          gid: interaction.guildId,
          role_that_can_ping: role_that_can_ping.id,
          role_to_ping: role_to_ping.id,
        });

        if (!customCustomPingToBeRemoved) {
          return await interaction.reply({
            content: `> *Role ${role_that_can_ping} doesn't have possibility to manage role ${role_to_ping}.*`,
            ephemeral: true,
          });
        }

        await CustomPing.deleteOne({
          gid: interaction.guild.id,
          role_that_can_ping: role_that_can_ping.id,
          role_to_ping: role_to_ping.id,
        });

        let message = "";
        message += `> **Role than can ping:** ${role_that_can_ping}\n`;
        message += `> **Role that can be pinged:** ${role_to_ping}\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#990000")
          .setTitle(`Custom Ping removed`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: `[h45fs] Error while removing Custom Ping. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "list") {
      try {
        const configuredCustomPing = await CustomPing.find({
          gid: interaction.guildId,
        });

        let message = "";

        if (!configuredCustomPing || configuredCustomPing.length < 1) {
          return await interaction.reply({
            content: `> *Not found any Custom Ping on this server*`,
            ephemeral: true,
          });
        }

        configuredCustomPing.forEach((cp) => {
          if (message.length > 0) {
            message += `-----\n`;
          }

          message += `> **Role than can ping:** <@&${cp.role_that_can_ping}>\n`;
          message += `> **Role that can be pinged:** <@&${cp.role_to_ping}>\n`;
        });

        const embedMessage = new EmbedBuilder()
          .setColor("#000099")
          .setTitle(`Configured Custom Pings`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: `[kbjf2] Error while listing Custom Ping. Please try again later.`,
          ephemeral: true,
        });
      }
    }
  },
  async autoload(client) {
    client.on("roleDelete", async (role) => {
      const guildId = role.guild.id;
      const roleId = role.id;
      const roleName = role.name;

      try {
        const results = await CustomPing.find({
          $and: [
            { gid: guildId },
            { $or: [{ role_that_can_ping: roleId }, { role_to_ping: roleId }] },
          ],
        });

        results.forEach(async (entry) => {
          const guild = await client.guilds.cache.get(entry.gid);

          if (guild) {
            guild.systemChannel.send(
              `> *Removed **Custom Ping** configuration for role **${roleName}** due to role removal.*`
            );

            console.log(
              `[CustomPing] Removed Custom Ping configuration for role "${roleName}" due to role removal on guild "${guild.name}".`
            );
          }
        });

        await CustomPing.deleteMany({
          $and: [
            { gid: guildId },
            { $or: [{ role_that_can_ping: roleId }, { role_to_ping: roleId }] },
          ],
        });
      } catch (err) {
        console.error("[g33ff] ERROR: ", err);
      }
    });

    client.on("guildDelete", async (guild) => {
      try {
        const results = CustomPing.find({ gid: guild.id });

        if (results) {
          await CustomPing.deleteMany({ gid: guild.id });
          console.log(
            `[CustomPing] Guild "${guild.name}" removed as bot was removed from the guild.`
          );
        }
      } catch (err) {
        console.error("[h45fsd] ERROR: ", err);
      }
    });
  },
};

const CustomPingCommands = {
  data: new SlashCommandBuilder()
    .setName("cping")
    .setDescription("Custom ping.")
    .addRoleOption((option) =>
      option.setName("role").setDescription("Select role you want to ping").setRequired(true)
    ),
  async execute(interaction) {
    const role = interaction.options.getRole("role");

    try {
      const configuredCustomPing = await CustomPing.find({
        gid: interaction.guildId,
        role_to_ping: role.id,
      });

      let hasPermsToPingRole = false;
      if (!configuredCustomPing) {
        return await interaction.reply({
          content: `> *Role ${role} can't be pinged.*`,
          ephemeral: true,
        });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        cache: true,
        force: true,
      });

      configuredCustomPing.forEach((cp) => {
        if (interactionUser.roles.cache.has(cp.role_that_can_ping)) {
          hasPermsToPingRole = true;
        }
      });

      if (!hasPermsToPingRole) {
        return await interaction.reply({
          content: `> *You don't have permissions to ping role ${role}.*`,
          ephemeral: true,
        });
      }

      await interaction.reply({ content: `${role}` });
    } catch (err) {
      console.error(err);
      await interaction.followUp({
        content: `> [niu9fi] Error while executing command **${interaction.options.getSubcommand()}** in Custom Role Manager. Please try again later.`,
        ephemeral: true,
      });
    }
  },
};

module.exports = {
  CustomPingSetupCommands,
  CustomPingCommands,
};
