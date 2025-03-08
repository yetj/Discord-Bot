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
        .setDescription("Creates new CTA event.")
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
            .addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" })
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("members").setDescription("Multiple Members mentions (separated by space)")
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
          option.setName("start_date").setDescription("Start date (date format: YYYY-MM-DD HH:MM)")
        )
        .addStringOption((option) =>
          option.setName("end_date").setDescription("End date (date format: YYYY-MM-DD HH:MM)")
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
            .addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" })
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
      if (!cta_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const cta_id = interaction.options.getString("cta_id").trim();
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
      const channel = interaction.options.getChannel("channel") ?? null;
      const channels = interaction.options.getString("channels") ?? null;
      const battle_ids = interaction.options.getString("battle_ids") ?? null;

      //
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

      //
    } else if (interaction.options.getSubcommand() === "show") {
      if (!cta_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }

      const cta_id = interaction.options.getString("cta_id").trim();

      //
    } else if (interaction.options.getSubcommand() === "check") {
      const start_date = interaction.options.getString("start_date") ?? null;
      const end_date = interaction.options.getString("end_date") ?? null;
      const member = interaction.options.getMember("member") ?? null;

      if (member && !cta_perms && member.user.id !== interaction.user.id) {
        return await interaction.reply({
          content: `> No permission to use this command. You can check only your attendance.`,
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

      const action = interaction.options.getString("action") ?? null;
      const name = interaction.options.getString("name") ?? null;

      //
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
};

module.exports = { CTA_Setup, CTA_Register, CTA_Registration, CTA_Vacation, CTA_Event };
