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
  ButtonStyle,
} = require("discord.js");
const { EventConfig } = require("../dbmodels/events");

const Event_Setup = {
  data: new SlashCommandBuilder()
    .setName("setup_event")
    .setDescription("Configure the Event module.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("manager_roles")
        .setDescription(
          "Set Manager role, that can manage balance bot and have access to all commands"
        )
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("creator_roles")
        .setDescription("Set Creator role, that can create events and templates")
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("helper_roles")
        .setDescription("Set Helper role, that can manage signups")
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("enabled")
        .setDescription("Is balance system enabled? If not, all commands will be disabled.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable balance system (default: false)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("log_channel")
        .setDescription("Set channel for balance logs")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel")
            .addChannelTypes(
              ChannelType.GuildText,
              ChannelType.GuildForum,
              ChannelType.PrivateThread,
              ChannelType.PublicThread
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("interactive")
        .setDescription(
          "Bot will ask you for all the settings. It will overwrite the current settings if they exist."
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("show").setDescription("Show config for this server")
    ),
  async execute(interaction) {
    let configEvent;
    let manager_perms = false;
    try {
      configEvent = await EventConfig.findOne({
        gid: interaction.guildId,
      });

      if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        manager_perms = true;
      }

      if (!configEvent && !manager_perms) {
        return await interaction.reply(`> You don't have permissions to execute this command.`);
      }

      if (configEvent && manager_perms == false) {
        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        await configEvent.manager_roles.forEach((mgr) => {
          if (interactionUser.roles.cache.has(mgr.value)) {
            manager_perms = true;
          }
        });

        if (!manager_perms) {
          return await interaction.reply(`> You don't have permissions to execute this command.`);
        }
      }
    } catch (err) {
      console.error(err);
      return await interaction.reply(
        `> [1ff466] Error while checking perms. Please try again later.`
      );
    }

    if (interaction.options.getSubcommand() === "manager_roles") {
      const role = interaction.options.getRole("role");
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configEvent && remove_instead) {
          return await interaction.reply(`> Manager roles are not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configEvent) {
          const newConfig = await new EventConfig({
            gid: interaction.guildId,
            manager_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configEvent.manager_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> Role **${role.name}** doesn't have manager perms.`);
            }

            configEvent.manager_roles = configEvent.manager_roles.filter((id) => id !== role.id);

            await configEvent.save();
          } else {
            action = "added";
            if (configEvent.manager_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> Role **${role.name}** has manager perms already.`);
            }

            configEvent.manager_roles.push(role.id);
            await configEvent.save();
          }
        }

        return await interaction.reply(`> Manager Role **${role.name}** has been **${action}**.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [27c595] Error while modifying manager role. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "creator_roles") {
      const role = interaction.options.getRole("role");
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configEvent && remove_instead) {
          return await interaction.reply(`> Creator roles are not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configEvent) {
          const newConfig = await new EventConfig({
            gid: interaction.guildId,
            creator_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configEvent.creator_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> Role **${role.name}** doesn't have payout perms.`);
            }

            configEvent.creator_roles = configEvent.creator_roles.filter((id) => id !== role.id);

            await configEvent.save();
          } else {
            action = "added";
            if (configEvent.creator_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> Role **${role.name}** has creator perms already.`);
            }

            configEvent.creator_roles.push(role.id);
            await configEvent.save();
          }
        }

        return await interaction.reply(`> Creator role **${role.name}** has been **${action}**.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [fbc2b1] Error while modifying creator role. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "helper_roles") {
      const role = interaction.options.getRole("role");
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configEvent && remove_instead) {
          return await interaction.reply(`> Helper roles are not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configEvent) {
          const newConfig = await new EventConfig({
            gid: interaction.guildId,
            helper_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configEvent.helper_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> Role **${role.name}** doesn't have payout perms.`);
            }

            configEvent.helper_roles = configEvent.helper_roles.filter((id) => id !== role.id);

            await configEvent.save();
          } else {
            action = "added";
            if (configEvent.helper_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> Role **${role.name}** has helper perms already.`);
            }

            configEvent.helper_roles.push(role.id);
            await configEvent.save();
          }
        }

        return await interaction.reply(`> Helper role **${role.name}** has been **${action}**.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [c57968] Error while modifying helper role. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "enabled") {
      const enabled = interaction.options.getBoolean("enabled") ?? false;

      try {
        await EventConfig.updateOne(
          { gid: interaction.guildId },
          { enabled: enabled },
          { upsert: true, new: true }
        );

        await interaction.reply({
          content: `> Event feature has been **${enabled ? "enabled" : "disabled"}**.`,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [485d39] Error while turning on/off event feature. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "log_channel") {
      const channel = interaction.options.getChannel("channel");

      try {
        await EventConfig.updateOne(
          { gid: interaction.guildId },
          { log_channel: channel.id },
          { upsert: true, new: true }
        );

        await interaction.reply({
          content: `> Event logs channel updated to <#${channel.id}>.`,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [b709c7] Error while updating event logs channel. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "interactive") {
      const user = interaction.user;
      const channel = interaction.channel;

      const questions = [
        {
          id: "manager_roles",
          title: "Manager Roles",
          description: "Roles that will have full access to all Event module",
          type: "role",
        },
        {
          id: "creator_roles",
          title: "Creator Roles",
          description: "Roles that can create / edit / manage events and templates.",
          type: "role",
        },
        {
          id: "helper_roles",
          title: "Helper Roles",
          description: "Roles that can manage signups.",
          type: "role",
        },
        {
          id: "log_channel",
          title: "Log Channel",
          description: "Channel where you will be able to see all logs.",
          type: "channel",
          limit: 1,
        },
      ];

      let answers = {};
      let currentQuestion = 0;

      const cancelButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("event_cancel")
          .setLabel("Cancel configuration")
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({
        content: "> *Starting interactive Event module setup.*",
      });

      const askQuestion = async () => {
        if (currentQuestion >= questions.length) {
          try {
            await EventConfig.updateOne(
              { gid: interaction.guildId },
              {
                manager_roles: answers["manager_roles"] ?? [],
                creator_roles: answers["creator_roles"] ?? [],
                helper_roles: answers["helper_roles"] ?? [],
                log_channel: answers["log_channel"] ? answers["log_channel"][0] : "",
                enabled: true,
              },
              { upsert: true, new: true }
            );
          } catch (err) {
            console.error(err);
            return await interaction.followUp({
              content: `> [848aa7] Error while saving interactive Event setup. Please try again later.`,
              ephemeral: true,
            });
          }

          let message = `> Configuration finished. To see the summary execute command:\n\`/setup_event show\``;

          const embedMessage = new EmbedBuilder()
            .setColor(`#00DB19`)
            .setTitle(`Event configuration finished`)
            .setDescription(message);

          await interaction.followUp({ embeds: [embedMessage] });
          return;
        }

        const question = questions[currentQuestion];

        if (question.type === "role") {
          const row = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
              .setCustomId("event_select_role")
              .setPlaceholder(question.title)
              .setMaxValues(question.limit ?? 25)
          );

          const embedMessage = new EmbedBuilder()
            .setColor(`#0000DB`)
            .setTitle(question.title)
            .setDescription(question.description);

          const msg = await channel.send({
            embeds: [embedMessage],
            components: [row, cancelButton],
          });

          const collector = msg.createMessageComponentCollector({ time: 120000 });

          collector.on("collect", async (i) => {
            if (
              i.customId == "event_select_role" &&
              i.user.id === user.id &&
              i.values?.length > 0
            ) {
              answers[question.id] = i.values;
              embedMessage.setDescription(`Selected role(s): <@&${i.values.join("> <@&")}>`);
              await i.update({
                embeds: [embedMessage],
                components: [],
              });
              currentQuestion++;
              collector.stop();
              await askQuestion();
            } else if (i.customId === "event_cancel" && i.user.id === user.id) {
              embedMessage.setDescription("Configuration canceled.");
              embedMessage.setColor(`#DB0019`);
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        } else if (question.type === "channel") {
          const row = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId("event_select_channel")
              .setPlaceholder("Select channel")
              .setMaxValues(question.limit ?? 25)
          );

          const embedMessage = new EmbedBuilder()
            .setColor(`#0000DB`)
            .setTitle(question.title)
            .setDescription(question.description);

          const msg = await channel.send({
            embeds: [embedMessage],
            components: [row, cancelButton],
          });

          const collector = msg.createMessageComponentCollector({ time: 120000 });

          collector.on("collect", async (i) => {
            if (
              i.customId == "event_select_channel" &&
              i.user.id === user.id &&
              i.values?.length > 0
            ) {
              answers[question.id] = i.values;
              embedMessage.setDescription(`Selected channel(s): <#${i.values.join("> <#")}>`);
              await i.update({
                embeds: [embedMessage],
                components: [],
              });
              currentQuestion++;
              collector.stop();
              await askQuestion();
            } else if (i.customId === "event_cancel" && i.user.id === user.id) {
              embedMessage.setColor(`#DB0019`);
              embedMessage.setDescription("Configuration canceled.");
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        } else if (question.type === "select") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("event_select")
              .setPlaceholder(question.title)
              .addOptions(question.options)
          );

          const embedMessage = new EmbedBuilder()
            .setColor(`#0000DB`)
            .setTitle(question.title)
            .setDescription(question.description);

          const msg = await channel.send({
            embeds: [embedMessage],
            components: [row, cancelButton],
          });

          const collector = msg.createMessageComponentCollector({ time: 120000 });

          collector.on("collect", async (i) => {
            if (i.customId == "event_select" && i.user.id === user.id && i.values.length > 0) {
              const selectedOption = question.options.find((opt) => opt.value === i.values[0]);
              answers[question.id] = selectedOption.value;

              embedMessage.setDescription(`Selected option: ${selectedOption.label}`);

              await i.update({ embeds: [embedMessage], components: [] });
              currentQuestion++;
              collector.stop();
              await askQuestion();
            } else if (i.customId === "event_cancel" && i.user.id === user.id) {
              embedMessage.setColor(`#DB0019`);
              embedMessage.setDescription("Configuration canceled.");
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        }
      };

      await askQuestion();
    } else if (interaction.options.getSubcommand() === "show") {
      try {
        if (!configEvent) {
          return await interaction.reply({ content: `> There is no config to show.` });
        }

        let message = "";

        message += `### Event feature:\n`;
        if (configEvent.enabled) {
          message += `✅ *enabled*\n`;
        } else {
          message += `❌ *disabled*\n`;
        }

        message += `### Manager roles:\n`;
        if (configEvent.manager_roles.length > 0) {
          configEvent.manager_roles.forEach((id) => {
            message += `<@&${id}> - \`${id}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### Creator roles:\n`;
        if (configEvent.creator_roles.length > 0) {
          configEvent.creator_roles.forEach((id) => {
            message += `<@&${id}> - \`${id}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### Helper roles:\n`;
        if (configEvent.helper_roles.length > 0) {
          configEvent.helper_roles.forEach((id) => {
            message += `<@&${id}> - \`${id}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### Log Channel:\n`;
        if (configEvent.log_channel.length > 0) {
          message += `<#${configEvent.log_channel}> - \`${configEvent.log_channel}\`\n`;
        } else {
          message += `*not set*\n`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#ff99ff")
          .setTitle(`Event Config`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [57a0de] Error while displaying Event config. Please try again later.`
        );
      }
    }
  },
};

module.exports = { Event_Setup };
