const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('regear')
		.setDescription('Displays regears without reacion.')
		.addBooleanOption(option => option.setName('guildhouse').setDescription('Is it Guild House?')),
	async execute(interaction) {
		interaction.channel.messages.fetch({force: true}).then(async msg => {
			// get only messages with attachments and without reactions
			const messages = msg.filter(m => m.attachments.size > 0 && m.reactions.cache.size == 0).sort((a,b) => a.createdTimestamp - b.createdTimestamp)

			const guildhouse = interaction.options.getBoolean('guildhouse');

			var content = "Player name | Player mention | Location (post link)"
			
			await messages.forEach(async post => {
				
				if (post.member && post.member.nickname) {
					if (content.length > 0) {
						content += `\n`
					}

					content += `${post.member.nickname}> \`<@${post.member.user.id}>\` [${guildhouse && guildhouse === true ? 'G' : ''}H C](https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${post.id})`
				}
				else {
					const mm = interaction.guild.members.cache.get(post.author.id)

					if (mm) {
						if (content.length > 0) {
							content += `\n`
						}
						content += `${mm.nickname ? mm.nickname : mm.user.username}> \`<@${post.member.user.id}>\` [${guildhouse && guildhouse === true ? 'G' : ''}H C](https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${post.id})`
					}
					else {
						if (content.length > 0) {
							content += `\n`
						}
						content += `?????> \`<@${post.member.user.id}>\` [${guildhouse && guildhouse === true ? 'G' : ''}H C](https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/${post.id})`
					}
				}
			});

			if (messages.size === 0) {
				content = "All regears are done!"
			}

			const charsPerPage = 4000

			if (content.length > charsPerPage) {

				let pages = Math.ceil(content.length / charsPerPage)

				for (let i=0;i<pages;i++) {
					let content_partial = content.substring(charsPerPage * i, charsPerPage * (i+1))

					const embed = new EmbedBuilder()
					.setColor('#22cc11')
					.setTitle('Regears to do:')
					.setDescription(`${content_partial}`)
					.setFooter({ text: `Page ${i+1} of ${pages}`});

					if (i==0) {
						await interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error)
					}
					else {
						await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(console.error)
					}
				}
			}
			else {
				const embed = new EmbedBuilder()
				.setColor('#22cc11')
				.setTitle('Regears to do:')
				.setDescription(`${content}`)

				interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error)
			}

		}).catch(console.error)
	}
};