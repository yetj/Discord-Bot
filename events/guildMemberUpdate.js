module.exports = {
    name: 'guildMemberUpdate',
	async execute(client, oldMember, newMember) {

        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id))
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id))

        //console.log(removedRoles.next());
        //console.log(addedRoles[0]);

        // check if change is on source server
        const results = client.sync.filter(el => el.source == newMember.guild.id)

        if (results.length > 0) {
            try {
                var rolesToProceed
                // check all removed roles
                removedRoles.forEach(role => {
                    // check if we should care of removed role 
                    rolesToProceed = results.filter(el => el.role_source == role.id)
                    if (rolesToProceed.length > 0) {
                        
                        rolesToProceed.forEach(async result => {
                            // check if destination server still exists
                            const destinationServer = client.guilds.cache.get(result.gid)
                            if (destinationServer) {

                                // check if member is on destination server
                                const destinationMember = destinationServer.members.cache.get(newMember.user.id)
                                if (destinationMember) {

                                    // check if role still exists on destination server
                                    const destinationRole = destinationServer.roles.cache.find(roles => roles.id === result.role_gid)

                                    if (destinationRole) {
                                        var removed = false

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
                                                    log.send(`**${destinationMember.toString()}** roles has been updated on **${newMember.guild.name}** server and his role **${destinationRole.name}** got removed`)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        
                    }
                });

                // check all added roles
                addedRoles.forEach(role => {
                    // check if we should care of removed role 
                    rolesToProceed = results.filter(el => el.role_source == role.id)
                    if (rolesToProceed.length > 0) {
                        
                        rolesToProceed.forEach(async result => {
                            // check if destination server still exists
                            const destinationServer = client.guilds.cache.get(result.gid)
                            if (destinationServer) {

                                // check if member is on destination server
                                const destinationMember = destinationServer.members.cache.get(newMember.user.id)
                                if (destinationMember) {

                                    // check if role still exists on destination server
                                    const destinationRole = destinationServer.roles.cache.find(roles => roles.id === result.role_gid)

                                    if (destinationRole) {
                                        var assigned = false
                                        var nicknameChanged = false

                                        if(!destinationMember.roles.cache.has(result.role_gid)) {
                                            try {
                                                await destinationMember.roles.add(destinationRole).catch(console.error)
                                                assigned = true
                                            }
                                            catch (err) {
                                                // this error can happen if bot can't remove role from player
                                                console.error(err)
                                            }
                                        }

                                        if (result.update_nick === 1) {
                                            try {
                                                var newNickname = result.prefix + newMember.displayName
                                                if (newNickname.length > 32) {
                                                    newNickname = newNickname.substring(0, 31)
                                                }

                                                await destinationMember.setNickname(newNickname).catch(console.error)
                                                nicknameChanged = true
                                            }
                                            catch (err) {
                                                // this error can happen if bot can't change player nickname
                                                console.error(err)
                                            }
                                        }
            
                                        if (result.log_gid && assigned === true) {
                                            const log = destinationServer.channels.cache.find(channel => channel.id === result.log_gid)
            
                                            if (log) {
                                                if (assigned === true && nicknameChanged === true) {
                                                    log.send(`**${destinationMember.toString()}** roles has been updated on **${newMember.guild.name}** server and he got role **${destinationRole.name}** plus his nickname has been updated`)
                                                }
                                                else if (assigned === true && nicknameChanged === false) {
                                                    log.send(`**${destinationMember.toString()}** roles has been updated on **${newMember.guild.name}** server and he got role **${destinationRole.name}**`)
                                                }
                                                else if (assigned === false && nicknameChanged === true) {
                                                    log.send(`**${destinationMember.toString()}** roles has been updated on **${newMember.guild.name}** server and his nickname has been updated`)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        
                    }
                });
            }
            catch (err) {
                console.error(err)
            }
        }
	},
}