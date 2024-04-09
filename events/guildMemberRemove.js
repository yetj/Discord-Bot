module.exports = {
    name: 'guildMemberRemove',
	async execute(client, member) {

        var results = client.sync.filter(el => el.source == member.guild.id)

        if (results.length > 0) {
            try {

                results.forEach(async result => {
                    const destinationServer = client.guilds.cache.get(result.gid)
                    //const sourceServer = client.guilds.cache.get(result.source)

                    if (destinationServer) {
        
                        const destinationMember = destinationServer.members.cache.get(member.user.id)
                        //const sourceMember = sourceServer.members.cache.get(member.user.id)
        
                        //const sourceRole = sourceMember.roles.cache.find(roles => roles.id === result.role_source)

                        var removed = false

                        // check if member is on destination server
                        if (destinationMember) {
                            
                            // check if role still exists on destination server
                            const destinationRole = destinationServer.roles.cache.find(roles => roles.id === result.role_gid)

                            if (destinationRole) {
                                if(destinationMember.roles.cache.has(result.role_gid)) {
                                    try {
                                        await destinationMember.roles.remove(destinationRole).catch(console.error)
                                        removed = true
                                    }
                                    catch (err) {
                                        // this error can happen if bot can't remove role from player
                                        console.error(err)
                                    }
                                }


                                if (result.log_gid && removed === true) {
                                    const log = destinationServer.channels.cache.find(channel => channel.id === result.log_gid)

                                    if (log) {
                                        if (removed === true) {
                                            log.send(`**${destinationMember.toString()}** has left **${member.guild.name}** server and his role **${destinationRole.name}** got removed`)
                                        }
                                    }
                                }
                                
                            }
                        }
                    }
                });

            }
            catch (err) {
                console.error(err)
            }
        }
	},
}