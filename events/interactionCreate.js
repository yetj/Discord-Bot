const getDisplayName = require("../utils/getDisplayName");

module.exports = {
  name: "interactionCreate",
  async execute(client, interaction) {
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;
    if (!interaction.guild) return;

    if (interaction.isChatInputCommand()) {
      let log = `>> [${interaction.guild.name}] `;
      log += `${getDisplayName(interaction.member)} `;
      log += `on #${interaction.channel.name} `;
      log += `used /${interaction.commandName} `;
      log += `${interaction.options.getSubcommand(false) ?? ""}`;

      console.log(log);
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      if (interaction.isChatInputCommand()) {
        await command.execute(interaction);
      } else if (interaction.isAutocomplete()) {
        await command.autocomplete(interaction);
      }
    } catch (error) {
      console.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: `> *There was an error while executing this command!* 🙄\n> Error message:\n\`${error.message}\``,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `> *There was an error while executing this command!* 🙄\n> *Error message:\n\`${error.message}\``,
          ephemeral: true,
        });
      }
    }
  },
};
