const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    AttachmentBuilder,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Schedule message to be posted on the channel at the specific time.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Schedule message to post it on specific channel")
                .addStringOption((option) =>
                    option
                        .setName("date")
                        .setDescription("Use the following format: YYYY/MM/DD HH:MM UTC+X")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("title")
                        .setDescription("Title of the message (this is not send in message)")
                        .setRequired(true)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Select channel to post message")
                        //.addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addBooleanOption((option) =>
                    option.setName("pin").setDescription("Pin the posted message?")
                )
                .addBooleanOption((option) =>
                    option.setName("embed").setDescription("Post message as embed?")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("list").setDescription("List all scheduled messages")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show scheduled message")
                .addNumberOption((option) =>
                    option
                        .setName("id")
                        .setDescription("ID of the scheduled message")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Remove scheduled message")
                .addNumberOption((option) =>
                    option
                        .setName("id")
                        .setDescription("ID of the scheduled message")
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        //return await interaction.reply(`> *Coming soon!*`);

        if (interaction.options.getSubcommand() === "add") {
            let date = interaction.options.getString("date");
            const title = interaction.options.getString("title").trim();
            const channel = interaction.options.getChannel("channel");
            const pin = interaction.options.getBoolean("pin") ? 1 : 0;
            const embed = interaction.options.getBoolean("embed") ? 1 : 0;

            if (
                !date.match(
                    /^(?:(?:19|20)\d{2})\/(?:(?:0[1-9])|(?:1[0-2]))\/(?:(?:0[1-9])|(?:1\d)|(?:2\d)|(?:3[0-1]))\s(?:[01]\d|2[0-3]):(?:[0-5]\d)\s(?:GMT|UTC)(?:[+-]\d{1,2})?$/
                )
            ) {
                return await interaction.reply(
                    `> *Date is in wrong format, please use the following format:*\n> **YYYY/MM/DD HH:MM UTC+X**\n> Example: *2023/04/24 16:32 UTC+2*`
                );
            }

            try {
                date = Date.parse(date) / 1000;
            } catch (err) {
                console.error(err);
                return await interaction.reply(
                    `> *Couldn't parse date!*\n> ERROR: \`${err.message}\``
                );
            }

            if (date < Math.floor(new Date().getTime() / 1000)) {
                return await interaction.reply(
                    `> The selected date has already passed. Please select date in the future.`
                );
            }

            await interaction.reply({
                content: `> *Post your message which you want to schedule...*\n> **NOTE:** Attachements are not supported yet!`,
            });

            const filter = (m) => m.author.id === interaction.user.id;

            interaction.channel
                .awaitMessages({ filter, max: 1, time: 300000, errors: ["time"] })
                .then(async (collected) => {
                    const message = await collected.first().content;

                    if (message.length < 5) {
                        return await interaction.followUp(`> *Your message is too short...*`);
                    }

                    await interaction.client.db.query(
                        `INSERT INTO scheduled_messages(gid, author_id, author_name, date, channel_id, title, message, pin, embed) 
                    VALUES ('${interaction.guildId}', '${interaction.user.id}', '${interaction.user.username}#${interaction.user.discriminator}', '${date}', '${channel.id}', '${title}', '${message}', '${pin}', '${embed}')`,
                        async (err, result) => {
                            if (err) {
                                console.error(err);
                                return await interaction.followUp({
                                    content: `Something went wrong, try again...`,
                                });
                            } else {
                                const embedBuilder = new EmbedBuilder()
                                    .setColor("#009900")
                                    .setTitle("New scheduled message added to the database")
                                    .setDescription(`ID: **${result.insertId}**
                                    **Scheduled date:** ${new Date(date * 1000).toLocaleString()}
                                    **Title:** ${title}
                                    **Channel:** ${channel}
                                    **Pin:** ${pin ? "True" : "False"}
                                    **Embed:** ${embed ? "True" : "False"}
                                `);

                                await interaction.followUp({
                                    embeds: [embedBuilder],
                                });

                                interaction.client.db.query(
                                    "SELECT * FROM scheduled_messages WHERE posted = 0",
                                    (err, result, fields) => {
                                        if (err) {
                                            console.error(err);
                                        }

                                        interaction.client.scheduled_messages = JSON.parse(
                                            JSON.stringify(result)
                                        );
                                    }
                                );
                            }
                        }
                    );
                });
        } else if (interaction.options.getSubcommand() === "list") {
            const msgs = interaction.client.scheduled_messages.filter(
                (l) => l.gid == interaction.guildId && l.posted == 0
            );

            let message = "";

            if (!msgs || msgs.length < 1) {
                return await interaction.reply(`> *No scheduled messages for this server*`);
            }

            msgs.forEach((log) => {
                if (message.length > 0) {
                    message += `\n-----\n`;
                }

                let mdate = "";
                if (log.date > 0) {
                    let tmp = new Date(log.date * 1000);
                    mdate = `${tmp.getFullYear()}/${
                        tmp.getMonth() + 1
                    }/${tmp.getDate()} ${tmp.getHours()}:${tmp.getMinutes()}`;
                } else {
                    mdate = `-`;
                }

                message += `> **ID:** #${log.id}\n> **Author:** <@${log.author_id}> *(${
                    log.author_name
                })*\n> **Scheduled date:** ${new Date(
                    log.date * 1000
                ).toLocaleString()}\n> **Title:** ${log.title}\n> **Channel:** <#${
                    log.channel_id
                }>\n> **Pin:** ${log.pin ? "True" : "False"}\n> **Embed:** ${
                    log.embed ? "True" : "False"
                }`;
            });

            const embedMessage = new EmbedBuilder()
                .setColor("#000099")
                .setDescription(`${message}`);

            await interaction.reply({ embeds: [embedMessage] });
        } else if (interaction.options.getSubcommand() === "show") {
            const id = interaction.options.getNumber("id");

            const scheduled_message = interaction.client.scheduled_messages.find(
                (sm) => sm.gid == interaction.guildId && sm.id == id
            );

            if (!scheduled_message) {
                return await interaction.reply(`> *No scheduled messages with this ID*`);
            }

            const message = `> **ID:** #${scheduled_message.id}\n> **Author:** <@${
                scheduled_message.author_id
            }> *(${scheduled_message.author_name})*\n> **Scheduled date:** ${new Date(
                scheduled_message.date * 1000
            ).toLocaleString()}\n> **Title:** ${scheduled_message.title}\n> **Channel:** <#${
                scheduled_message.channel_id
            }>\n> **Pin:** ${scheduled_message.pin ? "True" : "False"}\n> **Embed:** ${
                scheduled_message.embed ? "True" : "False"
            }`;

            let embedMessage = new EmbedBuilder().setColor("#000099").setDescription(`${message}`);

            await interaction.reply({ embeds: [embedMessage] });

            if (scheduled_message.embed == 1) {
                embedMessage = new EmbedBuilder()
                    .setColor("#000099")
                    .setDescription(`${scheduled_message.message}`);

                interaction.followUp({ embeds: [embedMessage] });
            } else {
                interaction.followUp({ content: `${scheduled_message.message}` });
            }
        } else if (interaction.options.getSubcommand() === "remove") {
            const id = interaction.options.getNumber("id");

            const found = interaction.client.scheduled_messages.find(
                (el) => el.id == id && el.posted == 0
            );

            if (!found) {
                return await interaction.reply(`> *No scheduled messages with this ID*`);
            }

            await interaction.client.db.query(
                `UPDATE scheduled_messages SET posted = '2' WHERE id = '${id}'`,
                (err, result) => {
                    if (err) {
                        console.error(err);
                    }

                    interaction.client.db.query(
                        "SELECT * FROM scheduled_messages WHERE posted = 0",
                        (err, result, fields) => {
                            if (err) {
                                console.error(err);
                            }

                            interaction.client.scheduled_messages = JSON.parse(
                                JSON.stringify(result)
                            );
                        }
                    );
                }
            );

            await interaction.reply(
                `> Scheduled message **#${found.id}** with title **${found.title}** removed!`
            );
        }
    },
    async autoload(client) {
        try {
            client.scheduled_messages = [];
            client.scheduled_messages_test = 0;
            client.db.query(
                "SELECT * FROM scheduled_messages WHERE posted = 0",
                (err, result, fields) => {
                    if (err) {
                        console.error(err);
                    }

                    client.scheduled_messages = JSON.parse(JSON.stringify(result));
                }
            );
            setInterval(async () => {
                module.exports.autoPost(client);
            }, 1000 * 30);
        } catch (e) {
            console.error(e);
        }
    },
    async autoPost(client) {
        const filtered = client.scheduled_messages.filter((msg) => {
            return msg.posted === 0 && msg.date < Math.floor(new Date().getTime() / 1000);
        });

        filtered.forEach(async (msg) => {
            const server = await client.guilds.cache.get(msg.gid);
            if (server) {
                const channel = await server.channels.cache.find((c) => c.id === msg.channel_id);

                if (channel) {
                    try {
                        if (msg.embed == 1) {
                            const embedMessage = new EmbedBuilder()
                                .setColor("#000099")
                                .setDescription(`${msg.message}`);

                            channel.send({ embeds: [embedMessage] }).then((mess) => {
                                if (msg.pin === 1) {
                                    mess.pin();
                                }
                            });
                        } else {
                            channel.send(`${msg.message}`).then((mess) => {
                                if (msg.pin === 1) {
                                    mess.pin();
                                }
                            });
                        }

                        msg.posted = 1;

                        client.db.query(
                            `UPDATE scheduled_messages SET posted = 1 WHERE id = ${msg.id}`,
                            (err, result, fields) => {
                                if (err) {
                                    console.error(err);
                                }

                                client.db.query(
                                    "SELECT * FROM scheduled_messages WHERE posted = 0",
                                    (err, result, fields) => {
                                        if (err) {
                                            console.error(err);
                                        }

                                        client.scheduled_messages = JSON.parse(
                                            JSON.stringify(result)
                                        );
                                    }
                                );
                            }
                        );
                    } catch (err) {
                        console.log(`Something went wrong: :( `);
                        console.log(err);
                    }
                } else {
                    console.log(`> Channel not found: ${msg.channel_id}`);
                }
            } else {
                console.log(`> Server not found: ${msg.gid}`);
            }
        });
    },
};
