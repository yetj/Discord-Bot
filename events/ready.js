module.exports = {
    name: "ready",
    once: true,
    async execute(client, client2) {
        // load all members
        try {
            const promises = client2.guilds.cache.map((guild) =>
                guild.available
                    ? guild.members.fetch({ cache: false, force: true })
                    : Promise.resolve()
            );
            await Promise.all(promises);
        } catch (err) {
            console.log(`Failed to fetch all members before ready! ${err}\n${err.stack}`);
        }

        // load all channels
        try {
            const promises = client2.guilds.cache.map((guild) =>
                guild.available ? guild.channels.fetch() : Promise.resolve()
            );
            await Promise.all(promises);
        } catch (err) {
            console.log(`Failed to fetch all channels before ready! ${err}\n${err.stack}`);
        }

        console.log(
            `Ready with ${client2.guilds.cache.size} guilds, ${client2.users.cache.size} members and ${client2.channels.cache.size} channels`
        );

        console.log(`Logged in as ${client2.user.tag}`);
    },
};
