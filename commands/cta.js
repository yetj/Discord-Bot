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
            event_roles: [role.id],
          });
          await newConfig.save();
        } else {
          if (remove_instead) {
            action = "removed";
            if (configCTA.event_roles.indexOf(role.id) === -1) {
              return await interaction.reply(`> This role doesn't have event perms.`);
            }

            configCTA.event_roles = configCTA.event_roles.filter((id) => {
              id !== role.id;
            });

            await configCTA.save();
          } else {
            action = "added";
            if (configCTA.event_roles.indexOf(role.id) !== -1) {
              return await interaction.reply(`> This role has event perms already.`);
            }

            configCTA.event_roles.push(role.id);
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
        if (configCTA.event_roles.length > 0) {
          configCTA.event_roles.forEach((id) => {
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
            { $or: [{ id: member.id }, { ao_name: game_nickname }] },
            { unregistered: false },
          ],
        });

        if (registered) {
          return await interaction.reply({
            content: `> This member or this game nickname is already registered for <@${registered.id}> with nickname **${registered.ao_name}**.`,
            ephemeral: true,
          });
        }

        const newRegistration = new CTAMembers({
          gid: interaction.guildId,
          id: member.id,
          name: member.username,
          ao_name: game_nickname,
        });

        await newRegistration.save();

        await interaction.reply({ content: `> Registration completed!` });
      }

      const registered = await CTAMembers.findOne({
        $and: [
          { gid: interaction.guildId },
          { $or: [{ id: interaction.user.id }, { ao_name: game_nickname }] },
          { unregistered: false },
        ],
      });

      if (registered) {
        return await interaction.reply({
          content: `> You or your game nickname is already registered for <@${registered.id}> with nickname **${registered.ao_name}**.`,
          ephemeral: true,
        });
      }

      const newRegistration = new CTAMembers({
        gid: interaction.guildId,
        id: interaction.user.id,
        name: interaction.user.username,
        ao_name: game_nickname,
      });

      await newRegistration.save();

      await interaction.reply({ content: `> Registration completed!` });
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
      subcommand
        .setName("membership")
        .setDescription("Check which users are registrered but, doesn't have a member role.")
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
          option.setName("game_nickname").setDescription("Nickname from the game")
        )
        .addUserOption((option) => option.setName("member").setDescription("Select member"))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove_member_from_notregistered")
        .setDescription("Remove Member role from all not registered members.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show_unregistered")
        .setDescription("Show all members that have Member role, but are not registered.")
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
      //
    } else if (interaction.options.getSubcommand() === "membership") {
      if (!registration_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }
      //
    } else if (interaction.options.getSubcommand() === "register_all") {
      if (!manager_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }
      //
    } else if (interaction.options.getSubcommand() === "unregister") {
      if (!registration_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }
      //
    } else if (interaction.options.getSubcommand() === "remove_member_from_notregistered") {
      if (!manager_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }
      //
    } else if (interaction.options.getSubcommand() === "show_unregistered") {
      if (!registration_perms) {
        return await interaction.reply({
          content: `> No permission to use this command.`,
          ephemeral: true,
        });
      }
      //
    } else if (interaction.options.getSubcommand() === "whoami") {
      let message = ``;

      const embedMessage = new EmbedBuilder()
        .setColor(`#0AA2FF`)
        .setTitle(``)
        .setDescription(message);

      await interaction.reply({ embeds: [embedMessage] });
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
    .setDescription("Configutre the bot.")
    .addSubcommand((subcommand) => subcommand.setName("ao").setDescription("Check servers status")),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "ao") {
      //
    }
  },
};

module.exports = { CTA_Setup, CTA_Register, CTA_Registration, CTA_Vacation, CTA_Event };
