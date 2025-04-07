const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  AuditLogEvent,
} = require("discord.js");
const LeaveNotification = require("../dbmodels/leave-notification.js");
const getDisplayName = require("../utils/getDisplayName.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave-notification")
    .setDescription("Notify on the channel that member with a role left the server.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add notification")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role that member must have to be notified if he left the server")
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Select channel where leave notification should be sent")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.PrivateThread,
              ChannelType.PublicThread
            )
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role_to_be_mentioned")
            .setDescription(
              "Role to be mentioned on notification when user with role left the server"
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove leave notification")
        .addStringOption((option) =>
          option.setName("id").setDescription("Leave notification ID").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all leave notifications")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "add") {
      // check if bot has access to see audit logs
      if (!interaction.member.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        return await interaction.reply({
          content: `Bot doesn't have permissions to view audit logs.`,
          ephemeral: true,
        });
      }

      const role = interaction.options.getRole("role");
      const role_to_be_mentioned = interaction.options.getRole("role_to_be_mentioned");
      const channel = interaction.options.getChannel("channel");

      if (role && channel) {
        const notification = await LeaveNotification.findOne({
          gid: interaction.guildId,
          role_id: role.id,
          channel_id: channel.id,
        });

        if (notification) {
          return await interaction.reply(`> This leave notification already exist`);
        }

        const newDatabase = await new LeaveNotification({
          gid: interaction.guildId,
          role_id: role.id,
          channel_id: channel.id,
          role_id_to_be_mentioned: role_to_be_mentioned?.id,
        });

        await newDatabase.save();

        let message = "";
        message += `> **ID:** ${newDatabase._id.toString()}\n`;
        message += `> **Role:** <@&${newDatabase.role_id}>\n`;
        message += `> **Channel:** <#${newDatabase.channel_id}>\n`;
        if (role_to_be_mentioned) {
          message += `> **Role to be mentioned:** <@&${newDatabase.role_id_to_be_mentioned}>`;
        } else {
          message += `> **Role to be mentioned:** -`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#009900")
          .setTitle(`Leave notification added`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage] });
      }
    } else if (interaction.options.getSubcommand() === "remove") {
      const id = interaction.options.getString("id");

      let notification = null;

      try {
        notification = await LeaveNotification.findOne({ gid: interaction.guildId, _id: id });
      } catch (err) {}

      if (!notification || notification.length < 1) {
        return await interaction.reply({
          content: `> *Leave notification with ID **${id}** NOT found on this server*`,
        });
      }

      await interaction.reply(
        `> *Leave notification with ID **${id}** [Role: <@&${notification.role_id}> | Channel: <#${notification.channel_id}>] has been removed.*`
      );

      try {
        await LeaveNotification.deleteOne({ _id: id });
      } catch (e) {
        console.error(e);
        await interaction.followUp(
          `[t43da] Error while removing leave notification setting. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "list") {
      const notifications = await LeaveNotification.find({ gid: interaction.guildId });

      let message = "";

      if (!notifications || notifications.length < 1) {
        return await interaction.reply(`> *Not found any leave notifications on this server*`);
      }

      notifications.forEach((notification) => {
        if (message.length > 0) {
          message += `\n-----\n`;
        }

        message += `> **ID:** ${notification._id.toString()}\n`;
        message += `> **Role:** <@&${notification.role_id}> - ${notification.role_id}\n`;
        message += `> **Channel:** <#${notification.channel_id}> - ${notification.channel_id}\n`;
        if (notification.role_id_to_be_mentioned) {
          message += `> **Role to be mentioned:** <@&${notification.role_id_to_be_mentioned}> - ${notification.role_id_to_be_mentioned}`;
        } else {
          message += `> **Role to be mentioned:** -`;
        }
      });

      const embedMessage = new EmbedBuilder()
        .setColor("#000099")
        .setTitle(`Leave notifications`)
        .setDescription(`${message}`);

      await interaction.reply({ embeds: [embedMessage] });
    }
  },
  async autoload(client) {
    client.on("guildMemberRemove", async (member) => {
      try {
        const notifications = await LeaveNotification.find({ gid: member.guild.id });

        const bot = await member.guild.members.fetch(client.user.id, { force: true });

        const hasPermsToViewAuditLog = await bot.permissions.has(PermissionFlagsBits.ViewAuditLog);

        if (notifications && notifications.length > 0) {
          let message = `has left the server.`;

          if (hasPermsToViewAuditLog) {
            const logs = await member.guild.fetchAuditLogs({
              limit: 1,
              type: AuditLogEvent.MemberKick,
            });
            const kickLog = logs.entries.first();

            if (kickLog) {
              if (kickLog.createdAt > member.joinedAt) {
                const { executor, target, reason } = kickLog;
                if (target.id === member.id) {
                  if (reason) {
                    message = `has been kicked by **${executor}** with a reason: \`${reason}\`.`;
                  } else {
                    message = `has been kicked by **${executor}**.`;
                  }
                }
              }
            }
          } else {
            message += ` *(No access to Audit logs)*`;
          }

          notifications.forEach((notification) => {
            if (member.roles.cache.has(notification.role_id)) {
              member.guild.channels
                .fetch(notification.channel_id, {
                  force: true,
                })
                .then(async (channel) => {
                  try {
                    if (notification.role_id_to_be_mentioned?.length > 0) {
                      await channel.send(
                        `> *<@&${notification.role_id_to_be_mentioned}> **${getDisplayName(
                          member
                        )}** ${message}*`
                      );
                    } else {
                      await channel.send(`> ***${getDisplayName(member)}** ${message}*`);
                    }
                  } catch (err) {
                    console.error(`[f34f3] Couldn't post message: `, err.message);
                  }
                });
            }
          });
        }
      } catch (err) {
        console.error("ERROR [g3vw5] ", err);
      }
    });
  },
};
