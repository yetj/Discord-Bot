module.exports = {
  name: "guildMemberAdd",
  async execute(client, member) {
    /*
        var results = client.sync.filter((el) => el.gid == member.guild.id);

        if (results.length > 0) {
            //console.log(results)
            try {
                results.forEach(async (result) => {
                    const destinationServer = client.guilds.cache.get(result.gid);
                    const sourceServer = client.guilds.cache.get(result.source);

                    if (sourceServer) {
                        const destinationMember = destinationServer.members.cache.get(
                            member.user.id
                        );
                        const sourceMember = sourceServer.members.cache.get(member.user.id);

                        if (sourceMember) {
                            var assigned = false;
                            var nicknameChanged = false;

                            if (result.same_role == 0) {
                                const sourceRole = sourceMember.roles.cache.find(
                                    (roles) => roles.id === result.role_source
                                );

                                if (sourceRole) {
                                    // check if role still exists on destination server
                                    const destinationRole = destinationServer.roles.cache.find(
                                        (roles) => roles.id === result.role_gid
                                    );

                                    if (destinationRole) {
                                        if (!destinationMember.roles.cache.has(result.role_gid)) {
                                            try {
                                                await destinationMember.roles
                                                    .add(destinationRole)
                                                    .catch(console.error);
                                                assigned = true;
                                            } catch (err) {
                                                // this error can happen if bot can't assign role to player
                                                console.error(err);
                                            }
                                        }

                                        if (result.update_nick === 1) {
                                            try {
                                                var newNickname =
                                                    result.prefix + sourceMember.displayName;
                                                if (newNickname.length > 32) {
                                                    newNickname = newNickname.substring(0, 31);
                                                }

                                                await destinationMember
                                                    .setNickname(newNickname)
                                                    .catch(console.error);
                                                nicknameChanged = true;
                                            } catch (err) {
                                                // this error can happen if bot can't change player nickname
                                                console.error(err);
                                            }
                                        }

                                        if (
                                            result.log_gid &&
                                            (assigned === true || nicknameChanged === true)
                                        ) {
                                            const log = destinationServer.channels.cache.find(
                                                (channel) => channel.id === result.log_gid
                                            );

                                            if (log) {
                                                if (assigned === true && nicknameChanged === true) {
                                                    log.send(
                                                        `**${destinationMember.toString()}** has joined and got role **${
                                                            destinationRole.name
                                                        }** plus his **nickname has been updated**`
                                                    );
                                                } else if (
                                                    assigned === true &&
                                                    nicknameChanged === false
                                                ) {
                                                    log.send(
                                                        `**${destinationMember.toString()}** has joined and got role **${
                                                            destinationRole.name
                                                        }**`
                                                    );
                                                } else if (
                                                    assigned === false &&
                                                    nicknameChanged === true
                                                ) {
                                                    log.send(
                                                        `**${destinationMember.toString()}** has joined and his **nickname has been updated**`
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            } else if (result.same_role == 1) {
                                const destinationRoles = await sourceMember.roles.cache
                                    .filter((roles) => roles.id !== result.source)
                                    .map((role) => role.name);

                                for (x in destinationRoles) {
                                    const destinationRole =
                                        await destinationServer.roles.cache.find(
                                            (r) => r.name === destinationRoles[x]
                                        );

                                    if (destinationRole) {
                                        if (
                                            !destinationMember.roles.cache.has(destinationRole.id)
                                        ) {
                                            await destinationMember.roles.add(destinationRole);
                                            assigned = true;
                                        }

                                        if (result.update_nick === 1) {
                                            try {
                                                var newNickname =
                                                    result.prefix + sourceMember.displayName;
                                                if (newNickname.length > 32) {
                                                    newNickname = newNickname.substring(0, 31);
                                                }

                                                await destinationMember
                                                    .setNickname(newNickname)
                                                    .catch(console.error);
                                                nicknameChanged = true;
                                            } catch (err) {
                                                // this error can happen if bot can't change player nickname
                                                console.error(err);
                                            }
                                        }

                                        if (
                                            result.log_gid &&
                                            (assigned === true || nicknameChanged === true)
                                        ) {
                                            const log = destinationServer.channels.cache.find(
                                                (channel) => channel.id === result.log_gid
                                            );

                                            if (log) {
                                                if (assigned === true && nicknameChanged === true) {
                                                    log.send(
                                                        `**${destinationMember.toString()}** has joined and got automatically role **${
                                                            destinationRole.name
                                                        }** plus his **nickname has been updated**`
                                                    );
                                                } else if (
                                                    assigned === true &&
                                                    nicknameChanged === false
                                                ) {
                                                    log.send(
                                                        `**${destinationMember.toString()}** has joined and got automatically role **${
                                                            destinationRole.name
                                                        }**`
                                                    );
                                                } else if (
                                                    assigned === false &&
                                                    nicknameChanged === true
                                                ) {
                                                    log.send(
                                                        `**${destinationMember.toString()}** has joined and his **nickname has been updated**`
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (err) {
                console.error(err);
            }
        }
        */
  },
};
