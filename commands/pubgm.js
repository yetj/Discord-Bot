const {
    SlashCommandBuilder,
    PermissionsBitField,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pubgm")
        .setDescription("Commands related to PUBG Mobile Pro League Discord Server.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create_category")
                .setDescription("Creates new region category")
                .addStringOption((option) =>
                    option
                        .setName("category_name")
                        .setDescription("Category name")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("category_tag")
                        .setDescription("Category TAG")
                        .setMaxLength(5)
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("role_name").setDescription("Role name").setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("role_color")
                        .setDescription("Role color in RGB")
                        .setMinLength(6)
                        .setMaxLength(6)
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create_roles_and_channels")
                .setDescription("Creates roles and channels")
                .addStringOption((option) =>
                    option.setName("color").setDescription("Category name").setRequired(true)
                )
                .addChannelOption((option) =>
                    option
                        .setName("category")
                        .setDescription("Parent category")
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("tag").setDescription("TAG").setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("roles")
                        .setDescription("Role names to be added")
                        .setRequired(true)
                )
                .addRoleOption((option) =>
                    option.setName("admin_role").setDescription("Admin role").setRequired(true)
                )
                .addRoleOption((option) =>
                    option
                        .setName("plama_role")
                        .setDescription("Player Manager role")
                        .setRequired(true)
                )
                .addRoleOption((option) =>
                    option.setName("team_role").setDescription("Teams role").setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("separator")
                        .setMaxLength(3)
                        .setMinLength(1)
                        .setDescription("Separator for roles - default: ,")
                )
                .addBooleanOption((option) =>
                    option
                        .setName("is_voice")
                        .setDescription(
                            "Do you want to create voice channels instead text channels?"
                        )
                )
                .addBooleanOption((option) =>
                    option
                        .setName("voice_and_text")
                        .setDescription("Do you want to create voice and text channels?")
                )
                .addBooleanOption((option) =>
                    option
                        .setName("skip_creating_channels")
                        .setDescription("Do you want to create create roles only?")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove_roles_and_channels")
                .setDescription("Remove roles and channels")
                .addStringOption((option) =>
                    option
                        .setName("roles")
                        .setDescription("Role names to be removed")
                        .setRequired(true)
                )
                .addStringOption((option) => option.setName("tag").setDescription("TAG"))
                .addStringOption((option) =>
                    option
                        .setName("separator")
                        .setMaxLength(3)
                        .setMinLength(1)
                        .setDescription("Separator for roles - default: ,")
                )
                .addBooleanOption((option) =>
                    option
                        .setName("is_voice")
                        .setDescription(
                            "Do you want to remove voice channels instead text channels?"
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("check")
                .setDescription("Check if roles and channels exists")
                .addStringOption((option) =>
                    option.setName("team_names").setDescription("Team names").setRequired(true)
                )
                .addStringOption((option) => option.setName("tag").setDescription("TAG"))
                .addStringOption((option) =>
                    option
                        .setName("separator")
                        .setMaxLength(4)
                        .setMinLength(1)
                        .setDescription("Separator for roles - default: ,")
                )
                .addBooleanOption((option) =>
                    option.setName("is_voice").setDescription("Are these voice channels?")
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        if (
            interaction.user.id !== "165542890334978048" &&
            interaction.options.getSubcommand() === "check"
        ) {
            return await interaction.reply({
                content: `> *You are not authorized to use this command. Sorry...*`,
                ephemeral: true,
            });
        }

        if (interaction.options.getSubcommand() === "create_category") {
            const category_name = interaction.options.getString("category_name").trim();
            const category_tag = interaction.options.getString("category_tag").trim();
            const role_name = interaction.options.getString("role_name").trim();
            const role_color = interaction.options.getString("role_color").trim();

            let newRole = null;
            let adminRole = null;
            let plamaRole = null;
            let casterRole = null;
            let teamsRole = null;
            let newCat = null;

            let messageRoles = "";
            let messageChannels = "";

            const roleTencent = interaction.guild.roles.cache.find((r) => r.name === "Tencent");
            const roleAdmin = interaction.guild.roles.cache.find((r) => r.name === "Admin");
            const rolePlama = interaction.guild.roles.cache.find(
                (r) => r.name === "Player Manager"
            );
            const roleBroadcast = interaction.guild.roles.cache.find((r) => r.name === "Broadcast");
            const roleCaster = interaction.guild.roles.cache.find((r) => r.name === "Caster");
            const roleTeamOwner = interaction.guild.roles.cache.find(
                (r) => r.name === "Team Owner"
            );
            const roleGuest = interaction.guild.roles.cache.find((r) => r.name === "Guest");
            const roleEveryone = interaction.guild.roles.cache.find((r) => r.name === "@everyone");

            const channelLobby = interaction.guild.channels.cache.find((c) => c.name === "lobby");
            const channelRoleRequest = interaction.guild.channels.cache.find(
                (c) => c.name === "role-request"
            );
            const channelAnnouncement = interaction.guild.channels.cache.find(
                (c) => c.name === "📢┃announcements"
            );
            const channelRules = interaction.guild.channels.cache.find(
                (c) => c.name === "📝┃rules"
            );
            const staffArea = interaction.guild.channels.cache.find(
                (c) => c.name === "🔒 Staff Area"
            );

            if (!roleTencent) return await interaction.reply(`> *Role **Tencent** doesn't exist*`);
            if (!roleAdmin) return await interaction.reply(`> *Role **Admin** doesn't exist*`);
            if (!rolePlama)
                return await interaction.reply(`> *Role **Player Manager** doesn't exist*`);
            if (!roleBroadcast)
                return await interaction.reply(`> *Role **Broadcast** doesn't exist*`);
            if (!roleCaster) return await interaction.reply(`> *Role **Caster** doesn't exist*`);
            if (!roleTeamOwner)
                return await interaction.reply(`> *Role **Team Owner** doesn't exist*`);
            if (!roleGuest) return await interaction.reply(`> *Role **Guest** doesn't exist*`);
            if (!roleEveryone)
                return await interaction.reply(`> *Role **everyone** doesn't exist*`);

            if (!channelLobby)
                return await interaction.reply(`> *Channel **lobby** doesn't exist*`);
            if (!channelRoleRequest)
                return await interaction.reply(`> *Channel **role-request** doesn't exist*`);
            if (!channelAnnouncement)
                return await interaction.reply(`> *Channel **📢┃announcements** doesn't exist*`);
            if (!channelRules)
                return await interaction.reply(`> *Channel **📝┃rules** doesn't exist*`);
            if (!staffArea)
                return await interaction.reply(`> *Category **🔒 Staff Area** doesn't exist*`);

            if (!/^[0-9a-fA-F]{6}$/.test(role_color))
                return await interaction.reply(
                    `> *Color (**${role_color}**) is not valid. Please use format: \`FFFFFF\` *`
                );

            interaction.deferReply();

            // create region role
            await interaction.guild.roles
                .create({
                    name: role_name,
                    color: role_color,
                    mentionable: true,
                    position: roleTeamOwner.position,
                })
                .then((role) => {
                    newRole = role;
                    messageRoles += `> ${role.toString()}\n`;
                })
                .catch(console.error);

            // create admin region role
            await interaction.guild.roles
                .create({
                    name: role_name + " Admin",
                    color: roleAdmin ? roleAdmin.color : "FFFFFF",
                    mentionable: true,
                    position: roleAdmin.position,
                })
                .then((role) => {
                    adminRole = role;
                    messageRoles += `> ${role.toString()}\n`;
                })
                .catch(console.error);

            // create player manager region role
            await interaction.guild.roles
                .create({
                    name: role_name + " Player Manager",
                    color: rolePlama ? rolePlama.color : "FFFFFF",
                    mentionable: true,
                    position: rolePlama.position,
                })
                .then((role) => {
                    plamaRole = role;
                    messageRoles += `> ${role.toString()}\n`;
                })
                .catch(console.error);

            // create caster region role
            await interaction.guild.roles
                .create({
                    name: role_name + " Caster/Talent",
                    color: roleCaster ? roleCaster.color : "FFFFFF",
                    mentionable: false,
                    position: roleCaster.position,
                })
                .then((role) => {
                    casterRole = role;
                    messageRoles += `> ${role.toString()}\n`;
                })
                .catch(console.error);

            // create teams region role
            await interaction.guild.roles
                .create({
                    name: role_name + " Teams",
                    mentionable: false,
                    position: roleGuest.position + 1,
                })
                .then((role) => {
                    teamsRole = role;
                    messageRoles += `> ${role.toString()}\n`;
                })
                .catch(console.error);

            //console.log(`Roles created - starting creating channels`)

            // Create a new category
            await interaction.guild.channels
                .create({
                    name: category_name,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        { id: roleTencent.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: newRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((cat) => {
                    newCat = cat;
                });

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "📢┃" + category_tag + "-announcement",
                    parent: newCat.id,
                    permissionOverwrites: [
                        { id: roleTencent.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        {
                            id: roleBroadcast.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: casterRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: newRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: roleGuest.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: teamsRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "🎲┃" + category_tag + "-matchinfo",
                    parent: newCat.id,
                    permissionOverwrites: [
                        { id: roleTencent.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleBroadcast.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        {
                            id: casterRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: newRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "🏅┃" + category_tag + "-results",
                    parent: newCat.id,
                    permissionOverwrites: [
                        { id: roleTencent.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleBroadcast.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        {
                            id: casterRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: newRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: roleGuest.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: teamsRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "🏁┃" + category_tag + "-matchstart",
                    parent: newCat.id,
                    permissionOverwrites: [
                        { id: roleTencent.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleBroadcast.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        {
                            id: casterRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: newRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: roleGuest.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: teamsRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "🎥┃" + category_tag + "-broadcast",
                    parent: newCat.id,
                    permissionOverwrites: [
                        { id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleBroadcast.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: casterRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "🎬┃" + category_tag + "-map-streams",
                    parent: newCat.id,
                    permissionOverwrites: [
                        { id: roleTencent.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleBroadcast.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        {
                            id: casterRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: newRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: roleGuest.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: teamsRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "➖┃____________",
                    parent: newCat.id,
                    permissionOverwrites: [
                        {
                            id: roleTencent.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: adminRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        {
                            id: newRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: teamsRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        { id: roleGuest.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "admin-" + category_tag,
                    parent: staffArea.id,
                    permissionOverwrites: [
                        { id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Create a new channel
            await interaction.guild.channels
                .create({
                    name: "plama-" + category_tag,
                    parent: staffArea.id,
                    permissionOverwrites: [
                        { id: plamaRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: roleEveryone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                })
                .then((chan) => {
                    messageChannels += `> ${chan.toString()}\n`;
                })
                .catch(console.error);

            // Update permissions on existing channels

            const NO_ACCESS = { ViewChannel: false, SendMessages: null };
            const READ_ONLY = { ViewChannel: true, SendMessages: false };

            await channelLobby.permissionOverwrites.edit(newRole.id, NO_ACCESS);
            await channelRoleRequest.permissionOverwrites.edit(newRole.id, NO_ACCESS);
            await channelAnnouncement.permissionOverwrites.edit(newRole.id, READ_ONLY);
            await channelRules.permissionOverwrites.edit(newRole.id, READ_ONLY);

            await interaction.followUp(
                `**New roles created:**\n${messageRoles}\n**New category \`${newCat.name}\` created and channels:**\n${messageChannels}`
            );
        } else if (interaction.options.getSubcommand() === "create_roles_and_channels") {
            let color = interaction.options.getString("color").trim();
            const category = interaction.options.getChannel("category");
            const tag = interaction.options.getString("tag").trim();
            const roles = interaction.options.getString("roles").trim();
            const admin_role = interaction.options.getRole("admin_role");
            const plama_role = interaction.options.getRole("plama_role");
            const team_role = interaction.options.getRole("team_role");
            const separator = interaction.options.getString("separator") ?? ",";
            const is_voice = interaction.options.getBoolean("is_voice") ?? false;
            const voice_and_text = interaction.options.getBoolean("voice_and_text") ?? false;
            const skip_creating_channels =
                interaction.options.getBoolean("skip_creating_channels") ?? false;

            if (!/^([0-9a-fA-F]{6})|(\<\@\&[0-9]+\>)$/.test(color))
                return await interaction.reply(
                    `> *Color (**\`${color}\`**) is not valid. Please use format: \`FFFFFF\` or mention role *`
                );

            if (color.startsWith("<@&") && color.endsWith(">")) {
                color = color.slice(3, -1);

                let roleData = interaction.guild.roles.cache.get(color);

                if (roleData) {
                    color = roleData.color;
                }
            }

            let promises = [];

            const rolesSplitted = roles.split(separator);
            const roleEveryone = interaction.guild.roles.cache.find((r) => r.name === "@everyone");

            await rolesSplitted.forEach((roleName) => {
                roleName = roleName.trim();

                // create region role
                promises.push(
                    interaction.guild.roles
                        .create({
                            name: `${tag} - ${roleName}`,
                            color: color,
                            mentionable: true,
                        })
                        .then((role) => {
                            if (skip_creating_channels === false) {
                                if (is_voice === true) {
                                    interaction.guild.channels
                                        .create({
                                            name: `${tag} - ${roleName}`,
                                            type: ChannelType.GuildVoice,
                                            parent: category.id,
                                            permissionOverwrites: [
                                                {
                                                    id: role.id,
                                                    allow: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                        PermissionsBitField.Flags.Speak,
                                                        PermissionsBitField.Flags.Stream,
                                                    ],
                                                },
                                                {
                                                    id: admin_role.id,
                                                    allow: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                        PermissionsBitField.Flags.Speak,
                                                        PermissionsBitField.Flags.Stream,
                                                    ],
                                                },
                                                {
                                                    id: plama_role.id,
                                                    allow: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                        PermissionsBitField.Flags.Speak,
                                                        PermissionsBitField.Flags.Stream,
                                                    ],
                                                },
                                                {
                                                    id: team_role.id,
                                                    allow: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                        PermissionsBitField.Flags.Speak,
                                                        PermissionsBitField.Flags.Stream,
                                                    ],
                                                },
                                                {
                                                    id: roleEveryone.id,
                                                    deny: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                    ],
                                                },
                                            ],
                                        })
                                        .catch(console.error);
                                }
                                if (voice_and_text === true) {
                                    interaction.guild.channels
                                        .create({
                                            name: `${tag} - ${roleName}`,
                                            type: ChannelType.GuildVoice,
                                            parent: category.id,
                                            permissionOverwrites: [
                                                {
                                                    id: role.id,
                                                    allow: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                        PermissionsBitField.Flags.Speak,
                                                        PermissionsBitField.Flags.Stream,
                                                    ],
                                                },
                                                {
                                                    id: admin_role.id,
                                                    allow: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                        PermissionsBitField.Flags.Speak,
                                                        PermissionsBitField.Flags.Stream,
                                                    ],
                                                },
                                                {
                                                    id: plama_role.id,
                                                    allow: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                        PermissionsBitField.Flags.Speak,
                                                        PermissionsBitField.Flags.Stream,
                                                    ],
                                                },
                                                {
                                                    id: team_role.id,
                                                    allow: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                        PermissionsBitField.Flags.Speak,
                                                        PermissionsBitField.Flags.Stream,
                                                    ],
                                                },
                                                {
                                                    id: roleEveryone.id,
                                                    deny: [
                                                        PermissionsBitField.Flags.ViewChannel,
                                                        PermissionsBitField.Flags.Connect,
                                                    ],
                                                },
                                            ],
                                        })
                                        .catch(console.error);

                                    interaction.guild.channels
                                        .create({
                                            name: `${tag} - ${roleName}`,
                                            parent: category.id,
                                            permissionOverwrites: [
                                                {
                                                    id: role.id,
                                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                                {
                                                    id: admin_role.id,
                                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                                {
                                                    id: plama_role.id,
                                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                                {
                                                    id: team_role.id,
                                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                                {
                                                    id: roleEveryone.id,
                                                    deny: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                            ],
                                        })
                                        .catch(console.error);
                                } else {
                                    interaction.guild.channels
                                        .create({
                                            name: `${tag} - ${roleName}`,
                                            parent: category.id,
                                            permissionOverwrites: [
                                                {
                                                    id: role.id,
                                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                                {
                                                    id: admin_role.id,
                                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                                {
                                                    id: plama_role.id,
                                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                                {
                                                    id: team_role.id,
                                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                                {
                                                    id: roleEveryone.id,
                                                    deny: [PermissionsBitField.Flags.ViewChannel],
                                                },
                                            ],
                                        })
                                        .catch(console.error);
                                }
                            }
                        })
                        .catch(console.error)
                );
            });

            await interaction.deferReply();

            await Promise.all(promises);

            if (skip_creating_channels === true) {
                await interaction.followUp(`> *Roles created...*`);
            } else {
                await interaction.followUp(`> *Roles and channels created...*`);
            }
        } else if (interaction.options.getSubcommand() === "remove_roles_and_channels") {
            return await interaction.reply({
                content: `> *Not ready yet. Sorry...*`,
                ephemeral: true,
            });

            const roles = interaction.options.getString("roles").trim();
            const tag = interaction.options.getString("tag").trim();
            const separator = interaction.options.getString("separator") ?? ",";
            const is_voice = interaction.options.getBoolean("is_voice") ?? false;
        } else if (interaction.options.getSubcommand() === "check") {
            const team_names = interaction.options.getString("team_names").trim();
            const tag = interaction.options.getString("tag") ?? null;
            const separator = interaction.options.getString("separator") ?? ",";
            const is_voice = interaction.options.getBoolean("is_voice") ?? false;

            const teamNamesSplitted = team_names.split(separator);

            let status = true;
            let message = "*Some roles and/or channels doesn't exist:*";

            await interaction.deferReply();

            teamNamesSplitted.forEach((name) => {
                let fullName = `${tag ? tag.trim() + " - " : ""}${name}`;
                let channelName =
                    is_voice === true ? fullName : module.exports.prepChannelName(fullName);

                let channel = interaction.guild.channels.cache.find((c) => c.name === channelName);
                let role = interaction.guild.roles.cache.find((r) => r.name === fullName);

                if (!channel || !role) {
                    message += `\n> `;
                }

                if (!channel) {
                    message += `Channel **#${channelName}** doesn't exist \t`;
                    status = false;
                }
                if (!role) {
                    message += `Role **@${fullName}** doesn't exist`;
                    status = false;
                }

                if (message.length > 1800) {
                    interaction.followUp(`${message}`);
                    message = "*Some roles and/or channels doesn't exist:*";
                }
            });

            if (status === true) {
                await interaction.followUp(`> *Every role and channel is correct!*`);
            } else {
                await interaction.followUp(`${message}`);
            }
        }
    },
    prepChannelName(name) {
        name = name.toLowerCase();
        name = name.replace(/[~!@#\$%\^&*\(\)|+=?;:",<>\{\}\[\]\\\/]/g, "-");
        name = name.replace(/['`\.]/g, "");
        name = name.replace(/ /g, "-");
        name = name.replace("---", "-");
        name = name.replace("--", "-");
        name = name.replace("--", "-");
        name = name.replace("--", "-");
        name = name.replace(/-$/, "");

        return name;
    },
};
