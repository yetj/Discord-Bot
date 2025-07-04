const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MessageFlags,
} = require("discord.js");
//const { Example } = require("../dbmodels/example");

const ExampleCommand = {
  data: new SlashCommandBuilder()
    .setName("example")
    .setDescription("An example command")
    .addStringOption((option) => option.setName("input").setDescription("Input text")),
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];
    if (focusedOption.name === "example_id") {
      try {
        const stats = await CTAEventStats.find({
          gid: interaction.guildId,
        }).sort({ name: 1 });

        for await (const entry of stats) {
          choices.push({
            name: `${entry.name}`,
            value: entry._id.toString(),
          });
        }
      } catch (err) {
        console.error("[f1fccb] ", err);
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      const limitedResults = filtered.slice(0, 20);
      await interaction.respond(
        limitedResults.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }
  },
  async execute(interaction) {
    const input = interaction.options.getString("input");
    await interaction.reply(`You entered: ${input}`);
  },
  async autoload(client) {
    // Autoload logic here
  },
};

module.exports = {
  ExampleCommand,
};
