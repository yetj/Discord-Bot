const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rename")
        .setDescription("Rename the team name - role and channel")
        .addRoleOption((option) =>
            option.setName("role").setDescription("Select role to change name").setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("new_name")
                .setDescription("New team name with region TAG")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("Select what to rename")
                .setRequired(true)
                .addChoices(
                    { value: "role_text", name: "Role and Text channel" },
                    { value: "all", name: "All - Role, Text and Voice channel" },
                    { value: "role_voice", name: "Role and Voice channel" },
                    { value: "only_role", name: "Only Role" }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        const role = interaction.options.getRole("role");
        const new_name = interaction.options.getString("new_name").trim();
        const type = interaction.options.getString("type");

        let response = "";

        const roleName = role.name;
        const textChannelName = module.exports.prepChannelName(role.name);
        const voiceChannelName = role.name;

        const roleHandle = interaction.guild.roles.cache.find((r) => r.id == role.id);
        const textChannel = interaction.guild.channels.cache.find((c) => c.name == textChannelName);
        const voiceChannel = interaction.guild.channels.cache.find(
            (c) => c.name == voiceChannelName
        );

        if (!roleHandle) {
            return await interaction.reply(`> *Role **${roleName}** doesn't exist!*`);
        }

        if ((type == "role_text" || type == "all") && !textChannel) {
            return await interaction.reply(
                `> *Text channel **${textChannelName}** doesn't exist!*`
            );
        }

        if ((type == "role_voice" || type == "all") && !voiceChannel) {
            return await interaction.reply(
                `> *Voice channel **${voiceChannelName}** doesn't exist!*`
            );
        }

        await roleHandle.setName(new_name);

        response += `> Role: **${roleName}** -> **${new_name}** - ${roleHandle}`;

        if ((type == "role_text" || type == "all") && textChannel) {
            response += `\n> Text channel: **#${textChannelName}** -> ${textChannel}`;

            await textChannel.setName(new_name);

            const embed = new EmbedBuilder()
                .setColor(0x01acfb)
                .setTitle("Your team name has been changed!")
                .setDescription(`Old name: **${roleName}**\nNew name: **${new_name}**`);

            textChannel.send({ embeds: [embed] }).then((mess) => {
                mess.pin();
            });
        }

        if ((type == "role_voice" || type == "all") && textChannel) {
            response += `\n> Voice channel: **#${voiceChannelName}** -> ${voiceChannel}`;

            await voiceChannel.setName(new_name);
        }

        await interaction.reply(`> *Done!*\n${response}`);

        const logChannel = interaction.guild.channels.cache.find((c) => c.name === "🔅-bot-log");

        if (logChannel) {
            logChannel.send(`> *Renaming*\n${response}`);
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
