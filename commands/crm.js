const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const { CustomRoleManager, CustomRoleManagerLogs } = require("../dbmodels/crm.js");
const getDisplayName = require("../utils/getDisplayName.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crm")
    .setDescription("Custom role manager.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup_add")
        .setDescription("Add role manager")
        .addRoleOption((option) =>
          option
            .setName("role_manager")
            .setDescription("Role that can manage roles")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role_add")
            .setDescription("Role that can be added by manager")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup_remove")
        .setDescription("Remove role manager")
        .addRoleOption((option) =>
          option
            .setName("role_manager")
            .setDescription("Role that can manage roles")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role_add")
            .setDescription("Role that can be added by manager")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("setup_list").setDescription("List of role managers")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("role_add")
        .setDescription("Add role to member")
        .addUserOption((option) =>
          option.setName("user").setDescription("User that will get a role").setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("Role to be added").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("role_remove")
        .setDescription("Remove role from member")
        .addUserOption((option) =>
          option.setName("user").setDescription("User that will get a role").setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("Role to be added").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("role_add_multi")
        .setDescription("Add roles to members")
        .addStringOption((option) =>
          option.setName("users").setDescription("User that will get roles").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("roles").setDescription("Role to be added").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("separator")
            .setMaxLength(3)
            .setMinLength(1)
            .setDescription("Separator for users and roles - default: space")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("role_remove_multi")
        .setDescription("Remove roles from members")
        .addStringOption((option) =>
          option.setName("users").setDescription("Users that will lost roles").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("roles").setDescription("Roles to be added").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("separator")
            .setMaxLength(3)
            .setMinLength(1)
            .setDescription("Separator for users and roles - default: space")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("role_list")
        .setDescription("List all members with a role")
        .addRoleOption((option) =>
          option.setName("role").setDescription("Role that members have.").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("list_type")
            .setDescription("Way how nicnkames should be displayed on the list")
            .addChoices(
              { name: "Display name", value: "display_name" },
              { name: "Only IDs", value: "ids" },
              { name: "Mention", value: "mention" },
              { name: "Discord Name (TAG)", value: "username" }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("skip_bots")
            .setDescription("Skip listing bots (default: yes)")
            .addChoices({ name: "Yes", value: "yes" }, { name: "No", value: "no" })
        )
    ),
  async execute(interaction) {
    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.Administrator) &&
      ["setup_add", "setup_remove", "setup_list"].indexOf(interaction.options.getSubcommand()) !==
        -1
    ) {
      return await interaction.reply({
        content: `> *You don't have permission to execute this command!*`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "setup_add") {
      const role_manager = interaction.options.getRole("role_manager");
      const role_add = interaction.options.getRole("role_add");

      if (!role_manager || !role_add) {
        return await interaction.reply(`> *Please fill all required fields*`);
      }

      try {
        const configuredCustomRoleManager = await CustomRoleManager.findOne({
          gid: interaction.guildId,
          role_manager: role_manager.id,
          role_add: role_add.id,
        });

        if (configuredCustomRoleManager) {
          return await interaction.reply(
            `> *Role ${role_manager} already has permissions to add role ${role_add}.*`
          );
        }

        const newDatabase = await new CustomRoleManager({
          gid: interaction.guildId,
          role_manager: role_manager.id,
          role_add: role_add.id,
        });

        await newDatabase.save();

        let message = "";
        message += `> **Manager role:** ${role_manager}\n`;
        message += `> **Role that can be added:** ${role_add}\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#009900")
          .setTitle(`New Custom Role Manager added`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        await interaction.reply(
          `[ngj43] Error while creating new Custom Role Manager. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "setup_remove") {
      const role_manager = interaction.options.getRole("role_manager");
      const role_add = interaction.options.getRole("role_add");

      try {
        const customRoleManagerToBeRemoved = await CustomRoleManager.findOne({
          gid: interaction.guildId,
          role_manager: role_manager.id,
          role_add: role_add.id,
        });

        if (!customRoleManagerToBeRemoved) {
          return await interaction.reply(
            `> *Role ${role_manager} doesn't have possibility to manage role ${role_add}.*`
          );
        }

        await CustomRoleManager.deleteOne({
          gid: interaction.guild.id,
          role_manager: role_manager.id,
          role_add: role_add.id,
        });

        let message = "";
        message += `> **Manager role:** ${role_manager}\n`;
        message += `> **Role that can be added:** ${role_add}\n`;

        const embedMessage = new EmbedBuilder()
          .setColor("#990000")
          .setTitle(`Custom Role Manager removed`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        await interaction.reply(
          `[h43c3] Error while removing Custom Role Manager. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "setup_list") {
      try {
        const configuredCustomRoleManager = await CustomRoleManager.find({
          gid: interaction.guildId,
        });

        let message = "";

        if (!configuredCustomRoleManager || configuredCustomRoleManager.length < 1) {
          return await interaction.reply(`> *Not found any Custom Role Managers on this server*`);
        }

        configuredCustomRoleManager.forEach((crm) => {
          if (message.length > 0) {
            message += `\n-----\n`;
          }

          message += `> **Manager role:** <@&${crm.role_manager}>\n`;
          message += `> **Role that can be added:** <@&${crm.role_add}>`;
        });

        const embedMessage = new EmbedBuilder()
          .setColor("#000099")
          .setTitle(`Configured Custom Role Managers`)
          .setDescription(`${message}`);

        await interaction.reply({ embeds: [embedMessage] });
      } catch (err) {
        console.error(err);
        await interaction.reply(
          `[iof43] Error while listing Custom Role Manager. Please try again later.`
        );
      }
    } else if (interaction.options.getSubcommand() === "role_add") {
      const user = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");

      await interaction.deferReply({ ephemeral: true });

      module.exports.roleManage(interaction, user, role, "add");
    } else if (interaction.options.getSubcommand() === "role_remove") {
      const user = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");

      await interaction.deferReply({ ephemeral: true });

      module.exports.roleManage(interaction, user, role, "remove");
    } else if (interaction.options.getSubcommand() === "role_add_multi") {
      const users = interaction.options.getString("users");
      const roles = interaction.options.getString("roles");
      const separator = interaction.options.getString("separator") ?? " ";

      await interaction.guild.members.fetch({ cache: true, force: true });

      await interaction.deferReply({ ephemeral: true });

      module.exports.multiRoleManage(interaction, users, roles, "add", separator);
    } else if (interaction.options.getSubcommand() === "role_remove_multi") {
      const users = interaction.options.getString("users");
      const roles = interaction.options.getString("roles");
      const separator = interaction.options.getString("separator") ?? " ";

      await interaction.guild.members.fetch({ cache: true, force: true });

      await interaction.deferReply({ ephemeral: true });

      module.exports.multiRoleManage(interaction, users, roles, "remove", separator);
    } else if (interaction.options.getSubcommand() === "role_list") {
      const role = interaction.options.getRole("role");
      const list_type = interaction.options.getString("list_type");
      const skip_bots = interaction.options.getString("skip_bots") ?? "yes";

      await interaction.deferReply({ ephemeral: true });

      try {
        const configuredCustomRoleManager = await CustomRoleManager.find({
          gid: interaction.guildId,
          role_add: role.id,
        });

        let hasPermsToManageRole = false;
        if (!configuredCustomRoleManager) {
          return await interaction.followUp({
            content: `> *Role ${role} doesn't have a manager.*`,
            ephemeral: true,
          });
        }

        const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
          cache: true,
          force: true,
        });

        configuredCustomRoleManager.forEach((crm) => {
          if (interactionUser.roles.cache.has(crm.role_manager)) {
            hasPermsToManageRole = true;
          }
        });

        if (!hasPermsToManageRole) {
          return await interaction.followUp({
            content: `> *You don't have permissions to manage role ${role}.*`,
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error("[f34ca] CRM: ", err);
        return await interaction.followUp({
          content: `[f34ca] Something went wrong. Try again later.`,
          ephemeral: true,
        });
      }

      const allMembers = await interaction.guild.members.fetch({ cache: true, force: true });

      const filteredMembers = await allMembers.filter((m) => {
        if (skip_bots === "no") {
          return m.roles.cache.has(role.id);
        } else {
          return m.roles.cache.has(role.id) && m.user.bot === false;
        }
      });

      let post = "";
      let page = 1;

      if (filteredMembers.size) {
        filteredMembers.forEach(async (member) => {
          if (list_type == "ids") {
            post += `${member.user.id}\n`;
          } else if (list_type == "display_name") {
            if (member.nickname) {
              post += `${member.nickname}\n`;
            } else if (member.user.globalName) {
              post += `${member.user.globalName}\n`;
            } else {
              post += `${member.user.username}\n`;
            }
          } else if (list_type == "username") {
            post += `${member.user.username}\n`;
          } else {
            post += `${member}\n`;
          }

          if (post.length > 950) {
            const embed = new EmbedBuilder()
              .setColor("#1111cc")
              .setTitle("CRM Members")
              .setDescription(`Found **${filteredMembers.size}** member(s) with role ${role}`)
              .addFields([{ name: "List of members:", value: `${post}`, inline: true }])
              .setFooter({ text: `Page ${page}` });

            page++;

            post = "";
            await interaction.followUp({ embeds: [embed], ephemeral: true });
          }
        });

        const embed = new EmbedBuilder()
          .setColor("#1111cc")
          .setTitle("CRM Members")
          .setDescription(`Found **${filteredMembers.size}** member(s) with role ${role}`)
          .addFields([{ name: "List of members:", value: `${post}`, inline: true }])
          .setFooter({ text: `Page ${page}` });

        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        const embed = new EmbedBuilder()
          .setColor("#1111cc")
          .setTitle("CRM Members")
          .setDescription(`NOT found any member with role ${role}`);

        await interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    }
  },
  async multiRoleManage(interaction, users, roles, type, separator) {
    const usersSplitted = users.split(separator);
    const rolesSplitted = roles.split(separator);

    let finalUsers = [];
    let finalRoles = [];

    await rolesSplitted.forEach(async (role) => {
      role = role.trim();

      if (role.startsWith("<@&")) {
        role = role.substring(3, role.length - 1);
      }

      let roleData =
        (await interaction.guild.roles.cache.find((r) => {
          return r.name === role || r.id === role;
        })) || null;

      if (roleData) {
        finalRoles.push(roleData);
      } else {
        await interaction.followUp({
          content: `> *Role ${role}* doesn't exist.`,
          ephemeral: true,
        });
      }
    });

    await usersSplitted.forEach(async (user) => {
      user = user.trim();

      if (user.startsWith("<@")) {
        user = user.substring(2, user.length - 1);
      }

      let userData =
        (await interaction.guild.members.cache.find((u) => {
          return u.name === user || u.id === user;
        })) || null;

      if (userData) {
        finalUsers.push(userData);
      } else {
        await interaction.followUp({
          content: `> *User ${user}* doesn't exist.`,
          ephemeral: true,
        });
      }
    });

    finalRoles.forEach((role) => {
      finalUsers.forEach((user) => {
        module.exports.roleManage(interaction, user, role, type);
      });
    });
  },
  async roleManage(interaction, user, role, type) {
    if (user.bot) {
      return await interaction.followUp({
        content: `> *You don't have permissions to manage bot roles.*`,
        ephemeral: true,
      });
    }

    try {
      const configuredCustomRoleManager = await CustomRoleManager.find({
        gid: interaction.guildId,
        role_add: role.id,
      });

      let hasPermsToManageRole = false;
      if (!configuredCustomRoleManager) {
        return await interaction.followUp({
          content: `> *Role ${role} doesn't have a manager.*`,
          ephemeral: true,
        });
      }

      const interactionUser = await interaction.guild.members.fetch(interaction.user.id, {
        cache: true,
        force: true,
      });

      const userToManage = await interaction.guild.members.fetch(user.id, {
        cache: true,
        force: true,
      });

      configuredCustomRoleManager.forEach((crm) => {
        if (interactionUser.roles.cache.has(crm.role_manager)) {
          hasPermsToManageRole = true;
        }
      });

      if (!hasPermsToManageRole) {
        return await interaction.followUp({
          content: `> *You don't have permissions to manage role ${role}.*`,
          ephemeral: true,
        });
      }

      if (type == "add") {
        userToManage.roles.add(role.id);

        await interaction.followUp({
          content: `> *Role ${role} added to ${user}.*`,
          ephemeral: true,
        });
      } else if (type == "remove") {
        userToManage.roles.remove(role.id);

        await interaction.followUp({
          content: `> *Role ${role} removed from ${user}.*`,
          ephemeral: true,
        });
      }

      try {
        let full_cmd = "";

        const options = interaction.options._hoistedOptions;

        options.forEach((option) => {
          if (full_cmd.length) {
            full_cmd += ` | `;
          }
          full_cmd += `\`${option.name}\`: \`${option.value}\``;
        });

        const newDatabaseLog = await new CustomRoleManagerLogs({
          gid: interaction.guildId,
          user: interaction.user.id,
          user_name: getDisplayName(interactionUser),
          command: interaction.options.getSubcommand(),
          full_command: full_cmd,
          role: role.id,
          role_name: role.name,
          victim: user.id,
          victim_name: getDisplayName(userToManage),
        });

        await newDatabaseLog.save();
      } catch (err) {
        console.error(err);
        await interaction.followUp({
          content: `> [y45gf3] Error while adding logs in Custom Role Manager. Please try again later.`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error(err);
      await interaction.followUp({
        content: `> [niu9fi] Error while executing command **${interaction.options.getSubcommand()}** in Custom Role Manager. Please try again later.`,
        ephemeral: true,
      });
    }
  },
  async autoload(client) {
    client.on("roleDelete", async (role) => {
      const guildId = role.guild.id;
      const roleId = role.id;
      const roleName = role.name;

      try {
        const results = await CustomRoleManager.find({
          $and: [{ gid: guildId }, { $or: [{ role_manager: roleId }, { role_add: roleId }] }],
        });

        results.forEach(async (entry) => {
          const guild = await client.guilds.cache.get(entry.gid);

          if (guild) {
            guild.systemChannel.send(
              `> *Removed **Custom Role Manager** configuration for role **${roleName}** due to role removal.*`
            );

            console.log(
              `[CRM] Removed Custom Role Manager configuration for role "${roleName}" due to role removal on guild "${guild.name}".`
            );
          }
        });

        await CustomRoleManager.deleteMany({
          $and: [{ gid: guildId }, { $or: [{ role_manager: roleId }, { role_add: roleId }] }],
        });
      } catch (err) {
        console.error("[g33ff] ERROR: ", err);
      }
    });

    client.on("guildDelete", async (guild) => {
      try {
        const results = CustomRoleManager.find({ gid: guild.id });

        if (results) {
          await CustomRoleManager.deleteMany({ gid: guild.id });
          console.log(`[CRM] Guild "${guild.name}" removed as bot was removed from the guild.`);
        }
      } catch (err) {
        console.error("[g5g3f] ERROR: ", err);
      }
    });
  },
};
