const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("match")
    .setDescription("Match options.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Start counter")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Select channel to post message")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName("time").setDescription("Time in seconds").setMinValue(5).setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("message_before")
            .setDescription("Message to be posted on channel on start")
            .setMinLength(5)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("message_after")
            .setDescription("Message to be posted on channel when timer ends")
            .setMinLength(5)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remake")
        .setDescription("Make a remake")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("Timer ID to remake").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Custom message to post on remake")
            .setMinLength(5)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stop")
        .setDescription("Stop the timer")
        .addIntegerOption((option) =>
          option.setName("id").setDescription("Timer ID to stop").setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "start") {
      const channel = interaction.options.getChannel("channel");
      const time = interaction.options.getInteger("time");
      const message_before = interaction.options.getString("message_before");
      const message_after = interaction.options.getString("message_after");

      channel.send(message_before);

      let rand = Math.floor(Math.random() * 100000);

      let t = setTimeout(module.exports.post, 1000 * time, interaction, rand);

      interaction.client.match.push({
        id: rand,
        channel: channel,
        timer: t,
        message: message_after,
      });

      await interaction.reply(
        `Timer started with ID: [**${rand}**]!\nYou can stop it with command \`/match stop id:${rand}\` or announce remake \`/match remake id:${rand}\``
      );
    } else if (interaction.options.getSubcommand() === "remake") {
      const timer = interaction.options.getInteger("id");
      const message = interaction.options.getString("message");

      const entry = interaction.client.match.find((t) => t.id === timer);

      if (entry) {
        clearTimeout(entry.timer);

        if (message) {
          entry.channel.send(`${message}`);
        } else {
          entry.channel.send(`Remake! Please stay in the same lobby!`);
        }

        interaction.client.match = interaction.client.match.filter((t) => t.id !== timer);

        await interaction.reply(`Timer with ID [**${entry.id}**] remaked!`);
      } else {
        await interaction.reply({
          content: `There is no timer with this ID`,
        });
      }
    } else if (interaction.options.getSubcommand() === "stop") {
      const timer = interaction.options.getInteger("id");

      const entry = interaction.client.match.find((t) => t.id === timer);

      if (entry) {
        clearTimeout(entry.timer);

        interaction.client.match = interaction.client.match.filter((t) => t.id !== timer);

        await interaction.reply(`Timer with ID [**${entry.id}**] stopeed!`);
      }
    }
  },
  autoload(client) {
    if (!client.match) {
      client.match = [];
    }
    /*
        client.on("messageCreate", msg => {
            //console.log(`## ${msg.content}`)
        })
        */
  },
  post(interaction, id) {
    const entry = interaction.client.match.find((t) => t.id === id);

    if (entry) {
      entry.channel.send(entry.message);
      interaction.client.match = interaction.client.match.filter((t) => t.id !== id);
    }
  },
};
