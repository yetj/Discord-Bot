const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ThreadChannel,
    Events,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("udvote")
        .setDescription("Up/Down vote for posts")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add channel/forum to follow")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Select channel/forum to follow")
                        .addChannelTypes(ChannelType.GuildForum, ChannelType.GuildText)
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName("min_positive")
                        .setDescription("Minimum number of positive reactions to highlight")
                        .setMinValue(2)
                        .setRequired(true)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel_log")
                        .setDescription("Channel to post highlighted posts")
                        .addChannelTypes(
                            ChannelType.GuildText,
                            ChannelType.PublicThread,
                            ChannelType.PrivateThread
                        )
                        .setRequired(true)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("count_difference")
                        .setDescription(
                            "Count only difference between down and up votes for minimum positive reactions before highlighting"
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Remove following of channel/forum")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Select channel/forum to follow")
                        .addChannelTypes(ChannelType.GuildForum, ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("list").setDescription("List added UDvotes for this current server")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("arch")
                .setDescription("Remove following of channel/forum")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Select channel/forum to follow")
                        .addChannelTypes(ChannelType.GuildForum, ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        try {
            if (interaction.options.getSubcommand() === "add") {
                const channel = interaction.options.getChannel("channel");
                const min_positive = interaction.options.getInteger("min_positive");
                const channel_log = interaction.options.getChannel("channel_log");
                const count_difference =
                    interaction.options.getBoolean("count_difference") || false;

                const perms_to_add_reactions = channel
                    .permissionsFor(interaction.client.user.id)
                    .has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.AddReactions]);

                if (!perms_to_add_reactions) {
                    return await interaction.reply(
                        `Bot doesn't have permissions to add rections on the channel ${channel}.`
                    );
                }

                const perms_to_post_messages = channel_log
                    .permissionsFor(interaction.client.user.id)
                    .has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]);

                if (!perms_to_post_messages) {
                    return await interaction.reply(
                        `Bot doesn't have permissions to post messages on the channel ${channel_log}.`
                    );
                }

                const existing_entry = interaction.client.udvote.filter(
                    (el) => el.guild_id == interaction.guildId && el.channel_id == channel.id
                );
                if (existing_entry.length) {
                    return await interaction.reply({
                        content: `> *UDvote is already setup for this channel.\n> If you want to update it, remove the old entry and add new one.*`,
                    });
                }

                const count_difference_db = count_difference === true ? 1 : 0;

                await interaction.client.db.query(
                    `INSERT INTO udvote(guild_id, channel_id, min_positive, channel_log_id, count_difference, created_by, added) 
                VALUES ('${interaction.guildId}', '${channel.id}', '${min_positive}', '${
                        channel_log.id
                    }', ${count_difference_db}, '${interaction.member.id}', '${Date.now()}')`,
                    async (err, result) => {
                        if (err) {
                            console.error(err);
                            return await interaction.reply({
                                content: `[f3f2d] ERROR: Something went wrong, try again...`,
                            });
                        } else {
                            const embed = new EmbedBuilder()
                                .setColor("#009900")
                                .setTitle("New UDvote entry added to the database")
                                .setDescription(`Channel to watch: **${channel}**
                                Miminimum positive votes to highlight the post: **${min_positive}**
                                Channel to post highlights: **${channel_log}**
                                Count difference of up/down votes: **${count_difference}**
                            `);

                            await interaction.reply({ embeds: [embed] });

                            interaction.client.db.query(
                                "SELECT * FROM udvote",
                                (err, result, fields) => {
                                    if (err) {
                                        console.error(err);
                                    }
                                    interaction.client.udvote = JSON.parse(JSON.stringify(result));
                                }
                            );
                        }
                    }
                );
            } else if (interaction.options.getSubcommand() === "remove") {
                const channel = interaction.options.getChannel("channel");

                const existing_entry = interaction.client.udvote.find(
                    (el) => el.guild_id == interaction.guildId && el.channel_id == channel.id
                );
                if (!existing_entry) {
                    return await interaction.reply({
                        content: `> *UDvote is not set for this channel.*`,
                    });
                }

                interaction.client.db.query(
                    `DELETE FROM udvote WHERE id = '${existing_entry.id}'`,
                    (err, result) => {
                        if (err) {
                            console.error(err);
                        }
                        interaction.reply({ content: `> UDvote removed from channel ${channel}` });

                        interaction.client.db.query(
                            "SELECT * FROM udvote",
                            (err, result, fields) => {
                                if (err) {
                                    console.error(err);
                                }
                                interaction.client.udvote = JSON.parse(JSON.stringify(result));
                            }
                        );
                    }
                );
            } else if (interaction.options.getSubcommand() === "list") {
                const entries = interaction.client.udvote.filter(
                    (el) => el.guild_id == interaction.guildId
                );

                if (!entries.length) {
                    return await interaction.reply({
                        content: `> This server doesn't have any UDvotes setup yet...`,
                    });
                }

                var fields = [];

                await entries.forEach((el) => {
                    const channel_id = el.channel_id;
                    const min_positive = el.min_positive;
                    const count_difference = el.count_difference == 1 ? true : false;
                    const channel_log_id = el.channel_log_id;

                    const channel = interaction.guild.channels.cache.find(
                        (c) => c.id === channel_id
                    );
                    const channel_log = interaction.guild.channels.cache.find(
                        (c) => c.id === channel_log_id
                    );

                    if (channel && channel_log) {
                        fields.push({
                            name: `Observing channel: ${channel}`,
                            value: `Miminimum positive votes to highlight the post: **${min_positive}**
                            Channel to post highlights: ${channel_log}
                            Count difference of up/down votes: **${count_difference}**`,
                        });
                    }
                });

                if (fields.length) {
                    const embed = new EmbedBuilder()
                        .setColor("#2222cc")
                        .setTitle("UDvote list for this server")
                        .addFields(fields);

                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.reply({
                        content: `> This server doesn't have any UDvotes setup...`,
                    });
                }
            } else if (interaction.options.getSubcommand() === "arch") {
                const channel = interaction.options.getChannel("channel");

                //const channel = interaction.client.channels.cache.get("<my-channel-id>");
                let messages = [];

                // Create message pointer
                let message = await channel.messages
                    .fetch({ limit: 1 })
                    .then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

                while (message) {
                    await channel.messages
                        .fetch({ limit: 100, before: message.id })
                        .then((messagePage) => {
                            messagePage.forEach((msg) => messages.push(msg));

                            // Update our message pointer to be the last message on the page of messages
                            message =
                                0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
                        });
                }

                console.log(messages); // Print all messages
            } else {
                await interaction.reply({
                    content: `> Command doesn't exist`,
                    ephemeral: true,
                });
            }
        } catch (e) {
            console.error(`[gve3fd] ERROR: ${e.message}`);
        }
    },
    async autoload(client) {
        try {
            client.udvote = [];
            client.db.query("SELECT * FROM udvote", (err, result, fields) => {
                if (err) {
                    console.error(err);
                    return;
                }
                client.udvote = JSON.parse(JSON.stringify(result));
                //console.log(client.udvote);
            });
        } catch (e) {
            console.error(e);
            return;
        }

        try {
            client.on(Events.MessageCreate, async (message) => {
                if (message.author.bot == true) return;

                let messChannelId = message?.channelId;

                const channel = message.guild.channels.cache.find((c) => c.id === messChannelId);

                if (channel instanceof ThreadChannel) {
                    messChannelId = channel.parentId;
                }

                const entry = client.udvote.find((el) => el.channel_id == messChannelId);

                if (entry) {
                    await message.react("⬆️");
                    await message.react("⬇️");
                }
            });
            client.on(Events.MessageReactionAdd, async (messageReaction, user) => {
                if (user.bot == true) return;

                let channelId = messageReaction.message.channelId;

                const channelHandle = await client.channels.fetch(channelId);
                let threadCategoryHandle = null;

                if (channelHandle instanceof ThreadChannel) {
                    channelId = channelHandle.parentId;
                    threadCategoryHandle = await client.channels.fetch(channelId);
                }

                const entry = client.udvote.find((el) => el.channel_id == channelId);

                if (!entry) return;

                const message = await channelHandle.messages.fetch(messageReaction.message.id, {
                    force: true,
                });

                const reactions = message.reactions.cache;

                const upVote = reactions.find((r) => r.emoji.name == "⬆️")?.count || 1;
                const downVote = reactions.find((r) => r.emoji.name == "⬇️")?.count || 1;

                const count_difference = entry.count_difference == 1 ? true : false;
                const min_positive = entry.min_positive;

                if (
                    (!count_difference && upVote >= min_positive) ||
                    (count_difference && upVote - downVote >= min_positive)
                ) {
                    //console.log(message);
                    if (channelHandle instanceof ThreadChannel) {
                        //console.log(threadCategoryHandle);
                        console.log(`-------------`);
                        console.log(channelHandle.messages);
                        console.log(`-------------`);
                        //console.log(message);
                    }
                }
            });
            client.on(Events.MessageReactionRemove, async (messageReaction, user) => {
                if (user.bot == true) return;
                console.log(`------------- messageReactionRemove -------------`);
                console.log(messageReaction);
                console.log(`-------------`);
                console.log(user);
                console.log(`------------- messageReactionRemove END -------------`);
            });
            client.on(Events.MessageReactionRemoveAll, async (messageReaction, reactions) => {
                console.log(`------------- messageReactionRemoveAll -------------`);
                console.log(messageReaction);
                console.log(`-------------`);
                console.log(reactions);
                console.log(`------------- messageReactionRemoveAll END -------------`);
            });
        } catch (e) {
            console.error(e);
        }
    },
};
