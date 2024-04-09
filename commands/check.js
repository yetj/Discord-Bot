const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Check bot informations.')
        .addSubcommand(subcommand => subcommand
            .setName('servers')
            .setDescription('Check servers status'))
        .addSubcommand(subcommand => subcommand
            .setName('invite')
            .setDescription('Check invite status'))
        .addSubcommand(subcommand => subcommand
            .setName('leave')
            .setDescription('Leave the server')
            .addStringOption(option => option.setName('server').setDescription('Server ID').setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('roles_on_server')
            .setDescription('Check number of roles on the server'))
        .addSubcommand(subcommand => subcommand
            .setName('channels_on_server')
            .setDescription('Check number of channels on the server'))
        .addSubcommand(subcommand => subcommand
            .setName('channels_in_category')
            .setDescription('Check number of channels in specific category')
            .addChannelOption(option => option.setName('category').setDescription('Select category').addChannelTypes(ChannelType.GuildCategory).setRequired(true))),
	async execute(interaction) {

        if (interaction.member.id !== '165542890334978048') {
            return await interaction.reply({ content: `You are not authorized to use this command!`});
        }

        if (interaction.options.getSubcommand() === 'servers') {

            const guilds = interaction.client.guilds.cache
            let sGuilds = ""

            guilds.forEach(guild => {
                sGuilds += `*(${guild.id})* ${guild.name}\n`
            });

            await interaction.reply({ content: `${sGuilds}`})
        }
        else if (interaction.options.getSubcommand() === 'invite') {
            await interaction.reply({ content: `Link to invite bot:\n${interaction.client.inviteLink}`})
        }
        else if (interaction.options.getSubcommand() === 'leave') {
            const server = interaction.options.getString('server')

            try {
                const srv = interaction.client.guilds.cache.get(server)

                if (srv) {
                    srv.leave().then(await interaction.reply({ content: `Bot has left the guild: **${srv.name}** *(${srv.id})*`}))
                    .catch(err => {
                        console.log(`> [hj533]: There was an error leaving the guild: \n ${err.message}`);
                    })
                }
                else {
                    await interaction.reply({ content: `> Error: Bot is not on this guild...`})
                }
            }
            catch (e) {
                console.log(`Error [hj534]: ${e.message}`)
                await interaction.reply({ content: `> Error: Bot is not on this guild...`})
            }
        }
        else if (interaction.options.getSubcommand() === 'roles_on_server') {
            await interaction.reply({ content: `Roles on this server: **${interaction.guild.roles.cache.size}**`})
        }
        else if (interaction.options.getSubcommand() === 'channels_on_server') {
            await interaction.reply({ content: `Channels on this server: **${interaction.guild.channels.cache.size}**`})
        }
        else if (interaction.options.getSubcommand() === 'channels_in_category') {
            const category = interaction.options.getChannel('category')
            await interaction.reply({ content: `Channels in category **${category.name}**: **${interaction.guild.channels.cache.filter(c => c.parentId === category.id).size}**`})
        }
	}
};