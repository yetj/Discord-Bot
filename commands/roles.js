const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, BitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roles")
        .setDescription("Roles manager")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add_role_to_members")
                .setDescription("Adds role to listed members separated by space in default")
                .addStringOption((option) =>
                    option
                        .setName("members")
                        .setDescription(
                            "List members (ID, displayname, discord tag) to give them role"
                        )
                        .setRequired(true)
                )
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("Role which should be added")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("separator")
                        .setMaxLength(3)
                        .setMinLength(1)
                        .setDescription("Separator for nicknames - default: space")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove_role_from_members")
                .setDescription("Removes role from listed members separated by space in default")
                .addStringOption((option) =>
                    option
                        .setName("members")
                        .setDescription(
                            "List members (ID, displayname, discord tag) to add them role"
                        )
                        .setRequired(true)
                )
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("Role which should be removed")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("separator")
                        .setMaxLength(3)
                        .setMinLength(1)
                        .setDescription("Separator for nicknames - default: space")
                )
        )
        .addSubcommand((subcommand) =>
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
        .addSubcommand((subcommand) =>
            subcommand
                .setName("assign_roles_to_channels")
                .setDescription("Adds roles to listed channels separated by space in default")
                .addStringOption((option) =>
                    option
                        .setName("roles")
                        .setDescription("Roles which should be added")
                        .setRequired(true)
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
        .addSubcommand((subcommand) =>
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
                    option
                        .setName("remove")
                        .setDescription("Instead of adding remove roles from roles?")
                )
                .addStringOption((option) =>
                    option
                        .setName("separator")
                        .setMaxLength(3)
                        .setMinLength(1)
                        .setDescription("Separator for roles - default: space")
                )
        )
        .addSubcommand((subcommand) =>
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
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create_roles")
                .setDescription("Creates roles")
                .addStringOption((option) =>
                    option.setName("color").setDescription("Role color").setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("roles")
                        .setDescription("Role names to be added")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("separator")
                        .setMaxLength(3)
                        .setMinLength(1)
                        .setDescription("Separator for roles - default: ,")
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "add_role_to_members") {
            const members = interaction.options.getString("members");
            const role = interaction.options.getRole("role");
            const separator = interaction.options.getString("separator") ?? " ";

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
                                    memberListNotFound.join("\n").length > 0
                                        ? memberListNotFound.join("\n")
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
                .setDescription(
                    `Added role ${role} to ${promises.length} member(s) separated by "${separator}"`
                )
                .addFields([
                    { name: "Found members:", value: `${post}`, inline: true },
                    {
                        name: "NOT Found members:",
                        value: `${
                            memberListNotFound.join("\n").length > 0
                                ? memberListNotFound.join("\n")
                                : "-"
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
                                    memberListNotFound.join("\n").length > 0
                                        ? memberListNotFound.join("\n")
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
                .setDescription(
                    `Removed role ${role} from ${promises.length} member(s) separated by "${separator}"`
                )
                .addFields([
                    { name: "Found members:", value: `${post}`, inline: true },
                    {
                        name: "NOT Found members:",
                        value: `${
                            memberListNotFound.join("\n").length > 0
                                ? memberListNotFound.join("\n")
                                : "-"
                        }`,
                        inline: true,
                    },
                ])
                .setFooter({ text: `Page ${page}` });

            await interaction.followUp({ embeds: [embed] });
        } else if (interaction.options.getSubcommand() === "remove_members_from_role") {
            const role = interaction.options.getRole("role");

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
            const READ_WRITE = { ViewChannel: true, SendMessages: null };
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
                                    return (
                                        c.name === module.exports.prepChannelName(channel) ||
                                        c.id === channel
                                    );
                                }) || null;
                        }

                        if (channelData) {
                            if (permissions === "remove") {
                                promises.push(channelData.permissionOverwrites.delete(roleData.id));
                            } else {
                                promises.push(
                                    channelData.permissionOverwrites.edit(
                                        roleData.id,
                                        permissionSet
                                    )
                                );
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
                        rolesCount.indexOf(roleDataNew.id) === -1
                            ? rolesCount.push(roleDataNew.id)
                            : null;
                        for (role_to_add of rolesToAdd) {
                            promises.push(member.roles.add(role_to_add));
                            rolesCount.indexOf(role_to_add) === -1
                                ? rolesCount.push(role_to_add)
                                : null;
                        }
                        playersCount.indexOf(member.id) === -1
                            ? playersCount.push(member.id)
                            : null;
                    });
                } else {
                    messageReply += `Role **${old_tag + role}** or **${
                        new_tag + role
                    }** doesn't exists.\n`;
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
