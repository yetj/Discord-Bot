const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("channeltimer")
        .setDescription("Set voice channel with Date and Time")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await module.exports.reloadDatabase(interaction.client);

        setTimeout(() => {
            module.exports.updateDate(interaction.client);
        }, 1000 * 10);
        setTimeout(() => {
            module.exports.updateTime(interaction.client);
        }, 1000 * 5);

        await interaction.reply({ content: `Reloaded!`, ephemeral: true });
    },
    async autoload(client) {
        try {
            client.channel_timer = [];
            client.db.query("SELECT * FROM channel_timer", (err, result, fields) => {
                if (err) {
                    console.error(err);
                }

                client.channel_timer = JSON.parse(JSON.stringify(result));
            });
            setTimeout(() => {
                setInterval(() => {
                    module.exports.updateTime(client);
                }, 1000 * 30);
                setInterval(() => {
                    module.exports.updateDate(client);
                }, 1000 * 60 * 10);
            }, 1000 * 5);
        } catch (e) {
            console.error(e);
        }
    },
    async reloadDatabase(client) {
        try {
            client.channel_timer = [];
            await client.db.query("SELECT * FROM channel_timer", (err, result, fields) => {
                if (err) {
                    console.error(err);
                }

                client.channel_timer = JSON.parse(JSON.stringify(result));
            });
        } catch (e) {
            console.error(e);
        }
    },
    async updateTime(client) {
        const timeData = client.channel_timer.filter((data) => {
            return data.type == "time";
        });

        timeData.forEach(async (data) => {
            const server = await client.guilds.cache.get(data.gid);

            if (server) {
                const channel = await server.channels.cache.find((c) => c.id === data.channel_id);

                if (channel) {
                    const now = new Date();
                    const hour = String(now.getUTCHours()).padStart(2, "0");
                    const minute = String(now.getUTCMinutes()).padStart(2, "0");

                    const prepName = `⏰ ${hour}:${minute} UTC`;

                    if (channel.name != prepName) {
                        await channel.setName(prepName);
                    } else {
                        console.log(`> TIME - The same name, no need to update`);
                    }
                } else {
                    console.log(
                        `> Channel not found: ${data.channel_id} on server ${data.channel_id}`
                    );

                    client.db.query(
                        `DELETE FROM channel_timer WHERE channel_id = '${data.channel_id}'`,
                        (err, result) => {
                            if (err) {
                                console.error(err);
                            }
                            console.log(
                                `Removed channel with ID: #${data.channel_id} on server #${data.gid}`
                            );
                        }
                    );
                }
            } else {
                console.log(`> Server not found: ${data.gid}`);

                /*
                client.db.query(
                    `DELETE FROM channel_timer WHERE gid = '${data.gid}'`,
                    (err, result) => {
                        if (err) {
                            console.error(err);
                        }
                        console.log(`> Removed server with ID: #${data.gid}`);
                    }
                );
                */
            }
        });
    },
    async updateDate(client) {
        const dateData = client.channel_timer.filter((data) => {
            return data.type == "date";
        });

        dateData.forEach(async (data) => {
            const server = await client.guilds.cache.get(data.gid);

            if (server) {
                const channel = await server.channels.cache.find((c) => c.id === data.channel_id);

                if (channel) {
                    const now = new Date();
                    const weekdayOptions = { weekday: "long" };
                    const dayName = now.toLocaleDateString("en-US", weekdayOptions);
                    const monthOptions = { month: "short" };
                    const monthName = now.toLocaleDateString("en-US", monthOptions);

                    const day = now.getUTCDate();

                    let suffix = "";

                    if (day >= 11 && day <= 13) {
                        suffix = "th";
                    } else {
                        const lastDigit = day % 10;
                        switch (lastDigit) {
                            case 1:
                                suffix = "st";
                                break;
                            case 2:
                                suffix = "nd";
                                break;
                            case 3:
                                suffix = "rd";
                                break;
                            default:
                                suffix = "th";
                        }
                    }

                    const prepName = `📅 ${dayName}, ${monthName} ${day}${suffix}`;

                    if (channel.name != prepName) {
                        await channel.setName(prepName);
                    } else {
                        console.log(`> DATE - The same name, no need to update`);
                    }
                } else {
                    console.log(
                        `> Channel not found: ${data.channel_id} on server ${data.channel_id}`
                    );

                    client.db.query(
                        `DELETE FROM channel_timer WHERE channel_id = '${data.channel_id}'`,
                        (err, result) => {
                            if (err) {
                                console.error(err);
                            }
                            console.log(
                                `Removed channel with ID: #${data.channel_id} on server #${data.gid}`
                            );
                        }
                    );
                }
            } else {
                console.log(`> Server not found: ${data.gid}`);

                /*
                client.db.query(
                    `DELETE FROM channel_timer WHERE gid = '${data.gid}'`,
                    (err, result) => {
                        if (err) {
                            console.error(err);
                        }
                        console.log(`> Removed server with ID: #${data.gid}`);
                    }
                );
                */
            }
        });
    },
};
