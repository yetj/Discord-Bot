const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, BitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Roles manager")
    .addSubcommand(
      (
        subcommand // add_role_to_members
      ) =>
        subcommand
          .setName("add_role_to_members")
          .setDescription("Adds role to listed members separated by space in default")
          .addStringOption((option) =>
            option
              .setName("members")
              .setDescription("List members (ID, displayname, discord tag) to give them role")
              .setRequired(true)
          )
          .addRoleOption((option) =>
            option.setName("role").setDescription("Role which should be added").setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("separator")
              .setMaxLength(3)
              .setMinLength(1)
              .setDescription("Separator for nicknames - default: space")
          )
    )
    .addSubcommand(
      (
        subcommand // remove_role_from_members
      ) =>
        subcommand
          .setName("remove_role_from_members")
          .setDescription("Removes role from listed members separated by space in default")
          .addStringOption((option) =>
            option
              .setName("members")
              .setDescription("List members (ID, displayname, discord tag) to add them role")
              .setRequired(true)
          )
          .addRoleOption((option) =>
            option.setName("role").setDescription("Role which should be removed").setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("separator")
              .setMaxLength(3)
              .setMinLength(1)
              .setDescription("Separator for nicknames - default: space")
          )
    )
    .addSubcommand(
      (
        subcommand // remove_members_from_role
      ) =>
        subcommand
          .setName("remove_members_from_role")
          .setDescription("Removes members from selected role")
          .addRoleOption((option) =>
            option
              .setName("role")
              .setDescription("Role from which members should be removed")
              .setRequired(true)
          )
    )
    .addSubcommand(
      (
        subcommand // assign_roles_to_channels
      ) =>
        subcommand
          .setName("assign_roles_to_channels")
          .setDescription("Adds roles to listed channels separated by space in default")
          .addStringOption((option) =>
            option.setName("roles").setDescription("Roles which should be added").setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("channels")
              .setDescription("Channels to add listed roles")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("permissions")
              .setDescription("Which permissions added roles shouls have on channels")
              .setRequired(true)
              .addChoices(
                { name: "👁 Read", value: "read" },
                { name: "📝 Write", value: "write" },
                { name: "🔊 Talk", value: "talk" },
                { name: "🔇 No Talk", value: "notalk" },
                { name: "⛔ No Access", value: "none" },
                { name: "❌ Remove perms - set default", value: "remove" }
              )
          )
          .addBooleanOption((option) =>
            option.setName("is_voice").setDescription("Is it voice channel?")
          )
          .addStringOption((option) =>
            option
              .setName("separator")
              .setMaxLength(3)
              .setMinLength(1)
              .setDescription("Separator for roles and channels - default: space")
          )
    )
    .addSubcommand(
      (
        subcommand // add_roles_to_roles
      ) =>
        subcommand
          .setName("add_roles_to_roles")
          .setDescription("Adds roles to roles")
          .addStringOption((option) =>
            option
              .setName("roles_to_find")
              .setDescription("List roles (ID, name, tag) to find")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("roles_to_add")
              .setDescription("List roles (ID, name, tag) to add")
              .setRequired(true)
          )
          .addBooleanOption((option) =>
            option.setName("remove").setDescription("Instead of adding remove roles from roles?")
          )
          .addStringOption((option) =>
            option
              .setName("separator")
              .setMaxLength(3)
              .setMinLength(1)
              .setDescription("Separator for roles - default: space")
          )
    )
    .addSubcommand(
      (
        subcommand // add_roles_to_roles_by_tag
      ) =>
        subcommand
          .setName("add_roles_to_roles_by_tag")
          .setDescription("Adds roles to roles by tag")
          .addStringOption((option) =>
            option
              .setName("old_tag")
              .setDescription("Find roles with this tag (Example: 'NA - ')")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("new_tag")
              .setDescription("Add roles with this tag (Example: 'AM - ')")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("roles")
              .setDescription("List role names without a tag to find ")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("roles_to_add")
              .setDescription("List additionall roles to add (ID, name, tag) to add")
          )
          .addStringOption((option) =>
            option
              .setName("separator")
              .setMaxLength(3)
              .setMinLength(1)
              .setDescription("Separator for roles - default: ,")
          )
          .addBooleanOption((option) =>
            option.setName("dash").setDescription("Add ' - ' between TAG and team name?")
          )
    )
    .addSubcommand(
      (
        subcommand // create_roles
      ) =>
        subcommand
          .setName("create_roles")
          .setDescription("Creates roles")
          .addStringOption((option) =>
            option.setName("color").setDescription("Role color").setRequired(true)
          )
          .addStringOption((option) =>
            option.setName("roles").setDescription("Role names to be added").setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("separator")
              .setMaxLength(3)
              .setMinLength(1)
              .setDescription("Separator for roles - default: ,")
          )
    )
    .addSubcommand(
      (
        subcommand // check_if_member_exists
      ) =>
        subcommand
          .setName("check_if_member_exists")
          .setDescription("Checks if mentioned member can be found on the server")
          .addStringOption((option) =>
            option
              .setName("members")
              .setDescription("List members (ID, displayname, discord tag) to give them role")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("separator")
              .setMaxLength(3)
              .setMinLength(1)
              .setDescription("Separator for nicknames - default: ,")
          )
          .addBooleanOption((option) =>
            option
              .setName("check_only_display_name")
              .setDescription("Should bot check only display name?")
          )
    )
    .addSubcommand(
      (
        subcommand // list_members_with_role
      ) =>
        subcommand
          .setName("list_members_with_role")
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
                { name: "Discord Name (TAG)", value: "username" },
                { name: "Formated IDs", value: "formated_ids" },
                { name: "Shadow mention", value: "shadow_mention" }
              )
              .setRequired(true)
          )
          .addBooleanOption((option) =>
            option.setName("skip_bots").setDescription("Skip listing bots (default: yes)")
          )
          .addBooleanOption((option) =>
            option.setName("embed").setDescription("Post it as an embed message (default: yes).")
          )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "add_role_to_members") {
      const members = interaction.options.getString("members");
      const role = interaction.options.getRole("role");
      const separator = interaction.options.getString("separator") ?? " ";

      await interaction.guild.members.fetch({ cache: true, force: true });

      let promises = [];
      let memberList = [];
      let memberListNotFound = [];

      const membersSplitted = members.trim().split(separator);

      for (memberSplitted of membersSplitted) {
        memberSplitted = memberSplitted.trim();

        const [username, discriminator] = memberSplitted.includes("#")
          ? memberSplitted.split("#")
          : [null, null];

        if (memberSplitted.startsWith("<@") && memberSplitted.endsWith(">")) {
          memberSplitted = memberSplitted.slice(2, -1);
        }

        const member = interaction.guild.members.cache.find(
          (m) =>
            m.user.id == memberSplitted ||
            m.nickname == memberSplitted ||
            (m.user.username == username && m.user.discriminator == discriminator) ||
            (m.user.username == memberSplitted && m.user.discriminator == "0") ||
            (m.user.globalName == memberSplitted && m.user.discriminator == "0")
        );

        if (member) {
          memberList.push(member);
          promises.push(member.roles.add(role));
        } else {
          memberListNotFound.push(memberSplitted);
        }
      }

      await interaction.deferReply();

      await Promise.all(promises);

      await interaction.followUp({ content: `> *Done!*` });

      let post = "";
      let page = 1;

      memberList.forEach(async (member) => {
        post += `${member}\n`;

        if (post.length > 950) {
          const embed = new EmbedBuilder()
            .setColor("#2222cc")
            .setTitle("Roles")
            .setDescription(
              `Added role ${role} to ${promises.length} member(s) separated by "${separator}"`
            )
            .addFields([
              { name: "Found members:", value: `${post}`, inline: true },
              {
                name: "NOT Found members:",
                value: `${
                  memberListNotFound.join("\n").length > 0 ? memberListNotFound.join("\n") : "-"
                }`,
                inline: true,
              },
            ])
            .setFooter({ text: `Page ${page}` });

          page++;

          post = "";
          await interaction.followUp({ embeds: [embed] });
        }
      });

      const embed = new EmbedBuilder()
        .setColor("#2222cc")
        .setTitle("Roles")
        .setDescription(
          `Added role ${role} to ${promises.length} member(s) separated by "${separator}"`
        )
        .addFields([
          { name: "Found members:", value: `${post}`, inline: true },
          {
            name: "NOT Found members:",
            value: `${
              memberListNotFound.join("\n").length > 0 ? memberListNotFound.join("\n") : "-"
            }`,
            inline: true,
          },
        ])
        .setFooter({ text: `Page ${page}` });

      await interaction.followUp({ embeds: [embed] });
    } else if (interaction.options.getSubcommand() === "remove_role_from_members") {
      const members = interaction.options.getString("members");
      const role = interaction.options.getRole("role");
      const separator = interaction.options.getString("separator") ?? " ";

      await interaction.guild.members.fetch({ cache: true, force: true });

      let promises = [];
      let memberList = [];
      let memberListNotFound = [];

      const membersSplitted = members.trim().split(separator);

      for (memberSplitted of membersSplitted) {
        memberSplitted = memberSplitted.trim();

        const [username, discriminator] = memberSplitted.includes("#")
          ? memberSplitted.split("#")
          : [null, null];

        if (memberSplitted.startsWith("<@") && memberSplitted.endsWith(">")) {
          memberSplitted = memberSplitted.slice(2, -1);
        }

        const member = interaction.guild.members.cache.find(
          (m) =>
            m.user.id == memberSplitted ||
            m.nickname == memberSplitted ||
            (m.user.username == username && m.user.discriminator == discriminator)
        );

        if (member) {
          memberList.push(member);
          promises.push(member.roles.remove(role));
        } else {
          memberListNotFound.push(memberSplitted);
        }
      }

      await interaction.deferReply();

      await Promise.all(promises);

      await interaction.followUp({ content: `> *Done!*` });

      let post = "";
      let page = 1;

      memberList.forEach(async (member) => {
        post += `${member}\n`;

        if (post.length > 950) {
          const embed = new EmbedBuilder()
            .setColor("#2222cc")
            .setTitle("Roles")
            .setDescription(
              `Removed role ${role} from ${promises.length} member(s) separated by "${separator}"`
            )
            .addFields([
              { name: "Found members:", value: `${post}`, inline: true },
              {
                name: "NOT Found members:",
                value: `${
                  memberListNotFound.join("\n").length > 0 ? memberListNotFound.join("\n") : "-"
                }`,
                inline: true,
              },
            ])
            .setFooter({ text: `Page ${page}` });

          page++;

          post = "";
          await interaction.followUp({ embeds: [embed] });
        }
      });

      const embed = new EmbedBuilder()
        .setColor("#2222cc")
        .setTitle("Roles")
        .setDescription(
          `Removed role ${role} from ${promises.length} member(s) separated by "${separator}"`
        )
        .addFields([
          { name: "Found members:", value: `${post}`, inline: true },
          {
            name: "NOT Found members:",
            value: `${
              memberListNotFound.join("\n").length > 0 ? memberListNotFound.join("\n") : "-"
            }`,
            inline: true,
          },
        ])
        .setFooter({ text: `Page ${page}` });

      await interaction.followUp({ embeds: [embed] });
    } else if (interaction.options.getSubcommand() === "remove_members_from_role") {
      const role = interaction.options.getRole("role");

      await interaction.guild.members.fetch({ cache: true, force: true });

      let promises = [];
      let membersWithRemovedRole = [];
      let membersWithNotRemovedRole = [];

      const membersWithRole = await interaction.guild.roles.cache.get(role.id).members;

      membersWithRole.forEach((member) => {
        promises.push(
          member.roles
            .remove(role.id)
            .then((m) => {
              membersWithRemovedRole.push(member);
            })
            .catch((e) => {
              membersWithNotRemovedRole.push(member);
            })
        );
      });

      await interaction.deferReply();

      await Promise.all(promises);

      await interaction.followUp({ content: `> *Done!*` });

      let post = "";
      let page = 1;

      membersWithRemovedRole.forEach(async (member) => {
        post += `${member}\n`;

        if (post.length > 950) {
          const embed = new EmbedBuilder()
            .setColor("#2222cc")
            .setTitle("Roles")
            .setDescription(
              `Removed role ${role} from **${membersWithRemovedRole.length}** member(s)`
            )
            .addFields([
              { name: "Role removed from:", value: `${post}`, inline: true },
              {
                name: "Role NOT removed from:",
                value: `${
                  membersWithNotRemovedRole.join("\n").length > 0
                    ? membersWithNotRemovedRole.join("\n")
                    : "-"
                }`,
                inline: true,
              },
            ])
            .setFooter({ text: `Page ${page}` });

          page++;
          post = "";
          await interaction.followUp({ embeds: [embed] });
        }
      });

      const embed = new EmbedBuilder()
        .setColor("#2222cc")
        .setTitle("Roles")
        .setDescription(`Removed role ${role} from **${membersWithRemovedRole.length}** member(s)`)
        .addFields([
          { name: "Role removed from:", value: `${post}`, inline: true },
          {
            name: "Role NOT removed from:",
            value: `${
              membersWithNotRemovedRole.join("\n").length > 0
                ? membersWithNotRemovedRole.join("\n")
                : "-"
            }`,
            inline: true,
          },
        ])
        .setFooter({ text: `Page ${page}` });

      await interaction.followUp({ embeds: [embed] });
    } else if (interaction.options.getSubcommand() === "assign_roles_to_channels") {
      const roles = interaction.options.getString("roles");
      const channels = interaction.options.getString("channels");
      const permissions = interaction.options.getString("permissions");
      const is_voice = interaction.options.getBoolean("is_voice") ?? false;
      const separator = interaction.options.getString("separator") ?? " ";

      // VIEW_CHANNEL - 0x0000000000000400
      // SEND_MESSAGES - 0x0000000000000800
      // CONNECT - 0x0000000000100000
      // SPEAK - 0x0000000000200000
      // STREAM - 0x0000000000000200

      const NO_ACCESS = { ViewChannel: false, SendMessages: null };
      const READ_ONLY = { ViewChannel: true, SendMessages: false };
      const READ_WRITE = { ViewChannel: true, SendMessages: true };
      const NO_SPEAK = { ViewChannel: false, Connect: false, Speak: false, Stream: false };
      const TALK = { ViewChannel: true, Connect: true, Speak: true, Stream: true };

      let promises = [];
      let permissionSet = {};

      let messageReply = "";

      const roles_to_add = roles.trim().split(separator);
      const channels_to_find = channels.trim().split(separator);

      switch (permissions) {
        case "read":
          permissionSet = READ_ONLY;
          break;
        case "write":
          permissionSet = READ_WRITE;
          break;
        case "talk":
          permissionSet = TALK;
          break;
        case "notalk":
          permissionSet = NO_SPEAK;
          break;
        case ("none", "no"):
          permissionSet = NO_ACCESS;
          break;
      }

      let rolesCount = 0;

      for (role of roles_to_add) {
        role = role.trim();

        if (role.startsWith("<@&")) {
          role = role.substring(3, role.length - 1);
        }

        let roleData =
          interaction.guild.roles.cache.find((r) => {
            return r.name === role || r.id === role;
          }) || null;

        if (roleData) {
          rolesCount++;
          for (channel of channels_to_find) {
            channel = channel.trim();
            let channelData = {};

            if (channel.startsWith("<#")) {
              channel = channel.substring(2, channel.length - 1);
            }

            if (is_voice === true) {
              channelData =
                interaction.guild.channels.cache.find((c) => {
                  return c.name === channel || c.id === channel;
                }) || null;
            } else {
              channelData =
                interaction.guild.channels.cache.find((c) => {
                  return c.name === module.exports.prepChannelName(channel) || c.id === channel;
                }) || null;
            }

            if (channelData) {
              if (permissions === "remove") {
                promises.push(channelData.permissionOverwrites.delete(roleData.id));
              } else {
                promises.push(channelData.permissionOverwrites.edit(roleData.id, permissionSet));
              }
            } else {
              messageReply += `Channel **${channel}** doesn't exists.\n`;
            }
          }
        } else {
          messageReply += `Role **${role}** doesn't exists.\n`;
        }
      }

      await interaction.reply({
        content: `> *Adding or updating role permissions to channels. Please wait...*\n${messageReply}`,
      });

      await Promise.all(promises);

      await interaction.followUp(
        `> *Added or updated **${rolesCount}** role(s) for **${
          promises.length / rolesCount
        }** channel(s)*`
      );
    } else if (interaction.options.getSubcommand() === "add_roles_to_roles") {
      const roles_to_find = interaction.options.getString("roles_to_find");
      const roles_to_add = interaction.options.getString("roles_to_add");
      const separator = interaction.options.getString("separator") ?? " ";
      const remove = interaction.options.getBoolean("remove") ?? false;

      await interaction.guild.members.fetch({ cache: true, force: true });

      let promises = [];
      let rolesToAdd = [];

      let messageReply = "";

      const roles_to_find_splitted = roles_to_find.trim().split(separator);
      const roles_to_add_splitted = roles_to_add.trim().split(separator);

      for (role_to_add of roles_to_add_splitted) {
        let role = role_to_add.trim();

        if (role.startsWith("<@&")) {
          role = role.substring(3, role.length - 1);
        }

        let roleData =
          interaction.guild.roles.cache.find((r) => {
            return r.name === role || r.id === role;
          }) || null;

        if (roleData) {
          if (rolesToAdd.indexOf(roleData.id) == -1) {
            rolesToAdd.push(roleData.id);
          }
        } else {
          messageReply += `Role **${role_to_add}** doesn't exists.\n`;
        }
      }

      for (role_to_find of roles_to_find_splitted) {
        let role = role_to_find.trim();

        if (role.startsWith("<@&")) {
          role = role.substring(3, role.length - 1);
        }

        let roleData =
          interaction.guild.roles.cache.find((r) => {
            return r.name === role || r.id === role;
          }) || null;

        if (roleData) {
          const membersWithRole = roleData.members;

          membersWithRole.forEach((member) => {
            for (role_to_add of rolesToAdd) {
              if (remove) {
                promises.push(member.roles.remove(role_to_add));
              } else {
                promises.push(member.roles.add(role_to_add));
              }
            }
          });
        } else {
          messageReply += `Role **${role_to_add}** doesn't exists.\n`;
        }
      }

      if (remove) {
        await interaction.reply({
          content: `> *Removing roles from members. Please wait...*\n${messageReply}`,
        });
      } else {
        await interaction.reply({
          content: `> *Adding roles to members. Please wait...*\n${messageReply}`,
        });
      }

      await Promise.all(promises);

      if (remove) {
        await interaction.followUp(
          `> *Removed **${rolesToAdd.length}** role(s) from **${
            promises.length / rolesToAdd.length
          }** member(s)*`
        );
      } else {
        await interaction.followUp(
          `> *Added **${rolesToAdd.length}** role(s) to **${
            promises.length / rolesToAdd.length
          }** member(s)*`
        );
      }
    } else if (interaction.options.getSubcommand() === "add_roles_to_roles_by_tag") {
      const roles = interaction.options.getString("roles");
      let old_tag = interaction.options.getString("old_tag");
      let new_tag = interaction.options.getString("new_tag");
      const roles_to_add = interaction.options.getString("roles_to_add");
      const separator = interaction.options.getString("separator") ?? ",";
      const dash = interaction.options.getBoolean("dash") ?? false;

      await interaction.guild.members.fetch({ cache: true, force: true });

      let promises = [];
      let rolesToAdd = [];

      let rolesCount = [];
      let playersCount = [];

      let messageReply = "";

      const roles_splitted = roles.trim().split(separator);
      const roles_to_add_splitted = roles_to_add.trim().split(separator);

      if (dash == true) {
        old_tag += " - ";
        new_tag += " - ";
      }

      for (role_to_add of roles_to_add_splitted) {
        let role = role_to_add.trim();

        if (role.startsWith("<@&")) {
          role = role.substring(3, role.length - 1);
        }

        let roleData =
          interaction.guild.roles.cache.find((r) => {
            return r.name === role || r.id === role;
          }) || null;

        if (roleData) {
          if (rolesToAdd.indexOf(roleData.id) == -1) {
            rolesToAdd.push(roleData.id);
          }
        } else {
          messageReply += `Role **${role_to_add}** doesn't exists.\n`;
        }
      }

      for (role_to_find of roles_splitted) {
        let role = role_to_find.trim();

        let roleDataOld =
          interaction.guild.roles.cache.find((r) => {
            return r.name === old_tag + role;
          }) || null;

        let roleDataNew =
          interaction.guild.roles.cache.find((r) => {
            return r.name === new_tag + role;
          }) || null;

        if (roleDataOld && roleDataNew) {
          const membersWithRole = roleDataOld.members;

          membersWithRole.forEach((member) => {
            promises.push(member.roles.add(roleDataNew.id));
            rolesCount.indexOf(roleDataNew.id) === -1 ? rolesCount.push(roleDataNew.id) : null;
            for (role_to_add of rolesToAdd) {
              promises.push(member.roles.add(role_to_add));
              rolesCount.indexOf(role_to_add) === -1 ? rolesCount.push(role_to_add) : null;
            }
            playersCount.indexOf(member.id) === -1 ? playersCount.push(member.id) : null;
          });
        } else {
          messageReply += `Role **${old_tag + role}** or **${new_tag + role}** doesn't exists.\n`;
        }
      }

      await interaction.reply({
        content: `> *Adding roles to members. Please wait...*\n${messageReply}`,
      });

      await Promise.all(promises);

      await interaction.followUp(
        `> *Added **${rolesCount.length}** different role(s) to **${playersCount.length}** different member(s)*`
      );
    } else if (interaction.options.getSubcommand() === "create_roles") {
      let color = interaction.options.getString("color").trim();
      const roles = interaction.options.getString("roles").trim();
      const separator = interaction.options.getString("separator") ?? ",";

      if (!/^([0-9a-fA-F]{6})|(\<\@\&[0-9]+\>)$/.test(color)) {
        return await interaction.reply(
          `> *Color (**\`${color}\`**) is not valid. Please use format: \`FFFFFF\` or mention role *`
        );
      }

      if (color.startsWith("<@&") && color.endsWith(">")) {
        color = color.slice(3, -1);

        let roleData = interaction.guild.roles.cache.get(color);

        if (roleData) {
          color = roleData.color;
        }
      }

      let promises = [];
      let createdRoles = [];

      const rolesSplitted = roles.split(separator);

      await rolesSplitted.forEach((roleName) => {
        roleName = roleName.trim();

        // create region role
        promises.push(
          interaction.guild.roles
            .create({
              name: `${roleName}`,
              color: color,
              mentionable: true,
            })
            .then((role) => {
              createdRoles.push(role.id);
            })
            .catch(console.error)
        );
      });

      await interaction.reply(`> *Creating roles...*`);

      await Promise.all(promises);

      const rolesCreatedList = createdRoles.map((r) => {
        return `\n> <@&${r}>`;
      });

      await interaction.followUp(`**Created roles:**${rolesCreatedList}`);
    } else if (interaction.options.getSubcommand() === "check_if_member_exists") {
      const members = interaction.options.getString("members");
      const separator = interaction.options.getString("separator") ?? ",";
      const check_only_display_name =
        interaction.options.getBoolean("check_only_display_name") ?? false;

      let promises = [];
      let memberList = [];
      let memberListNotFound = [];

      const membersSplitted = members.trim().split(separator);

      await interaction.guild.members.fetch({ cache: true, force: true });

      for (memberSplitted of membersSplitted) {
        memberSplitted = memberSplitted.trim();

        const [username, discriminator] = memberSplitted.includes("#")
          ? memberSplitted.split("#")
          : [null, null];

        if (memberSplitted.startsWith("<@") && memberSplitted.endsWith(">")) {
          memberSplitted = memberSplitted.slice(2, -1);
        }

        let member = null;

        if (check_only_display_name === true) {
          member = interaction.guild.members.cache.find(
            (m) =>
              m.nickname == memberSplitted ||
              (m.nickname == null && m.user.globalName == memberSplitted) ||
              (m.nickname == null && m.user.globalName == null && m.user.username == memberSplitted)
          );
        } else {
          member = interaction.guild.members.cache.find(
            (m) =>
              m.user.id == memberSplitted ||
              m.nickname == memberSplitted ||
              (m.user.username == username && m.user.discriminator == discriminator) ||
              (m.user.username == memberSplitted && m.user.discriminator == "0") ||
              (m.user.globalName == memberSplitted && m.user.discriminator == "0")
          );
        }

        if (member) {
          memberList.push(member);
        } else {
          memberListNotFound.push(memberSplitted);
        }
      }

      await interaction.deferReply();

      await Promise.all(promises);

      await interaction.followUp({ content: `> *Done!*` });

      let post = "";
      let page = 1;

      memberListNotFound.forEach(async (member) => {
        post += `${member}\n`;

        if (post.length > 950) {
          const embed = new EmbedBuilder()
            .setColor("#2222cc")
            .setTitle("Roles")
            .setDescription(
              `Found: **${memberList.length}** members separated by "${separator}"\n NOT Found: **${memberListNotFound.length}** members separated by "${separator}"`
            )
            .addFields([{ name: "NOT found members:", value: `${post}`, inline: true }])
            .setFooter({ text: `Page ${page}` });

          page++;

          post = "";
          await interaction.followUp({ embeds: [embed] });
        }
      });

      if (!post.length) {
        post = "All members found!";
      }

      const embed = new EmbedBuilder()
        .setColor("#2222cc")
        .setTitle("Roles")
        .setDescription(
          `Found: **${memberList.length}** member(s) separated by "${separator}"\n NOT Found: **${memberListNotFound.length}** member(s) separated by "${separator}"`
        )
        .addFields([{ name: "NOT found members:", value: `${post}`, inline: true }])
        .setFooter({ text: `Page ${page}` });

      await interaction.followUp({ embeds: [embed] });
    } else if (interaction.options.getSubcommand() === "list_members_with_role") {
      const role = interaction.options.getRole("role");
      const list_type = interaction.options.getString("list_type");
      const skip_bots = interaction.options.getBoolean("skip_bots") ?? true;
      const embed_post = interaction.options.getBoolean("embed") ?? true;

      const allMembers = await interaction.guild.members.fetch({ cache: true, force: true });

      const filteredMembers = await allMembers.filter((m) => {
        if (skip_bots === false) {
          return m.roles.cache.has(role.id);
        } else {
          return m.roles.cache.has(role.id) && m.user.bot === false;
        }
      });

      await interaction.deferReply();

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
          } else if (list_type == "formated_ids") {
            post += `\`<@${member.user.id}>\`\n`;
          } else {
            post += `${member}\n`;
          }

          if (post.length > 950) {
            const embed = new EmbedBuilder()
              .setColor("#2222cc")
              .setTitle("Members")
              .setDescription(`Found **${filteredMembers.size}** member(s) with role ${role}`)
              .addFields([{ name: "List of members:", value: `${post}`, inline: true }])
              .setFooter({ text: `Page ${page}` });

            page++;

            if (embed_post && list_type != "shadow_mention") {
              await interaction.followUp({ embeds: [embed] });
            } else {
              await interaction.channel
                .send({
                  content: `## Members\n> Found **${filteredMembers.size}** member(s) with role ${role}\n**List of members:**\n${post}\n*Page ${page}*`,
                })
                .then(async (p) => {
                  if (list_type == "shadow_mention") {
                    setTimeout(p.delete(), 500);
                  }

                  interaction.deleteReply();
                });
            }
            post = "";
          }
        });

        const embed = new EmbedBuilder()
          .setColor("#2222cc")
          .setTitle("Members")
          .setDescription(`Found **${filteredMembers.size}** member(s) with role ${role}`)
          .addFields([{ name: "List of members:", value: `${post}`, inline: true }])
          .setFooter({ text: `Page ${page}` });

        if (embed_post && list_type != "shadow_mention") {
          await interaction.followUp({ embeds: [embed] });
        } else {
          await interaction.channel
            .send({
              content: `## Members\n> Found **${filteredMembers.size}** member(s) with role ${role}\n**List of members:**\n${post}\n*Page ${page}*`,
            })
            .then((p) => {
              if (list_type == "shadow_mention") {
                setTimeout(p.delete(), 500);
              }

              interaction.deleteReply();
            });
        }
      } else {
        const embed = new EmbedBuilder()
          .setColor("#cc2222")
          .setTitle("Members")
          .setDescription(`NOT found any member with a role ${role}`);

        if (embed_post && list_type != "shadow_mention") {
          await interaction.followUp({ embeds: [embed] });
        } else {
          await interaction.followUp(`## Members\n> NOT found any member with a role ${role}`);
        }
      }
    }
  },
  prepChannelName(name) {
    name = name.toLowerCase();
    name = name.replace(/[`~!@#\$%\^&*\(\)|+=?;:",<>\{\}\[\]\\\/]/g, "-");
    name = name.replace(/['\.]/g, "");
    name = name.replace(/ /g, "-");
    name = name.replace("---", "-");
    name = name.replace("--", "-");
    name = name.replace("--", "-");
    name = name.replace("--", "-");
    name = name.replace(/-$/, "");

    return name;
  },
};
