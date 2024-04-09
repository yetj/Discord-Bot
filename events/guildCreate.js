module.exports = {
    name: 'guildCreate',
	async execute(client, guild) {

        console.log(`> Bot has joined the server: ${guild.name} (#${guild.id})`)

		// load all members
		try {
			const promises = client.guilds.cache.map(guild => (guild.available ? guild.members.fetch() : Promise.resolve()));
			await Promise.all(promises);
		} catch (err) {
			console.log(`Failed to fetch all members before ready! ${err}\n${err.stack}`);
		}

		// load all channels
		try {
			const promises = client.guilds.cache.map(guild => (guild.available ? guild.channels.fetch() : Promise.resolve()));
			await Promise.all(promises);
		} catch (err) {
			console.log(`Failed to fetch all channels before ready! ${err}\n${err.stack}`);
		}

        console.log(`Reloaded cache of ${client.guilds.cache.size} guilds, ${client.users.cache.size} members and ${client.channels.cache.size} channels`);
	},
}