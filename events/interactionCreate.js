module.exports = {
    name: "interactionCreate",
    async execute(client, interaction) {
        if (!interaction.isChatInputCommand()) return;

        console.log(
            `>> ${interaction.user.tag} in #${interaction.channel.name} triggered an interaction ${interaction.commandName}.`
        );

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);

            if (interaction.replied) {
                await interaction.followUp({
                    content: `> *There was an error while executing this command! 🙄\n> Error message: \`${error.message}\`*`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: `> *There was an error while executing this command! 🙄\n> *Error message: \`${error.message}\`*`,
                    ephemeral: true,
                });
            }
        }
    },
};
