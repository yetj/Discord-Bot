const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("phrases")
        .setDescription("Predefined phrases")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Create new phrase")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("Short name of the phrase")
                        .setMinLength(1)
                        .setMaxLength(31)
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("description")
                        .setDescription("Description of the phrase")
                        .setMinLength(5)
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("content")
                        .setDescription("Message to be posted on channel when timer ends")
                        .setMinLength(5)
                        .setRequired(true)
                )
                .addBooleanOption((option) =>
                    option.setName("embed").setDescription("Post message as embed?")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription("Remove phrase")
                .addIntegerOption((option) =>
                    option.setName("id").setDescription("ID of the phrase")
                )
                .addStringOption((option) =>
                    option.setName("name").setDescription("Name of the phrase")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("list")
                .setDescription("List synced connections with this current server")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("post")
                .setDescription("Post phrase")
                .addIntegerOption((option) =>
                    option.setName("id").setDescription("ID of the phrase")
                )
                .addStringOption((option) =>
                    option.setName("name").setDescription("Name of the phrase")
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "add") {
            const name = interaction.options.getString("name");
            const description = interaction.options.getString("description");
            const content = interaction.options.getString("content");
            const embed = interaction.options.getBoolean("embed");

            if (
                interaction.client.phrases.find(
                    (el) => el.name === name && el.gid === interaction.guild.id
                )
            ) {
                return await interaction.reply({
                    content: `Phrase with this name already exists on that server`,
                    ephemeral: true,
                });
            }

            await interaction.client.db.query(
                `INSERT INTO phrases(gid, name, description, content, embed) 
            VALUES ('${interaction.guildId}', '${name}', '${description}', '${content}', '${
                    embed && embed === true ? 1 : 0
                }')`,
                async (err, result) => {
                    if (err) {
                        console.error(err);
                        return await interaction.reply({
                            content: `Something went wrong, try again...`,
                            ephemeral: true,
                        });
                    } else {
                        const embedBuilder = new EmbedBuilder()
                            .setColor("#009900")
                            .setTitle("New phrase added to the database").setDescription(`ID: **${
                            result.insertId
                        }**
                            **Name:** ${name}
                            **Description:** ${description}
                            **Embed:** ${embed && embed === true ? "True" : "False"}
                            **Content:** ${content}
                        `);

                        await interaction.reply({ embeds: [embedBuilder], ephemeral: true });

                        interaction.client.db.query(
                            "SELECT * FROM phrases",
                            (err, result, fields) => {
                                if (err) {
                                    console.error(err);
                                }
                                interaction.client.phrases = JSON.parse(JSON.stringify(result));
                            }
                        );
                    }
                }
            );
        } else if (interaction.options.getSubcommand() === "remove") {
            const id = interaction.options.getInteger("id");
            const name = interaction.options.getString("name");

            var found = interaction.client.phrases.find(
                (el) => (el.id == id || el.name == name) && el.gid === interaction.guild.id
            );

            if (!found) {
                return await interaction.reply({
                    content: `> Didn't find phrase to remove`,
                    ephemeral: true,
                });
            }

            interaction.client.db.query(
                `DELETE FROM phrases WHERE id = '${found.id}'`,
                (err, result) => {
                    if (err) {
                        console.error(err);
                    }
                    console.log(`Removed phrase with ID: ${found.id}`);
                }
            );

            interaction.client.db.query("SELECT * FROM phrases", (err, result, fields) => {
                if (err) {
                    console.error(err);
                }
                interaction.client.phrases = JSON.parse(JSON.stringify(result));
            });

            await interaction.reply({
                content: `> Phrase ID **${found.id}** has been removed.`,
                ephemeral: true,
            });
        } else if (interaction.options.getSubcommand() === "list") {
            interaction.client.db.query("SELECT * FROM phrases", (err, result, fields) => {
                if (err) {
                    console.error(err);
                }
                interaction.client.phrases = JSON.parse(JSON.stringify(result));
            });

            var found = interaction.client.phrases.filter((el) => el.gid === interaction.guild.id);

            if (!found) {
                return await interaction.reply({
                    content: `> Didn't find any phrase on this server!`,
                    ephemeral: true,
                });
            }

            let list = `**#ID**\t|\t**Name**\t|\t**Description**\n`;

            found.forEach((el) => {
                list += `> ${el.id}\t|\t${el.name}\t|\t${el.description}\n`;
            });

            const embed = new EmbedBuilder()
                .setColor("#2222cc")
                .setTitle(`Found **${found.length}** phrases for this server`)
                .setDescription(`${list}`);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (interaction.options.getSubcommand() === "post") {
            const id = interaction.options.getInteger("id");
            const name = interaction.options.getString("name");

            var found = interaction.client.phrases.find(
                (el) => (el.id === id || el.name === name) && el.gid === interaction.guild.id
            );

            if (found) {
                interaction.deferReply();
                interaction.deleteReply();
                if (found.embed) {
                    const embed = new EmbedBuilder()
                        .setColor("#000099")
                        .setDescription(`${found.content}`);

                    await interaction.channel.send({ embeds: [embed], ephemeral: true });
                } else {
                    await interaction.channel.send(found.content);
                }
            } else {
                await interaction.reply({
                    content: `Didn't find phrase with that ID/name`,
                    ephemeral: true,
                });
            }
        }
    },
    async autoload(client) {
        try {
            client.phrases = [];
            client.db.query("SELECT * FROM phrases", (err, result, fields) => {
                if (err) {
                    console.error(err);
                }

                client.phrases = JSON.parse(JSON.stringify(result));
                //console.log(client.sync);
            });
        } catch (e) {
            console.error(e);
        }
    },
};
