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
  EmbedAssertions,
} = require("discord.js");
const { MissingRoleNotification } = require("../dbmodels/missing-role-notification");
const interactiveForm = require("../utils/interactiveForm");
const getDisplayName = require("../utils/getDisplayName");

const MissingRoleNotificationCommands = {
  data: new SlashCommandBuilder()
    .setName("missing-role-notification")
    .setDescription("Notify about missing roles")
    .addSubcommand((subcommand) =>
      subcommand.setName("add").setDescription("Add notification about missing role")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove notification about missing roles")
        .addStringOption((option) =>
          option
            .setName("mrn_id")
            .setDescription("Missing role notification to remove")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List all settings for notifications about missing roles")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("manual-check").setDescription("Manually check for missing roles")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (interaction.options.getSubcommand() == "add") {
      const user = interaction.user;
      const channel = interaction.channel;

      const questions = [
        {
          id: "name",
          title: "Notification Name",
          description: "Name for this missing role notification",
          type: "text",
          isRaw: true,
        },
        {
          id: "missing_role_to_check",
          title: "Missing Role to Check",
          description: "The role that is considered missing.",
          type: "role",
          limit: 1,
          min: 1,
        },
        {
          id: "required_roles",
          title: "Required Roles",
          description: "Required roles that must be present for the missing role check to trigger.",
          type: "role",
          canBeSkipped: true,
        },
        {
          id: "require_all_roles",
          title: "Require All Roles?",
          description:
            "Whether all required roles must be present for the missing role check to trigger.",
          type: "boolean",
        },
        {
          id: "protected_roles",
          title: "Protected Roles",
          description:
            "If someone have this role, but doesn't have the missing role, they will NOT be notified.",
          type: "role",
          canBeSkipped: true,
        },
        {
          id: "channel_to_notify",
          title: "Notification Channel",
          description: "Channel where bot will send notifications about missing roles.",
          type: "channel",
          limit: 1,
          min: 1,
        },
        {
          id: "roles_to_notify",
          title: "Roles to Notify",
          description: "Roles that will be notified when a user is missing the specified role.",
          type: "role",
          canBeSkipped: true,
        },
      ];

      await interaction.reply({
        content: "> *Starting interactive setup of Missing Role Notification.*",
      });

      let callbackFunction = async (answers) => {
        try {
          const existingMRN = await MissingRoleNotification.findOne({
            gid: interaction.guildId,
            missing_role_to_check: answers["missing_role_to_check"]
              ? answers["missing_role_to_check"][0]
              : "",
          });

          if (existingMRN) {
            const embedMessage = new EmbedBuilder()
              .setColor(`#DB0000`)
              .setTitle(`Error Creating Missing Role Notification`)
              .setDescription(
                `A Missing Role Notification for the role <@&${answers["missing_role_to_check"][0]}> already exists. Please remove it first before creating a new one.`
              );

            return await interaction.followUp({
              embeds: [embedMessage],
              flags: MessageFlags.Ephemeral,
            });
          }
          const missingRoleToCheck = answers["missing_role_to_check"]
            ? answers["missing_role_to_check"][0]
            : null;

          if (
            (answers["required_roles"] && answers["required_roles"].includes(missingRoleToCheck)) ||
            (answers["protected_roles"] && answers["protected_roles"].includes(missingRoleToCheck))
          ) {
            const embedMessage = new EmbedBuilder()
              .setColor(`#DB0000`)
              .setTitle(`Error Creating Missing Role Notification`)
              .setDescription(
                `The role <@&${missingRoleToCheck}> is either required or protected and cannot be used for missing role notifications.`
              );

            return await interaction.followUp({
              embeds: [embedMessage],
              flags: MessageFlags.Ephemeral,
            });
          }

          const newMRN = await new MissingRoleNotification({
            gid: interaction.guildId,
            name: answers["name"] ?? "Default name",
            missing_role_to_check: answers["missing_role_to_check"]
              ? answers["missing_role_to_check"][0]
              : "",
            required_roles: answers["required_roles"] ?? [],
            require_all_roles: answers["require_all_roles"] ?? false,
            protected_roles: answers["protected_roles"] ?? [],
            channel_to_notify: answers["channel_to_notify"] ? answers["channel_to_notify"][0] : "",
            roles_to_notify: answers["roles_to_notify"] ?? [],
          });
          await newMRN.save();

          let message = `**Name:** ${newMRN["name"]}\n`;
          message += `**Missing Role to Check:** <@&${newMRN["missing_role_to_check"]}>\n`;
          message += `**Required Roles:** ${newMRN["required_roles"].length > 0 ? newMRN["required_roles"].map((id) => `<@&${id}>`).join(" ") : "*not set*"}\n`;
          message += `**Require All Roles:** ${newMRN["require_all_roles"] ? "Yes" : "No"}\n`;
          message += `**Protected Roles:** ${newMRN["protected_roles"].length > 0 ? newMRN["protected_roles"].map((id) => `<@&${id}>`).join(" ") : "*not set*"}\n`;
          message += `**Notification Channel:** <#${newMRN["channel_to_notify"]}>\n`;
          message += `**Roles to Notify:** ${newMRN["roles_to_notify"].length > 0 ? newMRN["roles_to_notify"].map((id) => `<@&${id}>`).join(" ") : "*not set*"}\n`;
          message += `\n> *To see all missing role notifications settings use this command:* \`/missing-role-notification list\``;

          const embedMessage = new EmbedBuilder()
            .setColor(`#00DB19`)
            .setTitle(`Missing role notification created`)
            .setDescription(message);

          await interaction.deleteReply();

          await interaction.followUp({ embeds: [embedMessage] });
        } catch (err) {
          console.error(err);
          return await interaction.followUp({
            content: `> [a9f588] Error while setting up Missing Role Notification. Please try again later.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      };

      await interactiveForm("mrn", interaction, questions, callbackFunction, true);
    } else if (interaction.options.getSubcommand() == "remove") {
      const mrnId = interaction.options.getString("mrn_id");
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const mrn = await MissingRoleNotification.findOneAndDelete({
          _id: mrnId,
          gid: interaction.guildId,
        });

        if (!mrn) {
          const embedMessage = new EmbedBuilder()
            .setColor(`#DB0000`)
            .setDescription(
              `Missing Role Notification not found. Please check the ID and try again.`
            );

          await interaction.followUp({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
        }

        const embedMessage = new EmbedBuilder()
          .setColor(`#11ff00`)
          .setTitle(`Missing Role Notification Removed`)
          .setDescription(
            `The Missing Role Notification named \`${mrn.name}\` for the role <@&${mrn.missing_role_to_check}> has been successfully removed.`
          );

        await interaction.followUp({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [75f193] Error while removing Missing Role Notification. Please try again later.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (interaction.options.getSubcommand() == "list") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const mrn = await MissingRoleNotification.find({ gid: interaction.guildId }).sort({
          name: 1,
        });
        if (mrn.length === 0) {
          let message = ``;

          const embedMessage = new EmbedBuilder()
            .setColor(`#DB0000`)
            .setDescription(
              `No missing role notifications found. Use \`/missing-role-notification add\` to create one.`
            );

          await interaction.followUp({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
        }

        let output = ``;

        for await (const entry of mrn) {
          if (output.length > 0) {
            output += `----------\n`;
          }

          output += `**Name:** ${entry.name}\n`;
          output += `**Missing Role to Check:** <@&${entry.missing_role_to_check}>\n`;
          output += `**Required Roles:** ${entry.required_roles.length > 0 ? entry.required_roles.map((id) => `<@&${id}>`).join(" ") : "*not set*"}\n`;
          output += `**Protected Roles:** ${entry.protected_roles.length > 0 ? entry.protected_roles.map((id) => `<@&${id}>`).join(" ") : "*not set*"}\n`;
          output += `**Notification Channel:** <#${entry.channel_to_notify}>\n`;
          output += `**Roles to Notify:** ${entry.roles_to_notify.length > 0 ? entry.roles_to_notify.map((id) => `<@&${id}>`).join(" ") : "*not set*"}\n`;

          if (output.length > 3500) {
            const embedMessage = new EmbedBuilder()
              .setColor(`#00DB19`)
              .setTitle(`Missing Role Notifications`)
              .setDescription(output);

            await interaction.followUp({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
            output = ``;
          }
        }

        if (output.length > 0) {
          const embedMessage = new EmbedBuilder()
            .setColor(`#00DB19`)
            .setTitle(`Missing Role Notifications`)
            .setDescription(output);

          await interaction.followUp({ embeds: [embedMessage], flags: MessageFlags.Ephemeral });
          output = ``;
        }
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [d849c8] Error while fetching missing role notifications. Please try again later.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (interaction.options.getSubcommand() == "manual-check") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.followUp({
          content: `> [43cb38] You do not have permission to use this command.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.followUp({ content: `Executed...`, flags: MessageFlags.Ephemeral });

      await this.checkMissingRoles(interaction.client, interaction.guildId);

      await interaction.followUp({ content: `Finished...`, flags: MessageFlags.Ephemeral });
    }
  },
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];
    if (focusedOption.name === "mrn_id") {
      try {
        const stats = await MissingRoleNotification.find({
          gid: interaction.guildId,
        }).sort({ name: 1 });

        for await (const entry of stats) {
          choices.push({
            name: `${entry.name}`,
            value: entry._id.toString(),
          });
        }
      } catch (err) {
        console.error("[35c797] ", err);
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
      setInterval(
        async () => {
          await this.checkMissingRoles(client);
        },
        1000 * 60 * 30
      );
    } catch (err) {
      console.error(`> [0a2e08] Error on autoloading channel timer.`, err);
    }
  },
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
  async fetchMembersWithRetry(guild, attempts = 2) {
    try {
      return await guild.members.fetch({ cache: true, force: true });
    } catch (err) {
      const isGatewayRateLimitError = err?.name === "GatewayRateLimitError" || err?.code === 429;
      if (isGatewayRateLimitError && attempts > 0) {
        console.warn(
          `> [ratelimit] Rate limit hit for guild ${guild.id}, retrying in 30 seconds...`,
          err
        );
        await this.delay(30_000);
        return this.fetchMembersWithRetry(guild, attempts - 1);
      }
      throw err;
    }
  },
  async checkMissingRoles(client, guildId = null) {
    try {
      const mrns = await MissingRoleNotification.find(guildId ? { gid: guildId } : {});

      if (!mrns || mrns.length === 0) {
        return;
      }

      let guildmembers = [];

      for (const mrn of mrns) {
        const guild = await client.guilds.fetch(mrn.gid);

        if (!guild) {
          console.error(
            `> [f90538] Guild not found for MissingRoleNotification with ID: ${mrn._id} on guild "${mrn.gid}" and name: ${mrn.name}.`
          );
          continue;
        }

        let allMembers = null;

        if (guildmembers[mrn.gid]) {
          allMembers = guildmembers[mrn.gid];
        } else {
          allMembers = await this.fetchMembersWithRetry(guild);
          guildmembers[mrn.gid] = allMembers;
        }

        const filteredMembers = await allMembers.filter((m) => {
          // check if member is a bot
          if (m.user.bot === true) return false;

          // check if member has any of the required roles
          if (mrn.required_roles.length > 0 && mrn.require_all_roles) {
            const hasAllRequiredRoles = mrn.required_roles.every((roleId) =>
              m.roles.cache.has(roleId)
            );
            if (!hasAllRequiredRoles) return false;
          } else if (mrn.required_roles.length > 0 && !mrn.require_all_roles) {
            const hasRequiredRoles = mrn.required_roles.some((roleId) => m.roles.cache.has(roleId));
            if (!hasRequiredRoles) return false;
          }

          // check if member has any of the protected roles
          if (mrn.protected_roles.length > 0) {
            const hasProtectedRoles = mrn.protected_roles.some((roleId) =>
              m.roles.cache.has(roleId)
            );
            if (hasProtectedRoles) return false;
          }

          // check if member has the missing role
          if (m.roles.cache.has(mrn.missing_role_to_check)) return false;

          return true;
        });

        if (filteredMembers.size > 0) {
          const channel = await guild.channels.fetch(mrn.channel_to_notify);

          if (!channel) {
            console.error(
              `> [b1d328] Channel not found for MissingRoleNotification on guild "${mrn.gid}" and name: ${mrn.name}.`
            );
            continue;
          }

          let message = `Members listed below are missing the role <@&${mrn.missing_role_to_check}>:\n`;
          let allRolesRequiredText = mrn.require_all_roles ? " (All roles are required)" : "";
          if (mrn.required_roles.length > 0) {
            message += `> *Required roles${allRolesRequiredText}:* ${mrn.required_roles.map((id) => `<@&${id}>`).join(", ")}\n`;
          }
          if (mrn.protected_roles.length > 0) {
            message += `> *Protected roles:* ${mrn.protected_roles.map((id) => `<@&${id}>`).join(", ")}\n`;
          }
          message +=
            `\n` +
            filteredMembers
              .map((m) => `<@${m.user.id}> ${getDisplayName(m)} \`${m.user.id}\``)
              .join("\n");

          const messageLimit = 3900;
          const messagePages = [];
          let currentPage = "";

          for (const line of message.split("\n")) {
            const nextPage = currentPage ? `${currentPage}\n${line}` : line;

            if (currentPage && nextPage.length > messageLimit) {
              messagePages.push(currentPage);
              currentPage = line;
            } else {
              currentPage = nextPage;
            }
          }

          if (currentPage) {
            messagePages.push(currentPage);
          }

          let mentions = "";
          if (mrn.roles_to_notify.length > 0) {
            mentions = mrn.roles_to_notify.map((roleId) => `<@&${roleId}>`).join(" ");
          }

          for (const [pageIndex, pageContent] of messagePages.entries()) {
            const embedMessage = new EmbedBuilder()
              .setColor(`#fad000`)
              .setTitle(`Missing Role Notification: ${mrn.name}`)
              .setDescription(pageContent);

            if (messagePages.length > 1) {
              embedMessage.setFooter({
                text: `Page ${pageIndex + 1} of ${messagePages.length}`,
              });
            }

            await channel.send({
              content: pageIndex === 0 ? mentions : undefined,
              embeds: [embedMessage],
            });
          }
        }
      }
    } catch (error) {
      console.error(`> [517c58] Error checking missing roles.`, error);
    }
  },
};

module.exports = {
  MissingRoleNotificationCommands,
};
