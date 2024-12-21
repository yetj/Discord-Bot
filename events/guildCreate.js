const getDisplayName = require("../utils/getDisplayName.js");

module.exports = {
  name: "guildCreate",
  async execute(client, guild) {
    const owner = await guild.fetchOwner({
      force: true,
    });

    console.log(
      `> Bot has joined the server: ${guild.name} (#${guild.id}) - ${owner.user.username} (#${
        owner.user.id
      }) ${getDisplayName(owner)}`
    );

    const server = await client.guilds.cache.get("934748817339846667");

    if (server) {
      const channel = await server.channels.cache.find((c) => c.id === "1257343922972131389");
      if (channel) {
        let botJoinedMessage = `> Bot has joined the server: **${guild.name}** (#${guild.id})\n`;
        botJoinedMessage = `> Owner ID: ${owner.user.id}\n`;
        botJoinedMessage = `> Username: ${owner.user.username}\n`;
        botJoinedMessage = `> <@${owner.user.id}> - ${getDisplayName(owner)}`;

        channel.send(botJoinedMessage);
      }
    }

    // load all members
    try {
      const promises = client.guilds.cache.map((guild) =>
        guild.available ? guild.members.fetch() : Promise.resolve()
      );
      await Promise.all(promises);
    } catch (err) {
      console.log(`Failed to fetch all members before ready! ${err}\n${err.stack}`);
    }

    // load all channels
    try {
      const promises = client.guilds.cache.map((guild) =>
        guild.available ? guild.channels.fetch() : Promise.resolve()
      );
      await Promise.all(promises);
    } catch (err) {
      console.log(`Failed to fetch all channels before ready! ${err}\n${err.stack}`);
    }

    console.log(
      `Reloaded cache of ${client.guilds.cache.size} guilds, ${client.users.cache.size} members and ${client.channels.cache.size} channels`
    );
  },
};
