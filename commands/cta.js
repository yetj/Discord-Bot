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
const {
  CTAConfig,
  CTAMembers,
  CTAVacations,
  CTAEventTypes,
  CTAEvents,
  CTAEventGroups,
} = require("../dbmodels/cta");
const getDisplayName = require("../utils/getDisplayName");
const isValidDate = require("../utils/isValidDate");
const formattedDate = require("../utils/formattedDate");
const fs = require("fs");
const readline = require("readline");
const { Readable } = require("stream");

const CTA_Setup = {
  data: new SlashCommandBuilder()
    .setName("setup_cta")
    .setDescription("Configutre the bot.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("member_role")
        .setDescription("Set Member role")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role that every member should have")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("manager_role")
        .setDescription(
          "Set Manager role, that can manage this bot and have access to all commands"
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
        .setName("vacation_channel")
        .setDescription("Set channel for vacations reports")
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
        .setName("vacation_log_channel")
        .setDescription("Set channel for vacations log")
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
        .setName("event_role")
        .setDescription("Set event role, that can create and manage events")
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("registration_role")
        .setDescription("Set registration role, that can manage registrations")
        .addRoleOption((option) => option.setName("role").setDescription("Role").setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that role? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guild_names")
        .setDescription(
          "Set guild names that should be checked when gettings results from Battleboard"
        )
        .addStringOption((option) =>
          option.setName("guild_name").setDescription("Guild name").setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("remove_instead")
            .setDescription("Do you want to remove that guild? (default: no)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ao_server")
        .setDescription("Set which server you want to use in Albion Online")
        .addStringOption((option) =>
          option
            .setName("server")
            .setDescription("Select server")
            .addChoices(
              { name: "Europe", value: "ams" },
              { name: "Asia", value: "sgp" },
              { name: "Americas", value: "us" },
              { name: "Disable registration", value: "-" }
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("self_registration")
        .setDescription(
          "Allow users to register themselves. If disabled, only managers can register users."
        )
        .addBooleanOption((option) =>
          option
            .setName("allow_self_registration")
            .setDescription("Do you want to allow for self registration? (default: no)")
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
    let configCTA;
    let manager_perms = false;
    try {
      configCTA = await CTAConfig.findOne({
        gid: interaction.guildId,
      });

      if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        manager_perms = true;
      }

      if (!configCTA && !manager_perms) {
        return await interaction.reply(`> You don't have permissions to execute this command.`);
      }

      if (configCTA && manager_perms == false) {
        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        await configCTA.manager_roles.forEach((mgr) => {
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
        `> [1b62cd] Error while checking perms. Please try again later.`
      );
    }

    if (interaction.options.getSubcommand() === "member_role") {
      const role = interaction.options.getRole("role");

      try {
        await CTAConfig.updateOne(
          { gid: interaction.guildId },
          { member_role: role.id },
          { upsert: true, new: true }
        );

        await interaction.reply({ content: `> Member role updated.`, ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [df9c57] Error while adding member role. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "manager_role") {
      const role = interaction.options.getRole("role");
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configCTA && remove_instead) {
          return await interaction.reply(`> Manager roles is not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configCTA) {
          const newConfig = await new CTAConfig({
            gid: interaction.guildId,
            manager_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configCTA.manager_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> This role doesn't have manager perms.`);
            }

            configCTA.manager_roles = configCTA.manager_roles.filter((id) => {
              id !== role.id;
            });

            await configCTA.save();
          } else {
            action = "added";
            if (configCTA.manager_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> This role has manager perms already.`);
            }

            configCTA.manager_roles.push(role.id);
            await configCTA.save();
          }
        }

        return await interaction.reply(`> Manager role has been ${action}.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [d563b9] Error while modyfing manager role. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "vacation_log_channel") {
      const channel = interaction.options.getChannel("channel");

      try {
        await CTAConfig.updateOne(
          { gid: interaction.guildId },
          { vacation_log_channel: channel.id },
          { upsert: true, new: true }
        );

        await interaction.reply({ content: `> Vacations log channel updated.`, ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [50d13f] Error while updating vacations log channel. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "vacation_channel") {
      const channel = interaction.options.getChannel("channel");

      try {
        await CTAConfig.updateOne(
          { gid: interaction.guildId },
          { vacation_channel: channel.id },
          { upsert: true, new: true }
        );

        await interaction.reply({
          content: `> Vacations reporting channel updated.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [50d13f] Error while updating vacations reporting channel. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "event_role") {
      const role = interaction.options.getRole("role");
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configCTA && remove_instead) {
          return await interaction.reply(`> Event roles are not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configCTA) {
          const newConfig = await new CTAConfig({
            gid: interaction.guildId,
            cta_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configCTA.cta_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> This role doesn't have event perms.`);
            }

            configCTA.cta_roles = configCTA.cta_roles.filter((id) => {
              id !== role.id;
            });

            await configCTA.save();
          } else {
            action = "added";
            if (configCTA.cta_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> This role has event perms already.`);
            }

            configCTA.cta_roles.push(role.id);
            await configCTA.save();
          }
        }

        return await interaction.reply(`> Event role has been ${action}.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [6741ee] Error while modyfing event role. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "registration_role") {
      const role = interaction.options.getRole("role");
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configCTA && remove_instead) {
          return await interaction.reply(`> Event roles are not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configCTA) {
          const newConfig = await new CTAConfig({
            gid: interaction.guildId,
            registration_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configCTA.registration_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> This role doesn't have registration perms.`);
            }

            configCTA.registration_roles = configCTA.registration_roles.filter((id) => {
              id !== role.id;
            });

            await configCTA.save();
          } else {
            action = "added";
            if (configCTA.registration_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> This role has registration perms already.`);
            }

            configCTA.registration_roles.push(role.id);
            await configCTA.save();
          }
        }

        return await interaction.reply(`> Registration role has been ${action}.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [6741ee] Error while modyfing registration role. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "guild_names") {
      const guild_name = interaction.options.getString("guild_name").trim();
      const remove_instead = interaction.options.getBoolean("remove_instead") ?? false;

      try {
        if (!configCTA && remove_instead) {
          return await interaction.reply(`> Guild names are not set yet. Nothing to remove.`);
        }

        let action = "";

        if (!configCTA) {
          const newConfig = await new CTAConfig({
            gid: interaction.guildId,
            guild_names: [guild_name],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configCTA.guild_names.indexOf(guild_name) === -1) {
              return await interaction.reply(`> This guild name is not on the list.`);
            }

            configCTA.guild_names = configCTA.guild_names.filter((guild) => {
              guild !== guild_name;
            });

            await configCTA.save();
          } else {
            action = "added";
            if (configCTA.guild_names.indexOf(guild_name) !== -1) {
              return await interaction.reply(`> This guild name is already on the list.`);
            }

            configCTA.guild_names.push(guild_name);
            await configCTA.save();
          }
        }

        return await interaction.reply(`> Guild name has been ${action}.`);
      } catch (err) {
        console.error(err);
        return await interaction.reply(`> [5a321f] . Please try again later.`);
      }
    } else if (interaction.options.getSubcommand() === "ao_server") {
      const server = interaction.options.getString("server");

      try {
        await CTAConfig.updateOne(
          { gid: interaction.guildId },
          { ao_server: server },
          { upsert: true, new: true }
        );

        await interaction.reply({ content: `> AO server updated.` });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [a75105] Error while updating ao_server. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "self_registration") {
      const allow_self_registration =
        interaction.options.getBoolean("allow_self_registration") ?? false;

      try {
        await CTAConfig.updateOne(
          { gid: interaction.guildId },
          { allow_self_registration: allow_self_registration },
          { upsert: true, new: true }
        );

        await interaction.reply({
          content: `> Allow self registration has been set to: **${allow_self_registration}**.`,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [39d088] Error while updating allow_self_registration. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "show") {
      try {
        if (!configCTA) {
          return await interaction.reply({ content: `> There is no config to show.` });
        }

        let message = "";

        message += `### Member role:\n`;
        if (configCTA.member_role.length > 0) {
          message += `<@&${configCTA.member_role}> - \`${configCTA.member_role}\`\n`;
        } else {
          message += `*not set*\n`;
        }

        message += `### Manager roles:\n`;
        if (configCTA.manager_roles.length > 0) {
          configCTA.manager_roles.forEach((id) => {
            message += `<@&${id}> - \`${id}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### Vacations Reporting Channel:\n`;
        if (configCTA.vacation_channel.length > 0) {
          message += `<#${configCTA.vacation_channel}> - \`${configCTA.vacation_channel}\`\n`;
        } else {
          message += `*not set*\n`;
        }

        message += `### Vacations Log Channel:\n`;
        if (configCTA.vacation_log_channel.length > 0) {
          message += `<#${configCTA.vacation_log_channel}> - \`${configCTA.vacation_log_channel}\`\n`;
        } else {
          message += `*not set*\n`;
        }

        message += `### Event roles:\n`;
        if (configCTA.cta_roles.length > 0) {
          configCTA.cta_roles.forEach((id) => {
            message += `<@&${id}> - \`${id}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### Registration roles:\n`;
        if (configCTA.registration_roles.length > 0) {
          configCTA.registration_roles.forEach((id) => {
            message += `<@&${id}> - \`${id}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### Guild names:\n`;
        if (configCTA.guild_names.length > 0) {
          configCTA.guild_names.forEach((guild) => {
            message += `\`${guild}\`\n`;
          });
        } else {
          message += `*not set*\n`;
        }

        message += `### AO Server\n`;
        if (configCTA.ao_server.length > 0) {
          let server = "";

          if (configCTA.ao_server == "us") server = "Americas";
          else if (configCTA.ao_server == "sgp") server = "Asia";
          else if (configCTA.ao_server == "ams") server = "Europe";
          else if (configCTA.ao_server == "-") server = "Registration disabled";

          message += `\`${server}\`\n`;
        } else {
          message += `*not set*\n`;
        }

        message += `### Allow for self registration:\n`;
        if (configCTA.allow_self_registration) {
          message += `*true*\n`;
        } else {
          message += `*false*\n`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor("#ff99ff")
          .setTitle(`CTA Settings`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [ebfd39] Error while displaying CTA config. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "interactive") {
      const user = interaction.user;
      const channel = interaction.channel;

      const questions = [
        {
          id: "member_role",
          title: "Member Role",
          description: "It's role that every registered member will get.",
          type: "role",
          limit: 1,
        },
        {
          id: "manager_role",
          title: "Manager Roles",
          description: "Roles that will have full access to all CTA module bot.",
          type: "role",
        },
        {
          id: "vacation_channel",
          title: "Vacations Channel",
          description:
            "Channel where users will be able to use command `/vacations` to report their absence.",
          type: "channel",
          limit: 1,
        },
        {
          id: "vacation_log_channel",
          title: "Vacations Log Channel",
          description: "Channel where you will be able to see all vacations logs.",
          type: "channel",
          limit: 1,
        },
        {
          id: "event_role",
          title: "CTA Roles",
          description:
            "Roles that have access to manage CTA event. They can create/edit/update CTA events.",
          type: "role",
        },
        {
          id: "registration_role",
          title: "Registration Roles",
          description:
            "Roles that can manage registrations. Can register or unregister memebers. Usually all Recruiters should have access to this command.",
          type: "role",
        },
        {
          id: "guild_names",
          title: "Guild Name",
          description:
            "Provide your exact guild name from the game. This is required to get attendance list from battle boards. If you want to provide more than 1 guild use comma(,) to separate names.",
          type: "text",
        },
        {
          id: "ao_server",
          title: "Albion Online Server",
          description: "Select which serwer your guild is playing.",
          type: "select",
          options: [
            { label: "Europe", value: "ams" },
            { label: "Asia", value: "sgp" },
            { label: "Americas", value: "us" },
            { label: "Disable registration", value: "-" },
          ],
        },
        {
          id: "self_registration",
          title: "Self registration",
          description:
            "Does users should use command `/register` to register them by self, or only members with Registration Role should register every new member?",
          type: "select",
          options: [
            { label: "Yes, users can register command.", value: "true" },
            { label: "No, only recruiters should register every new member.", value: "false" },
          ],
        },
        {
          id: "cta_types",
          title: "CTA Types",
          description:
            "Provide your CTA types. Use comma(,) to separate types. Example: `CTA, Small Scale, Vortex/Orb, PvE`",
          type: "text",
        },
      ];

      let answers = {};
      let currentQuestion = 0;

      const cancelButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cta_cancel")
          .setLabel("Cancel configuration")
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({
        content: "> *Starting interactive CTA module setup.*",
      });

      const askQuestion = async () => {
        if (currentQuestion >= questions.length) {
          try {
            await CTAConfig.updateOne(
              { gid: interaction.guildId },
              {
                member_role: answers["member_role"][0] ?? "",
                manager_roles: answers["manager_role"] ?? [],
                vacation_channel: answers["vacation_channel"][0] ?? "",
                vacation_log_channel: answers["vacation_log_channel"][0] ?? "",
                cta_roles: answers["event_role"] ?? [],
                registration_roles: answers["registration_role"] ?? [],
                guild_names: answers["guild_names"],
                ao_server: answers["ao_server"],
                allow_self_registration: answers["self_registration"] === "true" ? true : false,
              },
              { upsert: true, new: true }
            );

            for await (const type of answers["cta_types"]) {
              const ctaType = await CTAEventTypes.findOne({
                gid: interaction.guildId,
                type: type,
              });

              if (!ctaType) {
                const newCTAType = await new CTAEventTypes({
                  gid: interaction.guildId,
                  type: type,
                });
                await newCTAType.save();
              }
            }
          } catch (err) {
            console.error(err);
            return await interaction.followUp({
              content: `> [b83573] Error while saving interactive CTA setup. Please try again later.`,
              ephemeral: true,
            });
          }

          let message = `> Configuration finished. To see the summary execute command:\n\`/setup_cta show\``;

          const embedMessage = new EmbedBuilder()
            .setColor(`#00DB19`)
            .setTitle(`Configuration finished`)
            .setDescription(message);

          await interaction.followUp({ embeds: [embedMessage] });
          return;
        }

        const question = questions[currentQuestion];

        if (question.type === "role") {
          const row = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
              .setCustomId("cta_select_role")
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
            if (i.customId == "cta_select_role" && i.user.id === user.id && i.values?.length > 0) {
              answers[question.id] = i.values;
              embedMessage.setDescription(`Selected role(s): <@&${i.values.join("> <@&")}>`);
              await i.update({
                embeds: [embedMessage],
                components: [],
              });
              currentQuestion++;
              collector.stop();
              await askQuestion();
            } else if (i.customId === "cta_cancel" && i.user.id === user.id) {
              embedMessage.setDescription("Configuration canceled.");
              embedMessage.setColor(`#DB0019`);
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        } else if (question.type === "channel") {
          const row = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId("cta_select_channel")
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
              i.customId == "cta_select_channel" &&
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
            } else if (i.customId === "cta_cancel" && i.user.id === user.id) {
              embedMessage.setColor(`#DB0019`);
              embedMessage.setDescription("Configuration canceled.");
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        } else if (question.type === "text") {
          const questionEmbed = new EmbedBuilder()
            .setColor(`#0000DB`)
            .setTitle(question.title)
            .setDescription(question.description);

          const questionMessage = await channel.send({
            embeds: [questionEmbed],
            components: [cancelButton],
          });

          const filter = (msg) => msg.author.id === user.id;
          const collector = channel.createMessageCollector({ filter, time: 120000 });

          const buttonCollector = questionMessage.createMessageComponentCollector({ time: 120000 });

          buttonCollector.on("collect", async (i) => {
            if (i.customId === "cta_cancel" && i.user.id === user.id) {
              questionEmbed.setDescription("Configuration canceled.");
              questionEmbed.setColor(`#DB0019`);
              await i.update({ embeds: [questionEmbed], components: [] });
              collector.stop();
              buttonCollector.stop();
            }
          });

          collector.on("collect", async (msg) => {
            let options = msg.content.split(",").map((option) => option.trim());
            questionEmbed.setDescription(`Provided options: ${options.join(", ")}`);
            await questionMessage.edit({ embeds: [questionEmbed], components: [] });
            try {
              await msg.delete();
            } catch (err) {
              console.error(`[CTA_SETUP-4e0d96] Can't remove message: \`${err.message}\``);
            }
            answers[question.id] = options;
            currentQuestion++;
            collector.stop();
            await askQuestion();
          });

          collector.on("end", (collected) => {
            if (collected.size === 0) {
              channel.send("> *You didn't provide any answer. Configuration canceled.*");
            }
          });
        } else if (question.type === "select") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("cta_select")
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
            if (i.customId == "cta_select" && i.user.id === user.id && i.values.length > 0) {
              const selectedOption = question.options.find((opt) => opt.value === i.values[0]);
              answers[question.id] = selectedOption.value;

              embedMessage.setDescription(`Selected option: ${selectedOption.label}`);

              await i.update({ embeds: [embedMessage], components: [] });
              currentQuestion++;
              collector.stop();
              await askQuestion();
            } else if (i.customId === "cta_cancel" && i.user.id === user.id) {
              embedMessage.setColor(`#DB0019`);
              embedMessage.setDescription("Configuration canceled.");
              await i.update({ embeds: [embedMessage], components: [] });
              collector.stop();
            }
          });
        }
      };

      await askQuestion();
    }
  },
  async autoload(client) {
    client.on("roleDelete", async (role) => {
      try {
        const result = await CTAConfig.updateMany(
          {
            gid: role.guild.id,
            $or: [
              { manager_roles: role.id },
              { cta_roles: role.id },
              { registration_roles: role.id },
              { member_role: role.id },
            ],
          },
          {
            $pull: {
              manager_roles: role.id,
              cta_roles: role.id,
              registration_roles: role.id,
            },
            $set: {
              member_role: "",
            },
          }
        );
      } catch (err) {
        console.error("[45e79c] Error while updating dabase for removed role", err);
      }
    });

    client.on("channelDelete", async (channel) => {
      try {
        const result = await CTAConfig.updateMany(
          {
            gid: channel.guild.id,
            $or: [{ vacation_channel: channel.id }, { vacation_log_channel: channel.id }],
          },
          {
            $set: {
              vacation_channel: "",
              vacation_log_channel: "",
            },
          }
        );
      } catch (err) {
        console.error("[4f2103] Error while updating dabase for removed channel", err);
      }
    });

    client.on("guildMemberRemove", async (member) => {
      // unregister player if he leaves the server
      try {
        const result = await CTAMembers.updateOne(
          { gid: member.guild.id, id: member.user.id, unregistered: false },
          {
            unregistered: true,
            unregistered_date: Date.now(),
            unregistered_reason: "[AUTO] Player left the server",
          }
        );
      } catch (err) {
        console.error("[4f2103] Error while updating dabase for removed member", err);
      }

      // end all active vacations and remove future vacations
      try {
        const now = new Date();

        const activeVacation = await CTAVacations.findOne({
          gid: member.guild.id,
          uid: member.user.id,
          start: { $lte: now },
          end: { $gte: now },
        });

        if (activeVacation) {
          const days = Math.ceil((now - activeVacation.start) / (1000 * 60 * 60 * 24));

          await CTAVacations.updateOne(
            { _id: activeVacation._id },
            {
              $set: {
                end: now,
                days: days,
                force_end: now,
                force_end_reason: "[AUTO] Player left the server",
                force_end_by: "",
              },
            }
          );
        }

        await CTAVacations.deleteMany({
          gid: member.guild.id,
          uid: member.user.id,
          start: { $gt: now },
        });
      } catch (err) {
        console.error("[db4dd5] Error while updating database for removed member.", err);
      }
    });

    client.on("guildMemberUpdate", async (oldMember, newMember) => {
      const removedRoles = oldMember.roles.cache.filter(
        (role) => !newMember.roles.cache.has(role.id)
      );

      try {
        const configCTA = await CTAConfig.findOne({
          gid: oldMember.guild.id,
        });

        if (configCTA) {
          if (configCTA.member_role.length > 0) {
            for await (const [roleId, role] of removedRoles.entries()) {
              if (role.id === configCTA.member_role) {
                await CTAMembers.updateOne(
                  { gid: oldMember.guild.id, id: oldMember.user.id, unregistered: false },
                  {
                    unregistered: true,
                    unregistered_date: Date.now(),
                    unregistered_reason: "[AUTO] Member lost member role",
                  }
                );
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [c5c53d] Error while updating guild role. Please try again later.`,
          ephemeral: true,
        });
      }
    });
  },
};

const CTA_Register = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("User registration.")
    .addStringOption((option) =>
      option.setName("game_nickname").setDescription("Nickname from the game").setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("member").setDescription("Select member you want to register")
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const configCTA = await CTAConfig.findOne({
        gid: interaction.guildId,
      });

      if (!configCTA || configCTA.ao_server.length < 1) {
        return await interaction.followUp({ content: `> Server is not set for registration.` });
      }

      if (configCTA.ao_server == "-") {
        return await interaction.followUp({ content: `> Registration is disabled.` });
      }

      if (configCTA.member_role.length < 1) {
        return await interaction.followUp({ content: `Only members can register!` });
      }

      const game_nickname = interaction.options.getString("game_nickname").trim();
      let member = interaction.options.getMember("member") ?? null;

      if (
        member &&
        (member.user.id != interaction.user.id ||
          interaction.memberPermissions.has(PermissionFlagsBits.Administrator))
      ) {
        let is_manager = false;

        if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          is_manager = true;
        }

        if (!is_manager && configCTA.manager_roles.length > 1) {
          const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
            cache: true,
            force: true,
          });

          configCTA.manager_roles.forEach((role) => {
            if (interactionUser.roles.cache.has(role)) {
              is_manager = true;
            }
          });

          if (!is_manager) {
            return await interaction.followUp({
              content: `> You can't register other users!`,
              ephemeral: true,
            });
          }
        }

        const registered = await CTAMembers.findOne({
          $and: [
            { gid: interaction.guildId },
            { $or: [{ id: member.user.id }, { game_nickname: game_nickname }] },
            { unregistered: false },
          ],
        });

        if (registered) {
          return await interaction.followUp({
            content: `> This member or this game nickname is already registered for <@${registered.id}> with nickname **${registered.game_nickname}**.`,
            ephemeral: true,
          });
        }

        const newRegistration = new CTAMembers({
          gid: interaction.guildId,
          id: member.user.id,
          name: member.user.username,
          game_nickname: game_nickname,
        });

        await newRegistration.save();

        try {
          await member.roles.add(configCTA.member_role, "[AUTO] Registration");
        } catch (err) {
          console.error("[CTA_Register] Error while adding role to the member", err);
        }

        try {
          await member.setNickname(game_nickname, "[AUTO] Registration");
        } catch (err) {
          console.error("[CTA_Register] Error while setting nickname to the member");
        }

        return await interaction.followUp({
          content: `> Member ${member} successfully registered with game nickname: \`${game_nickname}\`!`,
          ephemeral: true,
        });
      }

      if (!configCTA.allow_self_registration) {
        return await interaction.followUp({
          content: `> Self registration is disabled. Please ask Recruiter to register you.`,
          ephemeral: true,
        });
      }

      if (!member) {
        member = await interaction.guild.members.cache.get(interaction.user.id);
      }

      const registered = await CTAMembers.findOne({
        $and: [
          { gid: interaction.guildId },
          { $or: [{ id: interaction.user.id }, { game_nickname: game_nickname }] },
          { unregistered: false },
        ],
      });

      if (registered) {
        return await interaction.followUp({
          content: `> You or your game nickname is already registered for <@${registered.id}> with nickname **${registered.game_nickname}**.`,
          ephemeral: true,
        });
      }

      const newRegistration = new CTAMembers({
        gid: interaction.guildId,
        id: interaction.user.id,
        name: interaction.user.username,
        game_nickname: game_nickname,
      });

      await newRegistration.save();

      member.roles.add(configCTA.member_role);

      await interaction.followUp({
        content: `> Registration completed with game nickname: \`${game_nickname}\`!`,
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
      return await interaction.followUp({
        content: `> [b7dcae] Failed to register. Please try again later.`,
        ephemeral: true,
      });
    }
  },
};

const CTA_Registration = {
  data: new SlashCommandBuilder()
    .setName("registration")
    .setDescription("Registration management.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show")
        .setDescription("Check registration status for game nickname or member")
        .addStringOption((option) =>
          option.setName("game_nickname").setDescription("Nickname from the game")
        )
        .addUserOption((option) => option.setName("member").setDescription("Select member"))
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("membership").setDescription("Check membership status of all members.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("register_all")
        .setDescription(
          "Register all Members with in-game nickname based on their discord display name."
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update registered game nickname for member")
        .addUserOption((option) =>
          option.setName("member").setDescription("Select member").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("game_nickname").setDescription("Nickname from the game").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unregister")
        .setDescription("Unregister game nickname or member")
        .addUserOption((option) =>
          option.setName("member").setDescription("Select member").setRequired(true)
        )

        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason for unregistering.").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("game_nickname").setDescription("Nickname from the game")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("whoami").setDescription("Show my registered nickname.")
    ),
  async execute(interaction) {
    let registration_perms = false;
    let manager_perms = false;
    let configCTA;

    if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      registration_perms = true;
      manager_perms = true;
    }

    try {
      configCTA = await CTAConfig.findOne({
        gid: interaction.guildId,
      });

      if (!configCTA || configCTA.ao_server.length < 1) {
        return await interaction.reply({
          content: `> Server is not set for registration.`,
          ephemeral: true,
        });
      }

      if (configCTA.ao_server == "-") {
        return await interaction.reply({ content: `> Registration is disabled.`, ephemeral: true });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        cache: true,
        force: true,
      });

      if (!manager_perms) {
        configCTA.manager_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            manager_perms = true;
            registration_perms = true;
          }
        });
      }

      if (!registration_perms) {
        configCTA.registration_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            registration_perms = true;
          }
        });
      }
    } catch (err) {
      console.error(err);
      return await interaction.reply({
        content: `> [a96117] Error while checking perms. Please try again later.`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "show") {
      if (!registration_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      try {
        const game_nickname = interaction.options.getString("game_nickname") ?? null;
        const member = interaction.options.getMember("member") ?? null;

        let find_by = {};

        if (game_nickname && member) {
          return await interaction.reply({
            content: `> Please select just one option - game_nickname or member.`,
            ephemeral: true,
          });
        }

        if (game_nickname) {
          find_by = { game_nickname: game_nickname.trim() };
        }

        if (member) {
          find_by = { id: member.user.id };
        }

        const registered = await CTAMembers.findOne({
          $and: [{ gid: interaction.guildId }, find_by, { unregistered: false }],
        });

        if (!registered) {
          return await interaction.reply({
            content: `> Couldn't find registered members with this data.`,
            ephemeral: true,
          });
        }

        let message = ``;

        message += `Member <@${registered.id}> is registered with the nickname: \`${registered.game_nickname}\``;

        const embedMessage = new EmbedBuilder()
          .setColor(`#DB0000`)
          .setTitle(`Registration status`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [1343d3] Error while showing registration status for the player. Please try again later.`,
          ephemeral: true,
        });
      }
      //
    } else if (interaction.options.getSubcommand() === "membership") {
      if (!registration_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      try {
        const registeredMembers = await CTAMembers.find({
          $and: [{ gid: interaction.guildId }, { unregistered: false }],
        });

        if (!registeredMembers || registeredMembers.length < 1) {
          return await interaction.reply({
            content: `> Can't find any registered memebrs.`,
            ephemeral: true,
          });
        }

        let guildMembersWithMemberRole = null;

        await interaction.guild.members.fetch({ force: true }).then((members) => {
          guildMembersWithMemberRole = members.filter((member) =>
            member._roles.includes(configCTA.member_role)
          );
        });

        let guildMembersWithMemberRoleMap = guildMembersWithMemberRole.map((m) => m.id);
        let registeredMembersMap = registeredMembers.map((m) => m.id);

        let membersWithoutMemberRole = [];
        let membersNotRegistered = [];

        // checking registered members without a role
        for await (const member of registeredMembers) {
          if (guildMembersWithMemberRoleMap.indexOf(member.id) === -1) {
            membersWithoutMemberRole.push(member.id);
          }
        }

        // checking members without registration
        for await (const [index, member] of guildMembersWithMemberRole) {
          if (registeredMembersMap.indexOf(member.user.id) === -1) {
            membersNotRegistered.push(member.user.id);
          }
        }

        let message = ``;

        message += `### Members without role <@&${configCTA.member_role}>:\n`;
        if (membersWithoutMemberRole.length > 0) {
          for await (const member of membersWithoutMemberRole) {
            message += `> <@${member}> - *${member}*\n`;
          }
        } else {
          message += `> *All registered members have member role.*\n`;
        }

        message += `\n### Not registered members:\n`;
        if (membersNotRegistered.length > 0) {
          for await (const member of membersNotRegistered) {
            message += `> <@${member}> - *${member}*\n`;
          }
        } else {
          message += `> *All members with member role are registered.*`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor(`#0000DB`)
          .setTitle(`Members membership`)
          .setDescription(message);

        await interaction.reply({ ephemeral: true, embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [c49648] Error while checking membership. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "register_all") {
      if (!manager_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      try {
        const registeredMembers = await CTAMembers.find({
          $and: [{ gid: interaction.guildId }, { unregistered: false }],
        });

        let guildMembersWithMemberRole = null;

        await interaction.guild.members.fetch({ force: true }).then((members) => {
          guildMembersWithMemberRole = members.filter((member) =>
            member._roles.includes(configCTA.member_role)
          );
        });

        let registeredMembersMap = registeredMembers.map((m) => m.id);
        let membersNotRegistered = [];

        for await (const [index, member] of guildMembersWithMemberRole) {
          if (registeredMembersMap.indexOf(member.user.id) === -1) {
            membersNotRegistered.push(member.user.id);
          }
        }

        let messageRegistered = ``;
        let messageNotRegistered = ``;
        let newlyRegistered = 0;
        let notRegistered = [];
        let embedsRegistered = [];
        let embedsNotRegistered = [];
        let pageRegistered = 1;
        let pageNotRegistered = 1;

        if (membersNotRegistered.length > 0) {
          messageRegistered += `### Newly registered memebrs:\n`;
          for await (const member of membersNotRegistered) {
            await interaction.guild.members.fetch(member).then(async (m) => {
              const registered = await CTAMembers.findOne({
                $and: [
                  { gid: interaction.guildId },
                  { game_nickname: getDisplayName(m) },
                  { unregistered: false },
                ],
              });

              if (registered) {
                notRegistered.push(m);
              } else {
                if (!/^[A-Za-z0-9]+$/.test(getDisplayName(m))) {
                  notRegistered.push(m);
                } else {
                  const newRegistration = new CTAMembers({
                    gid: interaction.guildId,
                    id: m.user.id,
                    name: m.user.username,
                    game_nickname: getDisplayName(m),
                  });

                  await newRegistration.save();
                  newlyRegistered++;

                  messageRegistered += `> ${m} - *${getDisplayName(m)}*\n`;
                }
              }

              if (messageRegistered.length > 3900) {
                const embedMessage = new EmbedBuilder()
                  .setColor(`#0000aa`)
                  .setTitle(`Register all members`)
                  .setDescription(messageRegistered)
                  .setFooter({ text: `Page: ${pageRegistered}` });

                embedsRegistered.push(embedMessage);
                messageRegistered = ``;
                pageRegistered++;
              }
            });
          }
          if (newlyRegistered == 0) {
            messageRegistered += `> *Didn't find any member to register.*`;
          }

          if (notRegistered.length > 0) {
            messageNotRegistered += `### Not registered\n*Members not registered due to their displayname was already registered as a game nickname or displayname contained not allowed characters.*\n`;
            for await (const member of notRegistered) {
              messageNotRegistered += `> ${member} - \`${getDisplayName(member)}\`\n`;

              if (messageNotRegistered.length > 3900) {
                const embedMessage = new EmbedBuilder()
                  .setColor(`#aa0000`)
                  .setTitle(`Not registered members`)
                  .setDescription(messageNotRegistered)
                  .setFooter({ text: `Page: ${pageNotRegistered}` });

                embedsNotRegistered.push(embedMessage);
                messageNotRegistered = ``;
                pageNotRegistered++;
              }
            }

            if (messageNotRegistered.length > 0) {
              const embedMessage = new EmbedBuilder()
                .setColor(`#aa0000`)
                .setDescription(messageNotRegistered);

              if (pageNotRegistered !== 1) {
                embedMessage.setFooter({ text: `Page: ${pageNotRegistered}` });
              }

              embedsNotRegistered.push(embedMessage);
            }
          }
        } else {
          messageRegistered += `> All members are already registered!`;
        }

        if (messageRegistered.length > 0) {
          const embedMessage = new EmbedBuilder()
            .setColor(`#0000aa`)
            .setTitle(`Register all members`)
            .setDescription(messageRegistered);

          if (pageRegistered !== 1) {
            embedMessage.setFooter({ text: `Page: ${pageRegistered}` });
          }

          embedsRegistered.push(embedMessage);
        }

        await interaction.followUp({ embeds: [...embedsRegistered, ...embedsNotRegistered] });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [31b13e] Error while registering all members. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "update") {
      if (!registration_perms) {
        return await interaction.followUp({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      try {
        const member = interaction.options.getMember("member") ?? null;
        const game_nickname = interaction.options.getString("game_nickname") ?? null;

        if (!member) {
          return await interaction.reply({
            content: `> Please select member to update.`,
            ephemeral: true,
          });
        }

        if (!game_nickname || game_nickname.length < 3) {
          return await interaction.reply({
            content: `> Please provide game nickname to update.`,
            ephemeral: true,
          });
        }

        const registeredGameNickname = await CTAMembers.findOne({
          $and: [
            { gid: interaction.guildId },
            { game_nickname: game_nickname.trim() },
            { unregistered: false },
          ],
        });

        if (registeredGameNickname) {
          return await interaction.reply({
            content: `> Game nickname \`${game_nickname}\` is already registered for <@${registeredGameNickname.id}>.`,
            ephemeral: true,
          });
        }

        const registered = await CTAMembers.findOne({
          $and: [{ gid: interaction.guildId }, { id: member.user.id }, { unregistered: false }],
        });

        if (!registered) {
          return await interaction.reply({
            content: `> ${member} is not registered.`,
            ephemeral: true,
          });
        }

        registered.game_nickname = game_nickname.trim();
        await registered.save();

        try {
          await member.setNickname(game_nickname, "[AUTO] Registration update");
        } catch (err) {
          console.error(`> [CTA-d022de] Bot doesn't have permission to change nickname.`);
        }

        await interaction.reply({
          content: `> Updated ${member}'s game nickname to: \`${game_nickname}\``,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [dea384] Error while updating registration. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "unregister") {
      if (!registration_perms) {
        return await interaction.followUp({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      try {
        const member = interaction.options.getMember("member") ?? null;
        const reason = interaction.options.getString("reason").trim() ?? null;
        const game_nickname = interaction.options.getString("game_nickname") ?? null;

        let find_by = {};

        if (!member) {
          return await interaction.reply({
            content: `> Please select member to unregister.`,
            ephemeral: true,
          });
        }

        if (!reason) {
          return await interaction.reply({
            content: `> Please provide reason for unregistering.`,
            ephemeral: true,
          });
        }

        if (game_nickname && member) {
          return await interaction.reply({
            content: `> Please select just one option - game_nickname or member.`,
            ephemeral: true,
          });
        }

        if (game_nickname) {
          find_by = { game_nickname: game_nickname.trim() };
        }

        if (member) {
          find_by = { id: member.user.id };
        }

        const registered = await CTAMembers.findOne({
          $and: [{ gid: interaction.guildId }, find_by, { unregistered: false }],
        });

        if (!registered) {
          return await interaction.reply({
            content: `> Couldn't find any registered members with this data.`,
            ephemeral: true,
          });
        }

        registered.unregistered = true;
        registered.unregistered_reason = reason;
        registered.unregistered_date = new Date();

        await registered.save();

        const rolesToRemove = await member.roles.cache.filter(
          (role) =>
            role.managed == false &&
            role.id != interaction.guild.id &&
            role.id != member.roles.premiumSubscriberRole &&
            interaction.guild.members.me.roles.highest.position > role.position
        );

        const rolesToRemoveMap = rolesToRemove.map((role) => role.id);

        let rolesToRemoveString = rolesToRemove.map((role) => `${role.name}`).join("`, `");

        if (rolesToRemoveString.length > 5) {
          rolesToRemoveString = `\n> Removed roles: \`${rolesToRemoveString}\``;
        }

        try {
          await member.roles.remove(rolesToRemoveMap);
        } catch (err) {
          console.error("[CTA_Unergister] Unable to remove roles.", err);
        }

        await interaction.reply({
          content: `> Member <@${registered.id}> successfully unregistered game nickname \`${registered.game_nickname}\` with reason: \`${reason}\`${rolesToRemoveString}`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [4d0797] Error while unregistering. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "whoami") {
      try {
        const registered = await CTAMembers.findOne({
          $and: [
            { gid: interaction.guildId },
            { id: interaction.user.id },
            { unregistered: false },
          ],
        });

        let message = ``;

        if (registered) {
          message += `**Registered user:**\n> <@${registered.id}> - \`${registered.id}\`\n`;
          message += `**Registered game nickname:**\n> \`${registered.game_nickname}\`\n`;
          message += `**Registration date:**\n> \`${registered.registered}\``;
        } else {
          message += `### You are not registered!\n`;
          message += `> Use command \`/register\` to register your game nickname.`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor(`#00DB00`)
          .setTitle(`Who am I?`)
          .setDescription(message);

        await interaction.reply({ ephemeral: true, embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [5d7aca] Error while checking who am I. Please try again later.`,
          ephemeral: true,
        });
      }
    }
  },
};

const CTA_Vacations = {
  data: new SlashCommandBuilder()
    .setName("vacations")
    .setDescription("Configutre the bot.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add vacation.")
        .addStringOption((option) =>
          option
            .setName("start_date")
            .setDescription("Start date (date format: YYYY-MM-DD)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("end_date")
            .setDescription("End date (date format: YYYY-MM-DD)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason for vacations").setRequired(true)
        )
        .addUserOption((option) =>
          option.setName("member").setDescription("Select member you want to add Vacation")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove Vacations by ID.")
        .addNumberOption((option) =>
          option
            .setName("vacations_id")
            .setDescription("Vacations ID to be removed")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stop")
        .setDescription("Stop active vacations.")
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for finishing vacations")
            .setRequired(true)
        )
        .addUserOption((option) =>
          option.setName("member").setDescription("Select member you want to stop Vacations")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show")
        .setDescription("Show vacations details.")
        .addNumberOption((option) =>
          option.setName("vacations_id").setDescription("Show specific vacations details")
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Show vacations by type")
            .addChoices(
              { name: "All", value: "all" },
              { name: "Past", value: "past" },
              { name: "Upcoming", value: "upcoming" },
              { name: "Active", value: "active" },
              { name: "Active & Upcoming", value: "active_upcoming" }
            )
        )
        .addUserOption((option) =>
          option.setName("member").setDescription("Select member you want to check vacations")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show_all")
        .setDescription("Show vacations details.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Show vacations by type (default: Active & Upcoming)")
            .addChoices(
              { name: "All", value: "all" },
              { name: "Past", value: "past" },
              { name: "Upcoming", value: "upcoming" },
              { name: "Active", value: "active" },
              { name: "Active & Upcoming", value: "active_upcoming" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update vacation.")
        .addNumberOption((option) =>
          option
            .setName("vacations_id")
            .setDescription("Vacations ID to be updated")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("start_date").setDescription("Start date (date format: YYYY-MM-DD)")
        )
        .addStringOption((option) =>
          option.setName("end_date").setDescription("End date (date format: YYYY-MM-DD)")
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason for vacations")
        )
    ),
  async execute(interaction) {
    let registration_perms = false;
    let manager_perms = false;
    let configCTA;

    if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      registration_perms = true;
      manager_perms = true;
    }

    try {
      configCTA = await CTAConfig.findOne({
        gid: interaction.guildId,
      });

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        cache: true,
        force: true,
      });

      if (!manager_perms) {
        configCTA.manager_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            manager_perms = true;
            registration_perms = true;
          }
        });
      }

      if (!registration_perms) {
        configCTA.registration_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            registration_perms = true;
          }
        });
      }
    } catch (err) {
      console.error(err);
      return await interaction.reply({
        content: `> [e6cf0e] Error while checking perms. Please try again later.`,
        ephemeral: true,
      });
    }

    if (configCTA.vacation_channel.length < 1) {
      return await interaction.reply({
        content: `> Vacations reporting channel is not set yet. Please contact with server manager.`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "add") {
      const start_date = interaction.options.getString("start_date");
      const end_date = interaction.options.getString("end_date");
      const reason = interaction.options.getString("reason");
      let member = interaction.options.getMember("member") ?? null;

      if (configCTA.vacation_channel !== interaction.channelId) {
        return await interaction.reply({
          content: `> This command is available only in <#${configCTA.vacation_channel}> channel.`,
          ephemeral: true,
        });
      }

      if (member && !registration_perms && member.user.id !== interaction.user.id) {
        return await interaction.reply({
          content: `> No permission to use this command. You can add vacations only to yourself.`,
          ephemeral: true,
        });
      }

      if (!member) {
        member = await interaction.guild.members.fetch(interaction.user.id, {
          force: true,
        });
      }

      if ((start_date && !isValidDate(start_date)) || (end_date && !isValidDate(end_date))) {
        return await interaction.reply({
          content: `> Date format is incorrect. Please use: \`YYYY-MM-DD\``,
          ephemeral: true,
        });
      }

      if (new Date(start_date) > new Date(end_date)) {
        return await interaction.reply({
          content: `> Start date can't be later than end date.`,
          ephemeral: true,
        });
      }

      if (reason.length < 5) {
        return await interaction.reply({
          content: `> Reason is too short. Please provide more information.`,
          ephemeral: true,
        });
      }

      const start = new Date(start_date + "T00:00:00Z");
      const end = new Date(end_date + "T23:59:59Z");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        return await interaction.reply({
          content: `> You can't report vacations in the past.`,
          ephemeral: true,
        });
      }

      const differenceInMs = end - start;
      const days = Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) + 1;
      if (days == 1) {
        return await interaction.reply({
          content: `> You don't need to report 1 day vacations.`,
          ephemeral: true,
        });
      }

      try {
        const registeredMember = await CTAMembers.findOne({
          $and: [
            { gid: interaction.guildId },
            { unregistered: false },
            { id: member ? member.user.id : interaction.user.id },
          ],
        });

        if (!registeredMember) {
          return await interaction.reply({
            content: `> You need to register first before adding vacations.`,
            ephemeral: true,
          });
        }

        const overlappingVacations = await CTAVacations.findOne({
          gid: interaction.guildId,
          uid: member ? member.user.id : interaction.user.id,
          $or: [
            { start: { $lte: end }, end: { $gte: start } }, // Nowy urlop zaczyna się w trakcie istniejącego
            { start: { $gte: start, $lte: end } }, // Istniejący urlop zaczyna się w trakcie nowego
            { end: { $gte: start, $lte: end } }, // Istniejący urlop kończy się w trakcie nowego
          ],
        });

        if (overlappingVacations) {
          let messageOverlaping = ``;

          messageOverlaping = `### You already have vacations in this period!\n\n`;

          messageOverlaping += `**ID:**\n> ${overlappingVacations.vacations_id}\n`;
          messageOverlaping += `**Start date:**\n> ${formattedDate(
            overlappingVacations.start,
            "date_utc"
          )}\n`;
          messageOverlaping += `**End date:**\n> ${formattedDate(
            overlappingVacations.end,
            "date_utc"
          )}\n`;
          messageOverlaping += `**Days:**\n> ${overlappingVacations.days}\n`;
          messageOverlaping += `**Reason:**\n> *${overlappingVacations.reason}*\n`;

          messageOverlaping += `\n**You can't have overlapping vacations!**\n`;
          messageOverlaping += `*Use command \`/vacations update\` to update your existing vacations or add vacations in another period of time.*`;

          const embedMessage = new EmbedBuilder()
            .setColor(`#DB0000`)
            .setTitle(`‼️ Overlaping vacations`)
            .setDescription(messageOverlaping);

          return await interaction.reply({ embeds: [embedMessage], ephemeral: true });
        }

        const newVacations = await new CTAVacations({
          gid: interaction.guildId,
          uid: member ? member.user.id : interaction.user.id,
          start: start,
          end: end,
          days: days,
          reason: reason,
          added_by: interaction.user.id,
        });

        await newVacations.save();

        const totalDays = await CTAVacations.aggregate([
          {
            $match: {
              uid: member ? member.user.id : interaction.user.id,
              gid: interaction.guildId,
            },
          },
          { $group: { _id: null, totalDays: { $sum: "$days" } } },
          { $project: { _id: 0, totalDays: { $ifNull: ["$totalDays", 0] } } },
        ]).then((result) => result[0]?.totalDays || 0);

        let message = ``;

        message += `### Vacations added for <@${newVacations.uid}> - ${getDisplayName(member)}\n`;
        message += `**ID:**\n> ${newVacations.vacations_id}\n`;
        message += `**Start date:**\n> ${formattedDate(newVacations.start, "date_utc")}\n`;
        message += `**End date:**\n> ${formattedDate(newVacations.end, "date_utc")}\n`;
        message += `**Days:**\n> ${newVacations.days}\n`;
        message += `**Total days:**\n> ${totalDays}\n`;
        message += `**Reason:**\n> *${newVacations.reason}*\n`;

        if (newVacations.uid !== newVacations.added_by) {
          message += `\n**Added by:**\n> <@${newVacations.added_by}>\n`;
        }

        const embedMessage = new EmbedBuilder().setColor(`#00ff00`).setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });

        if (configCTA.vacation_log_channel.length > 0) {
          const channel = await interaction.guild.channels.cache.get(
            configCTA.vacation_log_channel
          );
          if (channel) {
            let messageLog = ``;

            messageLog += `**User:** <@${newVacations.uid}> - ${getDisplayName(member)}\n`;
            messageLog += `**ID:** ${newVacations.vacations_id}\n`;
            messageLog += `**Start date:** ${formattedDate(newVacations.start, "date_utc")}\n`;
            messageLog += `**End date:** ${formattedDate(newVacations.end, "date_utc")}\n`;
            messageLog += `**Days:** ${newVacations.days}\n`;
            messageLog += `**Total days:** ${totalDays}\n`;
            messageLog += `**Reason:** *${newVacations.reason}*\n`;

            if (newVacations.uid !== newVacations.added_by) {
              messageLog += `\n**Added by:** <@${newVacations.added_by}>\n`;
            }

            const registrationDifferenceInMs = new Date() - registeredMember.registered;
            const registeredDays =
              Math.floor(registrationDifferenceInMs / (1000 * 60 * 60 * 24)) + 1;

            if (registeredDays > 14) {
              messageLog += `**Registered:** ${registeredDays} day(s) ago\n`;
            } else {
              messageLog += `‼️ **Registered:** ‼️ **${registeredDays}** day(s) ago ‼️`;
            }

            const embedMessageLog = new EmbedBuilder()
              .setColor(`#00ff00`)
              .setTitle(`New vacations added`)
              .setDescription(messageLog);

            await channel.send({ embeds: [embedMessageLog] });
          }
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [532dc2] Error while adding new vacation. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "remove") {
      if (!manager_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const vacations_id = interaction.options.getNumber("vacations_id");

      try {
        const vacations = await CTAVacations.findOne({
          $and: [{ gid: interaction.guildId }, { vacations_id: vacations_id }],
        });

        if (!vacations) {
          return await interaction.reply({
            content: `> Couldn't find vacations with this ID.`,
            ephemeral: true,
          });
        }

        await CTAVacations.deleteOne({ gid: interaction.guildId, vacations_id: vacations_id });

        await interaction.reply({
          content: `> Vacations with ID: \`${vacations_id}\` successfully removed.`,
          ephemeral: true,
        });

        if (configCTA.vacation_log_channel.length > 0) {
          const channel = await interaction.guild.channels.cache.get(
            configCTA.vacation_log_channel
          );
          if (channel) {
            let messageLog = ``;

            const member = await interaction.guild.members.fetch(vacations.uid, {
              force: true,
            });

            messageLog += `**User:** <@${vacations.uid}> - ${getDisplayName(member)}\n`;
            messageLog += `**ID:** ${vacations.vacations_id}\n`;
            messageLog += `**Start date:** ${formattedDate(vacations.start, "date_utc")}\n`;
            messageLog += `**End date:** ${formattedDate(vacations.end, "date_utc")}\n`;
            messageLog += `**Days:** ${vacations.days}\n`;
            messageLog += `**Reason:** *${vacations.reason}*\n`;

            if (vacations.uid !== vacations.added_by) {
              messageLog += `\n**Added by:** <@${vacations.added_by}>\n`;
            }

            const embedMessageLog = new EmbedBuilder()
              .setColor(`#ff0000`)
              .setTitle(`Vacations removed`)
              .setDescription(messageLog);

            await channel.send({ embeds: [embedMessageLog] });
          }
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [a941a6] Error while removing vacations. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "stop") {
      if (configCTA.vacation_channel !== interaction.channelId) {
        return await interaction.reply({
          content: `> This command is available only in <#${configCTA.vacation_channel}> channel.`,
          ephemeral: true,
        });
      }

      const reason = interaction.options.getString("reason");
      let member = interaction.options.getMember("member") ?? null;

      if (member && !registration_perms && member.user.id !== interaction.user.id) {
        return await interaction.reply({
          content: `> No permission to use this command. You can stop only your vacations.`,
          ephemeral: true,
        });
      }

      if (reason.length < 5) {
        return await interaction.reply({
          content: `> Reason is too short. Please provide more information.`,
          ephemeral: true,
        });
      }

      if (!member) {
        member = await interaction.guild.members.fetch(interaction.user.id, {
          force: true,
        });
      }

      try {
        const now = new Date();

        const activeVacation = await CTAVacations.findOne({
          uid: member.user.id,
          gid: interaction.guildId,
          start: { $lte: now },
          end: { $gte: now },
        });

        if (!activeVacation) {
          return await interaction.reply({
            content: `> Couldn't find active vacations.`,
            ephemeral: true,
          });
        }

        const nowDate = new Date();

        activeVacation.end = nowDate;
        activeVacation.force_end = nowDate;
        activeVacation.force_end_reason = reason;
        activeVacation.force_end_by = interaction.user.id;
        activeVacation.days =
          Math.floor((nowDate - activeVacation.start) / (1000 * 60 * 60 * 24)) + 1;

        await activeVacation.save();

        let message = ``;

        message += `### Vacations stopped for <@${newVacations.uid}> - ${getDisplayName(member)}\n`;
        message += `**ID:**\n> ${newVacations.vacations_id}\n`;
        message += `**Start date:**\n> ${formattedDate(newVacations.start, "date_utc")}\n`;
        message += `**End date:**\n> ${formattedDate(newVacations.end, "date_utc")}\n`;
        message += `**Days:**\n> ${newVacations.days}\n`;
        message += `**Total days:**\n> ${totalDays}\n`;
        message += `**Reason:**\n> *${newVacations.reason}*\n`;

        if (newVacations.uid !== newVacations.added_by) {
          message += `\n**Added by:**\n> <@${newVacations.added_by}>\n`;
        }

        message += `\n**Force stopped by:**\n> <@${activeVacation.force_end_by}>\n`;
        message += `**Force stop reason:**\n> *${activeVacation.force_end_reason}*\n`;

        const embedMessage = new EmbedBuilder()
          .setColor(`#DB0000`)
          .setTitle(`Vacations stopped`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });

        if (configCTA.vacation_log_channel.length > 0) {
          const channel = await interaction.guild.channels.cache.get(
            configCTA.vacation_log_channel
          );
          if (channel) {
            let messageLog = ``;

            messageLog += `**User:** <@${activeVacation.uid}> - ${getDisplayName(member)}\n`;
            messageLog += `**ID:** ${activeVacation.vacations_id}\n`;
            messageLog += `**Start date:** ${formattedDate(activeVacation.start, "date_utc")}\n`;
            messageLog += `**End date:** ${formattedDate(activeVacation.end, "date_utc")}\n`;
            messageLog += `**Days:** ${activeVacation.days}\n`;
            messageLog += `**Reason:** *${activeVacation.reason}*\n`;

            if (activeVacation.uid !== activeVacation.added_by) {
              messageLog += `\n**Added by:** <@${activeVacation.added_by}>\n`;
            }

            messageLog += `\n**Force stopped by:**\n> <@${activeVacation.force_end_by}>\n`;
            messageLog += `**Force stop reason:**\n> *${activeVacation.force_end_reason}*\n`;

            const embedMessageLog = new EmbedBuilder()
              .setColor(`#ff0000`)
              .setTitle(`Vacations stopped`)
              .setDescription(messageLog);

            await channel.send({ embeds: [embedMessageLog] });
          }
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [a39c45] Error while stoping active vacations. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "show") {
      const vacations_id = interaction.options.getNumber("vacations_id") ?? null;
      const type = interaction.options.getString("type") ?? null;
      let member = interaction.options.getMember("member") ?? null;

      if (member && !registration_perms && member.user.id !== interaction.user.id) {
        return await interaction.reply({
          content: `> No permission to use this command. You can only see your vacations.`,
          ephemeral: true,
        });
      }

      if (vacations_id !== null && type !== null) {
        return await interaction.reply({
          content: `> You can't use \`vacations_id\` with \`type\` option. Please use only one option.`,
          ephemeral: true,
        });
      }

      if (vacations_id !== null && member !== null) {
        return await interaction.reply({
          content: `> You can't use \`vacations_id\` with \`member\` option. Please use only one option.`,
          ephemeral: true,
        });
      }

      let filter = {};

      try {
        if (type !== null) {
          let today = new Date();
          switch (type) {
            case "all":
              filter = {};
              break;
            case "past":
              filter.end = { $lte: today };
              break;
            case "upcoming":
              filter.start = { $gte: today };
              break;
            case "active":
              filter.start = { $lte: today };
              filter.end = { $gte: today };
              break;
            case "active_upcoming":
              filter.$or = [
                { start: { $lte: today }, end: { $gte: today } },
                { start: { $gte: today } },
              ];
              break;
            default:
              return await interaction.reply({
                content: `> Wrong type selected.`,
                ephemeral: true,
              });
              break;
          }
        }

        if (vacations_id !== null) {
          filter.vacations_id = vacations_id;
        } else {
          if (!member) {
            member = await interaction.guild.members.fetch(interaction.user.id, {
              force: true,
            });
          }
          filter.uid = member.user.id;
        }

        const vacations = await CTAVacations.find({
          gid: interaction.guildId,
          ...filter,
        }).sort({ start: -1 });

        if (vacations.length < 1) {
          return await interaction.reply({
            content: `> No vacations found.`,
            ephemeral: true,
          });
        }

        if (!member) {
          member = await interaction.guild.members.fetch(vacations[0].uid, {
            force: true,
          });
        }

        let message = "";

        message = `### Vacations logs for <@${member.user.id}> - ${getDisplayName(member)}\n`;

        for await (const vacation of vacations) {
          message += `**#${vacation.vacations_id}** `;
          message += `\`${formattedDate(vacation.start, "date_utc")}\` -> `;
          message += `\`${formattedDate(vacation.end, "date_utc")}\``;
          message += `\n> *${vacation.reason}*\n`;
        }

        const embedMessage = new EmbedBuilder().setColor(`#00DB19`).setDescription(message);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [a02bdd] Error while showing vacations. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "show_all") {
      if (!registration_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const type = interaction.options.getString("type") ?? "active_upcoming";

      let dateFilter = {};

      let today = new Date();
      let typeName = "";
      switch (type) {
        case "all":
          typeName = "All";
          dateFilter = {};
          break;
        case "past":
          typeName = "Past";
          dateFilter.end = { $lte: today };
          break;
        case "upcoming":
          typeName = "Upcoming";
          dateFilter.start = { $gte: today };
          break;
        case "active":
          typeName = "Active";
          dateFilter.start = { $lte: today };
          dateFilter.end = { $gte: today };
          break;
        case "active_upcoming":
          typeName = "Active & Upcoming";
          dateFilter.$or = [
            { start: { $lte: today }, end: { $gte: today } },
            { start: { $gte: today } },
          ];
          break;
        default:
          return await interaction.reply({
            content: `> Wrong type selected.`,
            ephemeral: true,
          });
          break;
      }

      try {
        const vacations = await CTAVacations.find({
          gid: interaction.guildId,
          ...dateFilter,
        }).sort({ start: -1 });

        if (vacations.length < 1) {
          return await interaction.reply({
            content: `> No vacations found.`,
            ephemeral: true,
          });
        }

        let message = "";

        message = `### Vacations logs - *${typeName}*\n`;

        for await (const vacation of vacations) {
          const member = await interaction.guild.members.fetch(vacation.uid, {
            force: true,
          });

          message += `* **#${vacation.vacations_id}** | `;
          message += `\`${formattedDate(vacation.start, "date_utc")}\` -> `;
          message += `\`${formattedDate(vacation.end, "date_utc")}\` | `;
          message += `${vacation.days} | `;
          if (member) {
            message += `<@${vacation.uid}> - ${getDisplayName(member)}`;
          } else {
            message += `<@${vacation.uid}> - \`#${vacation.uid}\``;
          }
          message += `\n> *${vacation.reason}*\n`;
        }

        const embedMessage = new EmbedBuilder().setColor(`#00DB19`).setDescription(message);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [7eb253] Error while showing all vacations. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "update") {
      if (configCTA.vacation_channel !== interaction.channelId) {
        return await interaction.reply({
          content: `> This command is available only in <#${configCTA.vacation_channel}> channel.`,
          ephemeral: true,
        });
      }

      const vacations_id = interaction.options.getNumber("vacations_id");
      const start_date = interaction.options.getString("start_date") ?? null;
      const end_date = interaction.options.getString("end_date") ?? null;
      const reason = interaction.options.getString("reason") ?? null;

      if (!start_date && !end_date && !reason) {
        return await interaction.reply({
          content: `> Please provide at least one option to update.`,
          ephemeral: true,
        });
      }

      if ((start_date && !isValidDate(start_date)) || (end_date && !isValidDate(end_date))) {
        return await interaction.reply({
          content: `> Date format is incorrect. Please use: \`YYYY-MM-DD\``,
          ephemeral: true,
        });
      }

      if (reason && reason.length < 5) {
        return await interaction.reply({
          content: `> Reason is too short. Please provide more information.`,
          ephemeral: true,
        });
      }

      try {
        const vacations = await CTAVacations.findOne({
          $and: [{ gid: interaction.guildId }, { vacations_id: vacations_id }],
        });

        if (!vacations) {
          return await interaction.reply({
            content: `> Couldn't find vacations with this ID.`,
            ephemeral: true,
          });
        }

        if (vacations.uid !== interaction.user.id && !manager_perms) {
          return await interaction.reply({
            content: `> You can update only your vacations.`,
            ephemeral: true,
          });
        }

        const registeredMember = await CTAMembers.findOne({
          $and: [{ gid: interaction.guildId }, { unregistered: false }, { id: vacations.uid }],
        });

        if (!registeredMember) {
          return await interaction.reply({
            content: `> Vacations of not registered members can't be updated.`,
            ephemeral: true,
          });
        }

        const today = new Date();

        if (vacations.start <= today && vacations.end >= today) {
          return await interaction.reply({
            content: `> You can't update active vacations. If you want to finish your vacations use command \`/vacations stop\`.`,
            ephemeral: true,
          });
        }

        let start;
        if (start_date) {
          start = new Date(start_date + "T00:00:00Z");
        } else {
          start = vacations.start;
        }

        let end;
        if (end_date) {
          end = new Date(end_date + "T23:59:59Z");
        } else {
          end = vacations.end;
        }

        today.setHours(0, 0, 0, 0);

        if (start < today) {
          return await interaction.reply({
            content: `> You can't report vacations in the past.`,
            ephemeral: true,
          });
        }

        if (start > end) {
          return await interaction.reply({
            content: `> Start date can't be later than end date.`,
            ephemeral: true,
          });
        }

        const differenceInMs = end - start;
        const days = Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) + 1;
        if (days == 1) {
          return await interaction.reply({
            content: `> You don't need to report 1 day vacations.`,
            ephemeral: true,
          });
        }

        if (start == vacations.start && end == vacations.end && reason == vacations.reason) {
          return await interaction.reply({
            content: `> Nothing to update.`,
            ephemeral: true,
          });
        }

        const member = await interaction.guild.members.fetch(vacations.uid, {
          force: true,
        });

        let message = `### Vacations updated for <@${vacations.uid}> - ${getDisplayName(member)}\n`;
        message += `**ID:**\n> ${vacations.vacations_id}\n`;

        if (
          start_date &&
          formattedDate(vacations.start, "date_utc") !== formattedDate(start, "date_utc")
        ) {
          message += `**Start date:**\n> ${formattedDate(
            vacations.start,
            "date_utc"
          )} -> ${formattedDate(start, "date_utc")}\n`;
          vacations.start = start;
        } else {
          message += `**Start date:**\n> ${formattedDate(vacations.start, "date_utc")}\n`;
        }

        if (
          end_date &&
          formattedDate(vacations.end, "date_utc") !== formattedDate(end, "date_utc")
        ) {
          message += `**End date:**\n> ${formattedDate(
            vacations.end,
            "date_utc"
          )} -> ${formattedDate(end, "date_utc")}\n`;
          vacations.end = end;
        } else {
          message += `**End date:**\n> ${formattedDate(vacations.end, "date_utc")}\n`;
        }

        if (days !== vacations.days) {
          message += `**Days:**\n> ${vacations.days} -> ${days}\n`;
          vacations.days = days;
        } else {
          message += `**Days:**\n> ${vacations.days}\n`;
        }

        if (reason && reason !== vacations.reason) {
          message += `**Reason:**\n> *${vacations.reason}* -> *${reason}*\n`;
          vacations.reason = reason;
        } else {
          message += `**Reason:**\n> *${vacations.reason}*\n`;
        }

        await vacations.save();

        const embedMessage = new EmbedBuilder().setColor(`#DBDB00`).setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });

        if (configCTA.vacation_log_channel.length > 0) {
          const channel = await interaction.guild.channels.cache.get(
            configCTA.vacation_log_channel
          );
          if (channel) {
            let messageLog = ``;

            messageLog += `**User:** <@${vacations.uid}> - ${getDisplayName(member)}\n`;
            messageLog += `**Vacation ID:** ${vacations.vacations_id}\n`;

            if (start_date) {
              messageLog += `**Start date:** ${formattedDate(
                vacations.start,
                "date_utc"
              )} -> ${formattedDate(start, "date_utc")}\n`;
            }

            if (end_date) {
              messageLog += `**End date:** ${formattedDate(
                vacations.end,
                "date_utc"
              )} -> ${formattedDate(end, "date_utc")}\n`;
            }

            if (days !== vacations.days) {
              messageLog += `**Days:** ${vacations.days} -> ${days}\n`;
            }

            if (reason) {
              messageLog += `**Reason:** *${vacations.reason}* -> *${reason}*\n`;
            }

            const embedMessageLog = new EmbedBuilder()
              .setColor(`#DBDB00`)
              .setTitle(`Vacations updated`)
              .setDescription(messageLog);

            await channel.send({ embeds: [embedMessageLog] });
          }
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [28f4a7] Error while updating vacations. Please try again later.`,
          ephemeral: true,
        });
      }
    }
  },
};

const CTA_Event = {
  data: new SlashCommandBuilder()
    .setName("cta")
    .setDescription("Event management commands.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Creates new CTA event.")
        .addStringOption((option) =>
          option.setName("name").setDescription("Event name").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("cta_type")
            .setDescription("Event type")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option.setName("mandatory").setDescription("Is event mandatory? (default: no)")
        )
        .addNumberOption((option) =>
          option.setName("weight").setDescription("Event weight (default: 1)")
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .addChannelTypes(ChannelType.GuildVoice)
            .setDescription("Voice channel")
        )
        .addStringOption((option) =>
          option
            .setName("channels")
            .setDescription("Multiple Voice channel IDs (separated by comma)")
        )
        .addStringOption((option) =>
          option.setName("battle_ids").setDescription("Battle IDs from API (separated by comma)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove CTA event.")
        .addStringOption((option) =>
          option
            .setName("cta_id")
            .setDescription("Event ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update attendance of existing CTA event.")
        .addStringOption((option) =>
          option
            .setName("cta_id")
            .setDescription("Event ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("Action")
            .addChoices(
              { name: "Add", value: "add" },
              { name: "Remove", value: "remove" },
              { name: "Skip", value: "skip" }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("members").setDescription("Multiple Members mentions (separated by space)")
        )
        .addStringOption((option) =>
          option
            .setName("game_nicknames")
            .setDescription("Multiple Game Nicknames (separated by comma)")
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .addChannelTypes(ChannelType.GuildVoice)
            .setDescription("Voice channel")
        )
        .addStringOption((option) =>
          option
            .setName("channels")
            .setDescription("Multiple Voice channel IDs (separated by comma)")
        )
        .addStringOption((option) =>
          option.setName("battle_ids").setDescription("Battle IDs from API (separated by comma)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update_online")
        .setDescription("Update existing CTA event for online status.")
        .addStringOption((option) =>
          option
            .setName("cta_id")
            .setDescription("Event ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edit settings of existing CTA event.")
        .addStringOption((option) =>
          option
            .setName("cta_id")
            .setDescription("Event ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) => option.setName("name").setDescription("Event name"))
        .addStringOption((option) =>
          option.setName("cta_type").setDescription("Event type").setAutocomplete(true)
        )
        .addBooleanOption((option) =>
          option.setName("mandatory").setDescription("Is event mandatory? (default: no)")
        )
        .addNumberOption((option) =>
          option.setName("weight").setDescription("Event weight (default: 1)")
        )
        .addStringOption((option) =>
          option.setName("date").setDescription("Event date (date format: YYYY-MM-DD HH:MM)")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show")
        .setDescription("Show detailed CTA event.")
        .addStringOption((option) =>
          option
            .setName("cta_id")
            .setDescription("Event ID")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("check")
        .setDescription("Check your or other member CTA attendance.")
        .addStringOption((option) =>
          option.setName("start_date").setDescription("Start date (date format: YYYY-MM-DD)")
        )
        .addStringOption((option) =>
          option.setName("end_date").setDescription("End date (date format: YYYY-MM-DD)")
        )
        .addUserOption((option) =>
          option.setName("member").setDescription("Select member you want to check")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("type")
        .setDescription("Manage CTA Types.")
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("Action")
            .addChoices(
              { name: "Add", value: "add" },
              { name: "Remove", value: "remove" },
              { name: "List current types", value: "list" }
            )
            .setRequired(true)
        )
        .addStringOption((option) => option.setName("name").setDescription("Event type name"))
    ),
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];
    if (focusedOption.name === "cta_id") {
      try {
        const events = await CTAEvents.find({
          gid: interaction.guildId,
        }).sort({ cta_id: -1 });

        await events.forEach((event) => {
          choices.push({
            name: `#${event.cta_id} ${event.name} (${formattedDate(event.created)})`,
            value: event._id.toString(),
          });
        });
      } catch (err) {
        console.error("[061e8d] ", err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      const limitedResults = filtered.slice(0, 10);
      await interaction.respond(
        limitedResults.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }

    choices = [];
    if (focusedOption.name === "cta_type") {
      try {
        const types = await CTAEventTypes.find({
          gid: interaction.guildId,
        }).sort({ type: 1 });

        await types.forEach((type) => {
          choices.push({
            name: type.type,
            value: type.type,
          });
        });
      } catch (err) {
        console.error("[6f226f] ", err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      const limitedResults = filtered.slice(0, 10);
      await interaction.respond(
        limitedResults.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }
  },
  async execute(interaction) {
    let cta_perms = false;
    let manager_perms = false;
    let configCTA;

    if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      cta_perms = true;
      manager_perms = true;
    }

    try {
      configCTA = await CTAConfig.findOne({
        gid: interaction.guildId,
      });

      if (!configCTA || configCTA.ao_server.length < 1) {
        return await interaction.reply({
          content: `> Server is not set for events.`,
          ephemeral: true,
        });
      }

      if (configCTA.ao_server == "-") {
        return await interaction.reply({ content: `> Events are disabled.`, ephemeral: true });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        cache: true,
        force: true,
      });

      if (!manager_perms) {
        configCTA.manager_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            manager_perms = true;
            cta_perms = true;
          }
        });
      }

      if (!cta_perms) {
        configCTA.cta_roles.forEach((role) => {
          if (interactionUser.roles.cache.has(role)) {
            cta_perms = true;
          }
        });
      }
    } catch (err) {
      console.error(err);
      return await interaction.reply({
        content: `> [63c7d8] Error while checking perms. Please try again later.`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "add") {
      if (!cta_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const name = interaction.options.getString("name").trim();
      const cta_type = interaction.options.getString("cta_type");
      const mandatory = interaction.options.getBoolean("mandatory") ?? null;
      const weight = interaction.options.getNumber("weight") ?? null;
      const channel = interaction.options.getChannel("channel") ?? null;
      const channels = interaction.options.getString("channels") ?? null;
      const battle_ids = interaction.options.getString("battle_ids") ?? null;

      // check if only one option is selected
      if ([channel, channels, battle_ids].filter((v) => v !== null).length !== 1) {
        return await interaction.reply({
          content: `> You can create CTA only from one option: \`channel\`, \`channels\` or \`battle_ids\`.\n> You have to select only ONE option.`,
          ephemeral: true,
        });
      }

      // check if guild names are set in case of selected battle_ids
      if (battle_ids !== null && configCTA.guild_names.length < 1) {
        return await interaction.reply({
          content: `> You have to set Guild Names first.`,
          ephemeral: true,
        });
      }

      try {
        // check if CTA type exists
        const availableTypes = await CTAEventTypes.find({
          gid: interaction.guildId,
        });

        if (availableTypes.map((t) => t.type).indexOf(cta_type) === -1) {
          return await interaction.reply({
            content: `> Couldn't find CTA type: \`${cta_type}\``,
            ephemeral: true,
          });
        }

        // get all registered members
        const registeredMembers = await CTAMembers.find({
          $and: [{ gid: interaction.guildId }, { unregistered: false }],
        });

        if (!registeredMembers || registeredMembers.length < 1) {
          return await interaction.reply({
            content: `> Can't find any registered memebrs.`,
            ephemeral: true,
          });
        }

        let present = [];
        let absent = [];
        let not_registered = [];
        let not_registered_names = [];

        let availableMembers = [];
        if (channel !== null) {
          const channelData = await this.getChannelMembers({
            interaction,
            configCTA,
            channel_ids: channel.id,
          });

          if (channelData.errors.length > 0) {
            return await interaction.reply({
              content: `${channelData.errors.join("\n")}`,
              ephemeral: true,
            });
          }

          availableMembers = channelData.availableMembers;
        }

        if (channels !== null) {
          const channelData = await this.getChannelMembers({
            interaction,
            configCTA,
            channel_ids: channels,
          });

          if (channelData.errors.length > 0) {
            return await interaction.reply({
              content: `${channelData.errors.join("\n")}`,
              ephemeral: true,
            });
          }

          availableMembers = channelData.availableMembers;
        }

        if (battle_ids !== null) {
          const battleData = await this.getBattleMembers({
            configCTA,
            registeredMembers,
            battle_ids,
          });

          if (battleData.errors.length > 0) {
            return await interaction.reply({
              content: `${battleData.errors.join("\n")}`,
              ephemeral: true,
            });
          }

          availableMembers = battleData.availableMembers;
          not_registered_names = battleData.not_registered_names;
        }

        if (availableMembers.length < 1) {
          return await interaction.reply({
            content: `> Not found any members to be added for the CTA event.`,
            ephemeral: true,
          });
        }

        const availabilityData = await this.checkAvailability({
          registeredMembers,
          availableMembers,
        });

        present = availabilityData.present;
        absent = availabilityData.absent;
        not_registered = availabilityData.not_registered;

        const newCTA = await new CTAEvents({
          gid: interaction.guildId,
          name: name,
          type: cta_type,
          creator_id: interaction.user.id,
          mandatory: mandatory !== null ? mandatory : false,
          weight: weight !== null ? weight : 1,
          present: present,
          absent: absent,
          not_registered: not_registered,
          not_registered_names: not_registered_names,
        });

        await newCTA.save();

        let embeds = [];
        let message = ``;

        message += `**Event name:**\n> ${name}\n`;
        message += `**Event type:**\n> ${cta_type}\n`;
        message += `**Mandatory:**\n> ${mandatory === true ? "Yes" : "No"}\n`;
        if (weight !== null) {
          message += `**Weight:**\n> ${weight !== null ? weight : 1}\n`;
        }
        message += `**Present members:**\n> ${present.length}\n`;
        message += `**Absent members:**\n> ${absent.length}\n`;
        if (not_registered.length + not_registered_names.length > 0) {
          message += `**Not registered members:**\n> ${
            not_registered.length + not_registered_names.length
          }\n`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor(`#00ff00`)
          .setTitle(`Created new CTA Event with ID: ${newCTA.cta_id}`)
          .setDescription(message);

        embeds.push(embedMessage);

        let messageNotRegistered = ``;
        let embedMessageNotRegistered = null;

        if (not_registered_names.length > 0) {
          messageNotRegistered += `> ` + not_registered_names.map((m) => `${m}`).join(", ");
        }

        if (not_registered.length > 0) {
          if (messageNotRegistered.length > 0) {
            messageNotRegistered += `\n`;
          }
          messageNotRegistered += `> ` + not_registered.map((m) => `<@${m}>`).join(" ");
        }

        if (messageNotRegistered.length > 0) {
          embedMessageNotRegistered = new EmbedBuilder()
            .setColor(`#ff0000`)
            .setTitle(`Not registered members`)
            .setDescription(messageNotRegistered);

          embeds.push(embedMessageNotRegistered);
        }

        await interaction.reply({
          ephemeral: true,
          embeds: embeds,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [17a4e8] Error while creating new CTA. Please try again later.`,
          ephemeral: true,
        });
      }

      //
    } else if (interaction.options.getSubcommand() === "remove") {
      if (!manager_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const cta_id = interaction.options.getString("cta_id").trim();

      try {
        const removedCTA = await CTAEvents.findOneAndDelete({
          $and: [{ gid: interaction.guildId }, { cta_id: cta_id }],
        });

        if (!removedCTA) {
          return await interaction.reply({
            content: `> Couldn't find CTA event with ID: \`${cta_id}\``,
            ephemeral: true,
          });
        }

        await interaction.reply({
          content: `> CTA event with ID: \`${cta_id}\` has been removed.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [9ca88b] Error while removing CTA. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "update") {
      if (!cta_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const cta_id = interaction.options.getString("cta_id").trim();
      const action = interaction.options.getString("action");
      const members = interaction.options.getString("members") ?? null;
      const game_nicknames = interaction.options.getString("game_nicknames") ?? null;
      const channel = interaction.options.getChannel("channel") ?? null;
      const channels = interaction.options.getString("channels") ?? null;
      const battle_ids = interaction.options.getString("battle_ids") ?? null;

      if (
        [members, game_nicknames, channel, channels, battle_ids].filter((v) => v !== null)
          .length !== 1
      ) {
        return await interaction.reply({
          content: `> You can update CTA with only one option: \`members\`, \`game_nicknames\`, \`channel\`, \`channels\` or \`battle_ids\`.`,
          ephemeral: true,
        });
      }

      if (battle_ids !== null && configCTA.guild_names.length < 1) {
        return await interaction.reply({
          content: `> You have to set Guild Names first.`,
          ephemeral: true,
        });
      }

      if (
        (action === "remove" || action === "skip") &&
        [channel, channels, battle_ids].filter((v) => v !== null).length > 0
      ) {
        return await interaction.reply({
          content: `> Option to **remove** someone from CTA Event is available only with \`members\` or \`game_nicknames\` option.`,
          ephemeral: true,
        });
      }

      try {
        // get all registered members
        const registeredMembers = await CTAMembers.find({
          $and: [{ gid: interaction.guildId }, { unregistered: false }],
        });

        if (!registeredMembers || registeredMembers.length < 1) {
          return await interaction.reply({
            content: `> Can't find any registered memebrs.`,
            ephemeral: true,
          });
        }

        let availableMembers = [];
        let not_registered_names = [];
        let updates = [];

        if (members !== null) {
          availableMembers = await this.extractUniqueMembers(members);
        }

        if (game_nicknames !== null) {
          let game_nicknames_array = game_nicknames.split(",");

          for await (const nickname of game_nicknames_array) {
            const member = registeredMembers.find((m) => m.game_nickname === nickname.trim());
            if (member) {
              availableMembers.push(member.id);
            } else {
              not_registered_names.push(nickname.trim());
            }
          }
        }

        if (channel !== null) {
          const channelData = await this.getChannelMembers({
            interaction,
            configCTA,
            channel_ids: channel.id,
          });

          if (channelData.errors.length > 0) {
            return await interaction.reply({
              content: `${channelData.errors.join("\n")}`,
              ephemeral: true,
            });
          }

          availableMembers = channelData.availableMembers;
        }

        if (channels !== null) {
          const channelData = await this.getChannelMembers({
            interaction,
            configCTA,
            channel_ids: channels,
          });

          if (channelData.errors.length > 0) {
            return await interaction.reply({
              content: `${channelData.errors.join("\n")}`,
              ephemeral: true,
            });
          }

          availableMembers = channelData.availableMembers;
        }

        if (battle_ids !== null) {
          const battleData = await this.getBattleMembers({
            configCTA,
            registeredMembers,
            battle_ids,
          });

          if (battleData.errors.length > 0) {
            return await interaction.reply({
              content: `${battleData.errors.join("\n")}`,
              ephemeral: true,
            });
          }

          availableMembers = battleData.availableMembers;
          not_registered_names = battleData.not_registered_names;
        }

        const cta = await CTAEvents.findOne({
          $and: [{ gid: interaction.guildId }, { _id: cta_id }],
        });

        if (!cta) {
          return await interaction.reply({
            content: `> Couldn't find CTA event with ID: \`${cta_id}\``,
            ephemeral: true,
          });
        }

        if (action === "add") {
          const availabilityData = await this.checkAvailability({
            registeredMembers,
            availableMembers,
          });

          for await (const member of availabilityData.present) {
            let changed = false;
            if (cta.present.indexOf(member) === -1) {
              cta.present.push(member);
              updates.push(`> <@${member}> added to present.`);
              changed = true;

              const memberName = registeredMembers.find((m) => m.id === member);

              if (memberName && cta.not_registered_names.indexOf(memberName.game_nickname) !== -1) {
                cta.not_registered_names.splice(
                  cta.not_registered_names.indexOf(memberName.game_nickname),
                  1
                );

                updates.push(
                  `> \`${memberName.game_nickname}\` removed from not registered names.`
                );
              }
            }
            if (cta.absent.indexOf(member) !== -1 && changed === true) {
              cta.absent.splice(cta.absent.indexOf(member), 1);
              updates.push(`> <@${member}> removed from absent.`);
            }
            if (cta.not_registered.indexOf(member) !== -1 && changed === true) {
              cta.not_registered.splice(cta.not_registered.indexOf(member), 1);
              updates.push(`> <@${member}> removed from not registered.`);
            }
            if (cta.skip.indexOf(member) !== -1 && changed === true) {
              cta.skip.splice(cta.skip.indexOf(member), 1);
              updates.push(`> <@${member}> removed from skip list.`);
            }
          }

          for await (const member of availabilityData.not_registered) {
            if (cta.not_registered.indexOf(member) === -1) {
              cta.not_registered.push(member);
              updates.push(`> <@${member}> added to not registered.`);
            }

            cta.not_registered = [
              ...new Set([...cta.not_registered, ...availabilityData.not_registered]),
            ];
          }
          if (not_registered_names) {
            for await (const member of not_registered_names) {
              if (cta.not_registered_names.indexOf(member) === -1) {
                cta.not_registered_names.push(member);
                updates.push(`> \`${member}\` added to not registered names.`);
              }
            }
            cta.not_registered_names = [
              ...new Set([...cta.not_registered_names, ...not_registered_names]),
            ];
          }

          await cta.save();
        } else if (action === "remove") {
          const availabilityData = await this.checkAvailability({
            registeredMembers,
            availableMembers,
          });

          for await (const member of availabilityData.present) {
            let changed = false;
            if (cta.absent.indexOf(member) === -1) {
              cta.absent.push(member);
              updates.push(`> <@${member}> added to absent.`);
              changed = true;

              const memberName = registeredMembers.find((m) => m.id === member);
              if (memberName && cta.not_registered_names.indexOf(memberName.game_nickname) !== -1) {
                cta.not_registered_names.splice(
                  cta.not_registered_names.indexOf(memberName.game_nickname),
                  1
                );

                updates.push(
                  `> \`${memberName.game_nickname}\` removed from not registered names.`
                );
              }
            }
            if (cta.present.indexOf(member) !== -1 && changed === true) {
              cta.present.splice(cta.present.indexOf(member), 1);
              updates.push(`> <@${member}> removed from present.`);
            }
            if (cta.not_registered.indexOf(member) !== -1 && changed === true) {
              cta.not_registered.splice(cta.not_registered.indexOf(member), 1);
              updates.push(`> <@${member}> removed from not registered.`);
            }
          }

          if (not_registered_names.length > 0) {
            for await (const member of not_registered_names) {
              if (cta.not_registered_names.indexOf(member) !== -1) {
                cta.not_registered_names.splice(cta.not_registered_names.indexOf(member), 1);
                updates.push(`> \`${member}\` removed from not registered names.`);
              }
            }
          }
          await cta.save();
        } else if (action === "skip") {
          const availabilityData = await this.checkAvailability({
            registeredMembers,
            availableMembers,
          });

          for await (const member of availabilityData.present) {
            let changed = false;
            if (cta.skip.indexOf(member) === -1) {
              cta.skip.push(member);
              updates.push(`> <@${member}> added to skip list.`);
              changed = true;

              const memberName = registeredMembers.find((m) => m.id === member);
              if (memberName && cta.not_registered_names.indexOf(memberName.game_nickname) !== -1) {
                cta.not_registered_names.splice(
                  cta.not_registered_names.indexOf(memberName.game_nickname),
                  1
                );

                updates.push(
                  `> \`${memberName.game_nickname}\` removed from not registered names.`
                );
              }
            }
            if (cta.present.indexOf(member) !== -1 && changed === true) {
              cta.present.splice(cta.present.indexOf(member), 1);
              updates.push(`> <@${member}> removed from present.`);
            }
            if (cta.absent.indexOf(member) !== -1 && changed === true) {
              cta.absent.splice(cta.absent.indexOf(member), 1);
              updates.push(`> <@${member}> removed from absent.`);
            }
            if (cta.not_registered.indexOf(member) !== -1 && changed === true) {
              cta.not_registered.splice(cta.not_registered.indexOf(member), 1);
              updates.push(`> <@${member}> removed from not registered.`);
            }
          }

          if (not_registered_names.length > 0) {
            for await (const member of not_registered_names) {
              if (cta.not_registered_names.indexOf(member) !== -1) {
                cta.not_registered_names.splice(cta.not_registered_names.indexOf(member), 1);
                updates.push(`> \`${member}\` removed from not registered names.`);
              }
            }
          }
          await cta.save();
        }

        let message = ``;

        message += `**Present members:**\n> ${cta.present.length}\n`;
        message += `**Absent members:**\n> ${cta.absent.length}\n`;
        if (cta.skip.length > 0) {
          message += `**Skipping members:**\n> ${cta.skip.length}\n`;
        }
        message += `**Not registered members:**\n> ${
          cta.not_registered.length + cta.not_registered_names.length
        }\n`;

        let embeds = [];

        const embedMessage = new EmbedBuilder()
          .setColor(`#00ff00`)
          .setTitle(`Updated CTA event with ID: \`${cta.cta_id}\``)
          .setDescription(message);

        embeds.push(embedMessage);

        if (updates.length > 0) {
          let messageUpdate = ``;

          messageUpdate += `${updates.join("\n")}`;

          const embedMessageUpdates = new EmbedBuilder()
            .setColor(`#0000c6`)
            .setTitle(`Updates`)
            .setDescription(messageUpdate);

          embeds.push(embedMessageUpdates);
        }

        await interaction.reply({ embeds: embeds, ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [284375] Error while updating CTA event. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "update_online") {
      await interaction.deferReply({ ephemeral: true });

      if (!cta_perms) {
        return await interaction.followUp({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const cta_id = interaction.options.getString("cta_id").trim();

      try {
        await interaction.followUp({
          content: "> Post an online list in the message and send it.",
          ephemeral: true,
        });

        const filter = (m) => m.author.id === interaction.user.id;
        const collector = await interaction.channel.createMessageCollector({ filter, time: 60000 });

        let parsedData = [];
        let updates = [];

        await collector.on("collect", async (collectedMessage) => {
          if (collectedMessage.attachments.size > 0) {
            const attachment = collectedMessage.attachments.first();

            try {
              const response = await fetch(attachment.url);
              const buffer = Buffer.from(await response.arrayBuffer());

              parsedData = await this.parseFile(buffer);
            } catch (err) {
              console.error(err);
              return await interaction.followUp({
                content: `> [4f7d96] Error while processing online list. Please try again later.`,
                ephemeral: true,
              });
            }
          } else {
            parsedData = await this.parseText(collectedMessage.content);
          }
          try {
            collectedMessage.delete();
          } catch (err) {
            console.error(`> [33b8f3] (/cta update_online) No permissions to remove messages.`);
          }
          collector.stop();

          if (parsedData.length < 1) {
            return await interaction.followUp({
              content: `> No data provided or provided in wrong format. Please try again.`,
              ephemeral: true,
            });
          }

          const cta = await CTAEvents.findOne({
            $and: [{ gid: interaction.guildId }, { _id: cta_id }],
          });

          if (!cta) {
            return await interaction.followUp({
              content: `> Couldn't find CTA event with ID: \`${cta_id}\``,
              ephemeral: true,
            });
          }

          const registeredMembers = await CTAMembers.find({
            $and: [{ gid: interaction.guildId }, { unregistered: false }],
          });

          if (!registeredMembers || registeredMembers.length < 1) {
            return await interaction.followUp({
              content: `> Can't find any registered memebrs.`,
              ephemeral: true,
            });
          }

          let onlineList = [];
          let newNotRegisteredNames = [];

          for await (const member of parsedData) {
            const registeredMember = registeredMembers.find(
              (m) => m.game_nickname === member.characterName
            );

            if (registeredMember) {
              if (member.lastSeen == "Online") {
                onlineList.push(registeredMember.id);

                if (cta.absent.indexOf(registeredMember.id) !== -1) {
                  if (cta.skip.indexOf(registeredMember.id) === -1) {
                    cta.skip.push(registeredMember.id);
                    updates.push(`> <@${registeredMember.id}> added to skip list.`);
                  }
                }
              }
            } else {
              if (cta.not_registered_names.indexOf(member.characterName) === -1) {
                cta.not_registered_names.push(member.characterName);
                newNotRegisteredNames.push(member.characterName);
              }
            }
          }

          cta.online = onlineList;

          await cta.save();

          let message = ``;

          message += `**Present members:**\n> ${cta.present.length}\n`;
          message += `**Absent members:**\n> ${cta.absent.length}\n`;
          message += `**Skipping members:**\n> ${cta.skip.length}\n`;
          message += `**Not registered members:**\n> ${
            cta.not_registered.length + cta.not_registered_names.length
          }\n`;

          let embeds = [];

          const embedMessage = new EmbedBuilder()
            .setColor(`#00ff00`)
            .setTitle(`Updated CTA event with ID: \`${cta.cta_id}\``)
            .setDescription(message);

          embeds.push(embedMessage);

          if (updates.length > 0) {
            let messageUpdate = ``;

            messageUpdate += `${updates.join("\n")}`;

            const embedMessageUpdates = new EmbedBuilder()
              .setColor(`#0000c6`)
              .setTitle(`Updates`)
              .setDescription(messageUpdate);

            embeds.push(embedMessageUpdates);
          }

          if (newNotRegisteredNames.length > 0) {
            let messageNotRegistered = ``;

            messageNotRegistered += `> ` + newNotRegisteredNames.map((m) => `${m}`).join(", ");

            const embedMessageNotRegistered = new EmbedBuilder()
              .setColor(`#ff0000`)
              .setTitle(`New not registered members`)
              .setDescription(messageNotRegistered);

            embeds.push(embedMessageNotRegistered);
          }

          await interaction.followUp({ embeds: embeds, ephemeral: true });
        });
      } catch (err) {
        console.error(err);
        return await interaction.followUp({
          content: `> [a7c14b] Error while updating online list. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "edit") {
      if (!cta_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const cta_id = interaction.options.getString("cta_id").trim();
      const name = interaction.options.getString("name") ?? null;
      const cta_type = interaction.options.getString("cta_type") ?? null;
      const mandatory = interaction.options.getBoolean("mandatory") ?? null;
      const weight = interaction.options.getNumber("weight") ?? null;
      const date = interaction.options.getString("date") ?? null;

      let changes = [];

      try {
        const cta = await CTAEvents.findOne({
          $and: [{ gid: interaction.guildId }, { _id: cta_id }],
        });

        if (!cta) {
          return await interaction.reply({
            content: `> Couldn't find CTA event with ID: \`${cta_id}\``,
            ephemeral: true,
          });
        }

        if (name && name !== cta.name) {
          changes.push(`> **Name:** \`${cta.name}\` -> \`${name}\``);
          cta.name = name;
        }

        if (cta_type && cta_type !== cta.type) {
          const availableTypes = await CTAEventTypes.find({
            gid: interaction.guildId,
          });

          if (availableTypes.map((t) => t.type).indexOf(cta_type) === -1) {
            return await interaction.reply({
              content: `> Couldn't find CTA type: \`${cta_type}\``,
              ephemeral: true,
            });
          }

          changes.push(`> **Type:** \`${cta.type}\` -> \`${cta_type}\``);
          cta.type = cta_type;
        }

        if (mandatory !== null && mandatory !== cta.mandatory) {
          changes.push(`> **Mandatory:** \`${cta.mandatory}\` -> \`${mandatory}\``);
          cta.mandatory = mandatory;
        }

        if (weight !== null && weight !== cta.weight) {
          if (weight < 1) {
            return await interaction.reply({
              content: `> Weight has to be greater than 0.`,
              ephemeral: true,
            });
          }
          changes.push(`> **Weight:** \`${cta.weight}\` -> \`${weight}\``);
          cta.weight = weight;
        }

        if (date) {
          const dateRegex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
          const match = date.match(dateRegex);

          if (!match) {
            return await interaction.reply({
              content: `> Date format is incorrect (1). Please use: \`YYYY-MM-DD HH:MM\``,
              ephemeral: true,
            });
          }

          const [, year, month, day, hour, minute] = match.map(Number);

          if (
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31 ||
            hour < 0 ||
            hour > 23 ||
            minute < 0 ||
            minute > 59
          ) {
            return await interaction.reply({
              content: `> Date format is incorrect (2). Please use: \`YYYY-MM-DD HH:MM\``,
              ephemeral: true,
            });
          }

          const timestamp = new Date(year, month - 1, day, hour, minute).getTime();

          if (isNaN(timestamp)) {
            return await interaction.reply({
              content: `> Date format is incorrect (3). Please use: \`YYYY-MM-DD HH:MM\``,
              ephemeral: true,
            });
          }

          const formattedOldDate = formattedDate(cta.created);

          const formattedNewDate = formattedDate(timestamp);

          if (formattedOldDate !== formattedNewDate) {
            changes.push(`> **Date:** \`${formattedOldDate}\` -> \`${formattedNewDate}\``);

            cta.created = new Date(timestamp);
          }
        }

        let message = ``;

        if (changes.length > 0) {
          message += `${changes.join("\n")}`;
          await cta.save();
        } else {
          message += `> *No changes made.*`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor(`#00DB19`)
          .setTitle(`Updated CTA event with ID: \`${cta.cta_id}\``)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [e11a17] Error while editing CTA. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "show") {
      if (!cta_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const cta_id = interaction.options.getString("cta_id").trim();

      try {
        const cta = await CTAEvents.findOne({
          $and: [{ gid: interaction.guildId }, { _id: cta_id }],
        });

        if (!cta) {
          return await interaction.reply({
            content: `> Couldn't find CTA event with ID: \`${cta_id}\``,
            ephemeral: true,
          });
        }

        const registeredMembers = await CTAMembers.find({
          $and: [{ gid: interaction.guildId }, { unregistered: false }],
        });

        if (!registeredMembers || registeredMembers.length < 1) {
          return await interaction.reply({
            content: `> Can't find any registered memebrs.`,
            ephemeral: true,
          });
        }

        let message = ``;

        message += `**Event name:**\n> ${cta.name}\n`;
        message += `**Event type:**\n> ${cta.type}\n`;
        message += `**Mandatory:**\n> ${cta.mandatory === true ? "Yes" : "No"}\n`;
        message += `**Weight:**\n> ${cta.weight}\n`;
        message += `**Present members:**\n> ${cta.present.length}\n`;
        message += `**Absent members:**\n> ${cta.absent.length}\n`;
        if (cta.skip.length > 0) {
          message += `**Skipping members:**\n> ${cta.skip.length}\n`;
        }
        if (cta.not_registered.length + cta.not_registered_names.length > 0) {
          message += `**Not registered members:**\n> ${
            cta.not_registered.length + cta.not_registered_names.length
          }\n`;
        }

        let embeds = [];

        const embedMessage = new EmbedBuilder()
          .setColor(`#0AA2FF`)
          .setTitle(`CTA Event with ID: ${cta.cta_id}`)
          .setDescription(message);

        embeds.push(embedMessage);

        if (cta.not_registered.length + cta.not_registered_names.length) {
          let messageNotRegistered = ``;

          if (cta.not_registered_names.length > 0) {
            messageNotRegistered += `> ` + cta.not_registered_names.map((m) => `${m}`).join(", ");
          }

          if (cta.not_registered.length > 0) {
            if (messageNotRegistered.length > 0) {
              messageNotRegistered += `\n`;
            }
            messageNotRegistered += `> ` + cta.not_registered.map((m) => `<@${m}>`).join(" ");
          }

          const embedMessageNotRegistered = new EmbedBuilder()
            .setColor(`#ff0000`)
            .setTitle(`Not registered members`)
            .setDescription(messageNotRegistered);

          embeds.push(embedMessageNotRegistered);
        }

        if (cta.skip.length > 0) {
          let messageSkip = ``;

          messageSkip += `> ` + cta.skip.map((m) => `<@${m}>`).join(" ");

          const embedMessageSkip = new EmbedBuilder()
            .setColor(`#ff0000`)
            .setTitle(`Skipping members`)
            .setDescription(messageSkip);

          embeds.push(embedMessageSkip);
        }

        let messagePresentMembers = ``;
        let presentMembersArray = [];

        if (cta.present.length > 0) {
          for await (const member of cta.present) {
            const memberName = registeredMembers.find((m) => m.id === member);
            if (memberName) {
              presentMembersArray.push(memberName.game_nickname);
            } else {
              presentMembersArray.push(member);
            }
          }

          presentMembersArray.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          messagePresentMembers += `> ${presentMembersArray.join("\n> ")}`;
        } else {
          messagePresentMembers += `> *No present members.*`;
        }

        const embedMessagePresentMembers = new EmbedBuilder()
          .setColor(`#0AA2FF`)
          .setTitle(`Present members`)
          .setDescription(messagePresentMembers);

        embeds.push(embedMessagePresentMembers);

        await interaction.reply({ embeds: embeds });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [67f9b5] Error while showing CTA event details. Please try again later.`,
          ephemeral: true,
        });
      }

      //
    } else if (interaction.options.getSubcommand() === "check") {
      const start_date = interaction.options.getString("start_date") ?? null;
      const end_date = interaction.options.getString("end_date") ?? null;
      let member = interaction.options.getMember("member") ?? null;

      if (member && !cta_perms && member.user.id !== interaction.user.id) {
        return await interaction.reply({
          content: `> No permission to use this command. You can check only your attendance.`,
          ephemeral: true,
        });
      }

      if ((start_date && !isValidDate(start_date)) || (end_date && !isValidDate(end_date))) {
        return await interaction.reply({
          content: `> Date format is incorrect. Please use: \`YYYY-MM-DD\``,
          ephemeral: true,
        });
      }

      let dateFilter = {};

      if (start_date && !end_date) {
        dateFilter.created = { $gte: new Date(start_date + "T00:00:00Z") };
      }

      if (!start_date && end_date) {
        dateFilter.created = { $lte: new Date(end_date + "T23:59:59Z") };
      }

      if (start_date && end_date) {
        dateFilter.created = {
          $gte: new Date(start_date + "T00:00:00Z"),
          $lte: new Date(end_date + "T23:59:59Z"),
        };
      }

      if (!member) {
        member = await interaction.guild.members.fetch(interaction.user.id, {
          force: true,
        });
      }

      try {
        const registeredMember = await CTAMembers.findOne({
          $and: [{ gid: interaction.guildId }, { unregistered: false }, { id: member.user.id }],
        });

        if (!registeredMember) {
          return await interaction.reply({
            content: `> You are not registered.`,
            ephemeral: true,
          });
        }

        const events = await CTAEvents.find({
          gid: interaction.guildId,
          ...dateFilter,
          $or: [{ present: member.user.id }, { absent: member.user.id }],
        });

        let presentCount = 0;
        let absentCount = 0;

        for await (const event of events) {
          if (event.present.indexOf(member.user.id) !== -1) {
            presentCount++;
          } else if (event.absent.indexOf(member.user.id) !== -1) {
            absentCount++;
          }
        }

        let message = ``;

        message += `**Registration date:**\n> ${formattedDate(registeredMember.registered)}\n`;
        message += `**Total events:**\n> ${events.length}\n`;
        message += `**Present:**\n> ${presentCount}\n`;
        message += `**Absent:**\n> ${absentCount}\n`;

        if (start_date || end_date) {
          message += `**Date filter:**\n> *${start_date ? start_date : "Beginning"} - ${
            end_date ? end_date : "Now"
          }*\n`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor(`#F918FF`)
          .setTitle(`CTA stats for ${getDisplayName(member)}`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [5584e6] Error while checking CTA attendence. Please try again later.`,
          ephemeral: true,
        });
      }

      //
    } else if (interaction.options.getSubcommand() === "type") {
      if (!manager_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const action = interaction.options.getString("action");
      const name = interaction.options.getString("name") ?? null;

      if ((action === "add" || action === "remove") && !name) {
        return await interaction.reply({
          content: `> Please provide a **name** for the CTA type.`,
          ephemeral: true,
        });
      }

      try {
        if (action === "add") {
          const newType = await new CTAEventTypes({
            gid: interaction.guildId,
            type: name,
          });

          await newType.save();

          await interaction.reply({
            content: `> CTA type \`${name}\` has been added.`,
            ephemeral: true,
          });
        } else if (action === "remove") {
          const removedType = await CTAEventTypes.findOneAndDelete({
            $and: [{ gid: interaction.guildId }, { type: name }],
          });

          if (!removedType) {
            return await interaction.reply({
              content: `> Couldn't find CTA type: \`${name}\``,
              ephemeral: true,
            });
          }

          await interaction.reply({
            content: `> CTA type \`${name}\` has been removed.`,
            ephemeral: true,
          });
        } else if (action === "list") {
          const types = await CTAEventTypes.find({
            gid: interaction.guildId,
          }).sort({ type: 1 });

          let message = ``;

          if (types.length > 0) {
            message += `${types.map((t) => `> ` + t.type).join("\n")}`;
          } else {
            message += `> *No CTA types found.*`;
          }

          const embedMessage = new EmbedBuilder()
            .setColor(`#0AA2FF`)
            .setTitle(`CTA Types`)
            .setDescription(message);

          await interaction.reply({ embeds: [embedMessage], ephemeral: true });
        }
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [a90b49] Error while working on CTA types. Please try again later.`,
          ephemeral: true,
        });
      }
    }
  },
  async getBattleMembers({ configCTA, registeredMembers, battle_ids }) {
    const battle_idsArray = battle_ids.split(",");

    let availableMemberNicknames = [];
    let availableMembers = [];
    let not_registered_names = [];
    let errors = [];

    let server = "";
    if (configCTA.ao_server == "us") server = "";
    else if (configCTA.ao_server == "sgp") server = "-sgp";
    else if (configCTA.ao_server == "ams") server = "-ams";

    // fetch battle data
    for await (const battle_id of battle_idsArray) {
      const url = `https://gameinfo${server}.albiononline.com/api/gameinfo/battles/${battle_id.trim()}`;
      const response = await fetch(url);
      try {
        const data = await response.json();

        if (data.error) {
          errors.push(
            `> Error while fetching battle data for battle **${battle_id.trim()}**: ${data.error}`
          );
          continue;
        }

        // check if guild names are set in case of selected battle_ids
        for (const player of Object.values(data.players)) {
          if (player.guildName) {
            // check if player is in the guild
            if (configCTA.guild_names.indexOf(player.guildName) !== -1) {
              availableMemberNicknames.push(player.name);
            }
          }
        }
      } catch (err) {
        errors.push(
          `> Error while fetching battle data for battle **${battle_id.trim()}**: *Battle doesn't exist or API server is not responding*`
        );
        continue;
      }
    }

    for await (const member of registeredMembers) {
      // check if member is in the list of available members
      if (availableMemberNicknames.indexOf(member.game_nickname) !== -1) {
        availableMembers.push(member.id);
      }

      availableMemberNicknames = availableMemberNicknames.filter((m) => m !== member.game_nickname);
    }

    // check if there are not registered members in the list
    if (availableMemberNicknames.length > 0) {
      for await (const member of availableMemberNicknames) {
        if (not_registered_names.indexOf(member) === -1) {
          not_registered_names.push(member);
        }
      }

      not_registered_names = not_registered_names.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
    }

    return { errors, availableMembers, not_registered_names };
  },
  async getChannelMembers({ interaction, configCTA, channel_ids }) {
    let availableMembers = [];
    let errors = [];

    const channelsArray = channel_ids.split(",");

    for await (const channel of channelsArray) {
      const ch = await interaction.guild.channels.fetch(channel);

      if (!ch) {
        errors.push(`> Couldn't find channel with ID: **${channel}**`);
        continue;
      }

      if (ch.type !== ChannelType.GuildVoice) {
        errors.push(`> Channel with ID: **${channel}** is not a Voice channel.`);
        continue;
      }

      await ch.members.each((m) => {
        if (m.roles.cache.has(configCTA.member_role)) {
          availableMembers.push(m.user.id);
        }
      });
    }

    return { errors, availableMembers };
  },
  async checkAvailability({ registeredMembers, availableMembers }) {
    let present = [];
    let absent = [];
    let not_registered = [];

    // check if registered members are present in the channel
    for await (const member of registeredMembers) {
      if (availableMembers.indexOf(member.id) !== -1) {
        if (present.indexOf(member.id) === -1) {
          present.push(member.id);
        }
      } else {
        if (absent.indexOf(member.id) === -1) {
          absent.push(member.id);
        }
      }

      //remove member from the list
      availableMembers = availableMembers.filter((m) => m !== member.id);
    }

    for await (const member of availableMembers) {
      if (not_registered.indexOf(member) === -1) {
        not_registered.push(member);
      }
    }

    return { present, absent, not_registered };
  },
  async extractUniqueMembers(text) {
    const regex = /<@(\d+)>/g;

    const uniqueIDs = new Set();

    let match;
    while ((match = regex.exec(text)) !== null) {
      uniqueIDs.add(match[1]); // match[1] to ID (liczba)
    }

    return [...uniqueIDs];
  },
  async parseText(content) {
    const lines = content.split("\n").slice(1);
    return lines
      .map((line) => {
        const match = line.match(/"([^"]+)"\s+"([^"]+)"\s+"([^"]*)"/);
        if (!match) return null;

        return {
          characterName: match[1],
          lastSeen: match[2],
          roles: match[3] ? match[3].split(";") : [],
        };
      })
      .filter((entry) => entry !== null);
  },
  async parseFile(filePath) {
    let fileStream;

    if (Buffer.isBuffer(filePath)) {
      fileStream = Readable.from(filePath.toString("utf-8").split("\n"));
    } else {
      fileStream = fs.createReadStream(filePath);
    }
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let data = [];
    let firstLineSkipped = false;

    for await (const line of rl) {
      if (!firstLineSkipped) {
        firstLineSkipped = true;
        continue;
      }
      const parts = line.split("\t").map((part) => part.replace(/"/g, ""));
      data.push({
        characterName: parts[0],
        lastSeen: parts[1],
        roles: parts[2] ? parts[2].split(";") : [],
      });
    }
    return data;
  },
};

module.exports = { CTA_Setup, CTA_Register, CTA_Registration, CTA_Vacations, CTA_Event };
