const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const {
  CTAConfig,
  CTAMembers,
  CTAVacation,
  CTAEventTypes,
  CTAEvents,
  CTAEventGroups,
} = require("../dbmodels/cta");
const getDisplayName = require("../utils/getDisplayName");
const fs = require("fs");
const readline = require("readline");

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
        .setName("vacation_log_channel")
        .setDescription("Set channel for vacation log")
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

        await interaction.reply({ content: `> Vacation log channel updated.`, ephemeral: true });
      } catch (err) {
        console.error(err);
        return await interaction.reply(
          `> [50d13f] Error while updating vacation log channel. Please try again later.`
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

        message += `### Vacation Log Channel:\n`;
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
    }
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
    try {
      const configCTA = await CTAConfig.findOne({
        gid: interaction.guildId,
      });

      if (!configCTA || configCTA.ao_server.length < 1) {
        return await interaction.reply({ content: `> Server is not set for registration.` });
      }

      if (configCTA.ao_server == "-") {
        return await interaction.reply({ content: `> Registration is disabled.` });
      }

      if (configCTA.member_role.length < 1) {
        return await interaction.reply({ content: `Only members can register!` });
      }

      const game_nickname = interaction.options.getString("game_nickname").trim();
      const member = interaction.options.getUser("member") ?? null;

      if (member && member.id != interaction.user.id) {
        let is_manager = false;

        if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          is_manager = true;
        }

        if (!is_manager && configCTA.manager_roles.length > 1) {
          configCTA.manager_roles.forEach((role) => {
            if (interactionUser.roles.cache.has(role)) {
              is_manager = true;
            }
          });

          if (!is_manager) {
            return await interaction.reply({ content: `> You can't register other users!` });
          }
        }

        const registered = await CTAMembers.findOne({
          $and: [
            { gid: interaction.guildId },
            { $or: [{ id: member.id }, { game_nickname: game_nickname }] },
            { unregistered: false },
          ],
        });

        if (registered) {
          return await interaction.reply({
            content: `> This member or this game nickname is already registered for <@${registered.id}> with nickname **${registered.game_nickname}**.`,
            ephemeral: true,
          });
        }

        const newRegistration = new CTAMembers({
          gid: interaction.guildId,
          id: member.id,
          name: member.username,
          game_nickname: game_nickname,
        });

        await newRegistration.save();

        return await interaction.reply({
          content: `> Member ${member} successfully registered with game nickname: \`${game_nickname}\`!`,
          ephemeral: true,
        });
      }

      const registered = await CTAMembers.findOne({
        $and: [
          { gid: interaction.guildId },
          { $or: [{ id: interaction.user.id }, { game_nickname: game_nickname }] },
          { unregistered: false },
        ],
      });

      if (registered) {
        return await interaction.reply({
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

      await interaction.reply({
        content: `> Registration completed with game nickname: \`${game_nickname}\`!`,
      });
    } catch (err) {
      console.error(err);
      return await interaction.reply(`> [b7dcae] Failed to register. Please try again later.`);
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
        .setName("unregister")
        .setDescription("Unregister game nickname or member")
        .addStringOption((option) =>
          option.setName("reason").setDescription("Reason for unregistering.").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("game_nickname").setDescription("Nickname from the game")
        )
        .addUserOption((option) => option.setName("member").setDescription("Select member"))
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

        let message = ``;

        if (membersNotRegistered.length > 0) {
          let newlyRegistered = 0;
          let notRegistered = [];

          message += `### Newly registered memebrs:\n`;
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

                  message += `> ${m} - *${getDisplayName(m)}*\n`;
                }
              }
            });
          }
          if (newlyRegistered == 0) {
            message += `> *Didn't find any member to register.*`;
          }

          if (notRegistered.length > 0) {
            message += `### Not registered\n*Members not registered due to their displayname was already registered as a game nickname or displayname contained not allowed characters.*\n`;
            for await (const member of notRegistered) {
              message += `> ${member} - \`${getDisplayName(member)}\`\n`;
            }
          }
        } else {
          message += `> All members are already registered!`;
        }

        const embedMessage = new EmbedBuilder()
          .setColor(`#0000aa`)
          .setTitle(`Register all members`)
          .setDescription(message);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [31b13e] Error while registering all members. Please try again later.`,
          ephemeral: true,
        });
      }
    } else if (interaction.options.getSubcommand() === "unregister") {
      if (!registration_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      try {
        const reason = interaction.options.getString("reason").trim() ?? null;
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
            content: `> Couldn't find any registered members with this data.`,
            ephemeral: true,
          });
        }

        registered.unregistered = true;
        registered.unregistered_reason = reason;
        registered.unregistered_date = new Date();

        registered.save();

        await interaction.reply({
          content: `> Member <@${registered.id}> successfully unregistered game nickname \`${registered.game_nickname}\` with reason: \`${reason}\``,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content: `> [4d0797] Error while unregistering. Please try again later.`,
          ephemeral: true,
        });
      }

      //
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

const CTA_Vacation = {
  data: new SlashCommandBuilder()
    .setName("vacation")
    .setDescription("Configutre the bot.")
    .addSubcommand((subcommand) => subcommand.setName("ao").setDescription("Check servers status")),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "ao") {
      //
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
        .setDescription("Update existing CTA event.")
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
        .setDescription("Creates new CTA event.")
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
          const formattedDate = new Date(event.created).toLocaleString("pl-PL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          choices.push({
            name: `#${event.cta_id} ${event.name} (${formattedDate})`,
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
      await interaction.deferReply();

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
            const filePath = `./${attachment.name}`;

            try {
              const response = await fetch(attachment.url);
              const buffer = await response.arrayBuffer();
              fs.writeFileSync(filePath, Buffer.from(buffer));

              parsedData = await this.parseFile(filePath);

              fs.unlinkSync(filePath);
            } catch (error) {
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

          const formattedOldDate = new Date(cta.created).toLocaleString("pl-PL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          const formattedNewDate = new Date(timestamp).toLocaleString("pl-PL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

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

      if (
        (start_date && !(await this.isValidDate(start_date))) ||
        (end_date && !(await this.isValidDate(end_date)))
      ) {
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

        let formattedDate = new Date(registeredMember.registered).toLocaleString("pl-PL", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        message += `**Registration date:**\n> ${formattedDate}\n`;
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
  async isValidDate(dateString) {
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dateRegex.test(dateString)) return false;

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
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
    const fileStream = fs.createReadStream(filePath);
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

module.exports = { CTA_Setup, CTA_Register, CTA_Registration, CTA_Vacation, CTA_Event };
