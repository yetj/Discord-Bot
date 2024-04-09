const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sort")
        .setDescription("Sort channels in category")
        .addChannelOption((option) =>
            option
                .setName("category")
                .setDescription("Select category which needs to be sorted")
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("skip1")
                .setDescription("Skip sorting channels with this character")
                .addChoices({ name: "┃", value: "┃" }, { name: "-", value: "-" })
        )
        .addStringOption((option) =>
            option
                .setName("skip2")
                .setDescription("Skip sorting channels with this character")
                .setMinLength(1)
        )
        .addIntegerOption((option) =>
            option
                .setName("starting_position")
                .setDescription(
                    "Starting position of sorting, if not set will start after skipped channel "
                )
                .setMinValue(0)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const category = interaction.options.getChannel("category");
        const skip1 = interaction.options.getString("skip1");
        const skip2 = interaction.options.getString("skip2");
        let startingPosition = interaction.options.getString("starting_position");

        let specialChannels = 0;

        await interaction.deferReply();

        const perms_to_manage_channels = category
            .permissionsFor(interaction.client.user.id)
            .has([PermissionFlagsBits.ManageChannels]);

        if (!perms_to_manage_channels) {
            return await interaction.editReply(
                `> *Bot doesn't have permissions to manage channels in category: **${category.name}**.*`
            );
        }

        await interaction.guild.channels.fetch();

        const channels = await interaction.guild.channels.cache.filter(
            (c) => c.parentId === category.id
        );

        let channelNames = [];

        let promises = [];

        for (const [index, channel] of channels) {
            if (
                (skip1 && channel.name.includes(skip1)) ||
                (skip2 && channel.name.includes(skip2))
            ) {
                specialChannels++;
            } else {
                channelNames.push(channel.name);
            }
        }

        channelNames.sort();

        if (!startingPosition) {
            startingPosition = specialChannels;
        }

        for (let i = 0; i < channelNames.length; i++) {
            const ch = interaction.guild.channels.cache.find(
                (c) => c.name === channelNames[i] && c.parentId === category.id
            );
            if (ch) {
                promises.push(await ch.edit({ position: startingPosition }));

                startingPosition++;
            }
        }

        await Promise.all(promises);

        interaction.followUp({ content: `> *Sorting channels in **${category.name}** is done!*` });
    },
};
