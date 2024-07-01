module.exports = {
  name: "guildDelete",
  async execute(client, guild) {
    console.log(`> Bot has left the server: ${guild.name} (#${guild.id})`);

    const server = await client.guilds.cache.get("934748817339846667");
    if (server) {
      const channel = await server.channels.cache.find((c) => c.id === "1257343922972131389");
      if (channel) {
        channel.send(`> Bot has left the server: **${guild.name}** (#${guild.id})`);
      }
    }
  },
};
