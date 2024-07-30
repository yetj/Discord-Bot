const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const Sync = require("../dbmodels/sync.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sync")
    .setDescription("Syncing groups between different servers.")
    .addSubcommand(
      (subcommand) =>
        subcommand
          .setName("new")
          .setDescription("Add new server")
          .addStringOption((option) =>
            option.setName("source").setDescription("Source server ID").setRequired(true)
          )
          .addStringOption((option) =>
            option.setName("role_source").setDescription("Source server role ID").setRequired(true)
          )
          .addRoleOption((option) =>
            option.setName("role_gid").setDescription("Destination server role").setRequired(true)
          )
          .addBooleanOption((option) =>
            option
              .setName("update_nick")
              .setDescription(
                "Should bot also update player nickname on destination server based on source server?"
              )
              .setRequired(true)
          )
          .addChannelOption((option) =>
            option
              .setName("log_gid")
              .setDescription("Select channel to send synchronization logs")
              .addChannelTypes(ChannelType.GuildText)
          )
          .addStringOption((option) => option.setName("prefix").setDescription("Prefix"))
      //.addBooleanOption(option => option.setName('same_role').setDescription('Should bot ignore role_gid, and try to find the same role name as it is on source server?'))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove server")
        .addStringOption((option) =>
          option.setName("id").setDescription("ID of the connection").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List synced connections with this current server")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("refreshdb").setDescription("Refresh list from Database")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reload")
        .setDescription("Reload synchronization for specific entry")
        .addStringOption((option) =>
          option.setName("id").setDescription("ID of the connection").setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("force_update_all_members")
            .setDescription("Force to update nicknames for all players?")
        )
        .addRoleOption((option) =>
          option
            .setName("skip_updating_members_with_role")
            .setDescription("Skip updating members with selected role")
        )
        .addBooleanOption((option) =>
          option
            .setName("remove_existing_members")
            .setDescription("Remove role from members who are not match?")
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: `You don't have permission to execute this command!`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "new") {
      const source = interaction.options.getString("source");
      const role_source = interaction.options.getString("role_source");
      const role_gid = interaction.options.getRole("role_gid");
      const update_nick = interaction.options.getBoolean("update_nick");
      const log_gid = interaction.options.getChannel("log_gid");
      const prefix = interaction.options.getString("prefix");
      //const same_role = interaction.options.getBoolean('same_role');

      // check if bot is added on source server
      const sourceServer = interaction.client.guilds.cache.get(source);
      if (!sourceServer) {
        return await interaction.reply({
          content: `Bot is not added to the server with ID: **${source}**.\nVisit link below to add bot to this server:\n*${interaction.client.inviteLink}*`,
          ephemeral: true,
        });
      }

      //check if role ID exists on source server
      const sourceRole = await sourceServer.roles.cache.find((r) => r.id === role_source);
      if (!sourceRole) {
        return await interaction.reply({
          content: `Role with ID **${role_source}** not found on server **${sourceServer.name}**`,
          ephemeral: true,
        });
      }

      //check if source server ID is not the same as destination
      if (sourceServer.id === interaction.guildId) {
        return await interaction.reply({
          content: `Source server can't be the same as destination server.`,
          ephemeral: true,
        });
      }

      //check if bot have higher rank than selected role
      const botPosition = interaction.member.guild.members.cache
        .get(interaction.client.user.id)
        .roles.cache.filter((roles) => roles.tags?.botId === interaction.client.user.id)
        .map((r) => r.position)[0];
      if (botPosition < role_gid.position) {
        return await interaction.reply({
          content: `Role ${role_gid} is higher than bot role.\nPlease move bot role higher than selected role.`,
          ephemeral: true,
        });
      }

      //check if bot have permissions to give roles
      if (!interaction.member.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return await interaction.reply({
          content: `Bot doesn't have permissions to assign roles.`,
          ephemeral: true,
        });
      }

      //check if that entry doesn't exist already in databese
      const isSyncExist = await Sync.findOne({
        gid: interaction.guildId,
        source: sourceServer.id,
        role_gid: role_gid,
        role_source: role_source,
      });
      if (isSyncExist) {
        return await interaction.reply({
          content: `Such entry already exist in database...`,
          ephemeral: true,
        });
      }

      //const updateNick = update_nick === true ? 1 : 0;
      const setPrefix = prefix === null ? "" : prefix;
      const logGid = log_gid === null ? "" : log_gid;
      //const sameRole = same_role === true ? 1 : 0

      const newDatabase = await new Sync({
        gid: interaction.guildId,
        source: sourceServer.id,
        role_gid: role_gid.id,
        role_source: sourceRole.id,
        log_gid: logGid.id,
        same_role: false,
        update_nick: update_nick,
        prefix: setPrefix,
        created_by: interaction.member.id,
      });

      try {
        await newDatabase.save();

        let message = "";
        message += `**ID:** *${newDatabase._id.toString()}*\n`;
        message += `**Source server:** *${sourceServer.name} - #${sourceServer.id}*\n`;
        message += `**Source role:** *${sourceRole.name} - @${sourceRole.id}*\n`;
        message += `**Destination role:** *${role_gid.name} - @${role_gid.id}*\n`;
        message += `**Update nick:** *${update_nick}*\n`;
        if (logGid === "") {
          message += `**Log channel:** *not set*\n`;
        } else {
          message += `**Log channel:** *${logGid.toString()}* - #${logGid.id}\n`;
        }

        if (setPrefix === "") {
          message += `**Prefix:** *not set*`;
        } else {
          message += `**Prefix:** *${setPrefix}*`;
        }

        const embed = new EmbedBuilder()
          .setColor("#009900")
          .setTitle("New sync entry added to the database")
          .setDescription(message);

        await interaction.reply({ embeds: [embed] });
      } catch (err) {
        console.error(`[h45cd] Can't add new sync: `, err);
        return await interaction.reply(
          `> *Error while creating new Sync. Please try again later.*`
        );
      }
    } else if (interaction.options.getSubcommand() === "remove") {
      const id = interaction.options.getString("id");

      let sync = null;

      try {
        sync = await Sync.findOne({ gid: interaction.guildId, _id: id });
      } catch (err) {}

      if (!sync) {
        return await interaction.reply(
          `> *ID \`${id}\` not found in database or is not set for this server.*`
        );
      }

      try {
        await Sync.deleteOne({ _id: id });

        await interaction.reply(`> *Removed sync with ID: *${id}**`);
      } catch (err) {
        console.error(`[t43da] `, err);
        await interaction.reply(
          `> *Error while removing Sync with ID: **${id}**. Please try again later.*`
        );
      }
    } else if (interaction.options.getSubcommand() === "list") {
      //const found = interaction.client.sync.filter((el) => el.gid == interaction.guildId);
      const found = await Sync.find({ gid: interaction.guildId });

      if (!found || !found.length) {
        return await interaction.reply(
          `> *This server is not synced with any other server yet...*`
        );
      }

      let fields = [];

      await found.forEach((el) => {
        const sourceServer = interaction.client.guilds.cache.get(el.source);
        const destinationServer = interaction.client.guilds.cache.get(el.gid);
        const sourceRole = sourceServer.roles.cache.find((r) => r.id === el.role_source);
        const destinationRole = destinationServer.roles.cache.find((r) => r.id === el.role_gid);
        const log_gid = destinationServer.channels.cache.find((c) => c.id === el.log_gid);
        const update_nick = el.update_nick;
        const prefix = el.prefix === "" ? "*not set*" : el.prefix;
        const logChannel = log_gid ? log_gid.toString() + " - #" + log_gid.id : "*not set*";

        fields.push({
          name: `Connection ID: ${el._id.toString()}`,
          value: `Source server: **${sourceServer.name}** - *#${sourceServer.id}*
                Source role: **${sourceRole.name}** - *@${sourceRole.id}*
                Destination server: **${destinationServer.name}** - *#${destinationServer.id}*
                Destination role: **${destinationRole.name}** - *@${destinationRole.id}*
                Update nick: **${update_nick}**
                Log channel: ${logChannel}
                Prefix: **${prefix}**`,
        });
      });

      const embed = new EmbedBuilder()
        .setColor("#2222cc")
        .setTitle("Server connection list")
        .setDescription(`We've found ${found.length} connection(s)`)
        .addFields(fields);

      await interaction.reply({ embeds: [embed] });
    } else if (interaction.options.getSubcommand() === "reload") {
      const id = interaction.options.getString("id");
      const remove_existing_members = interaction.options.getBoolean("remove_existing_members");
      const force_update_all_members = interaction.options.getBoolean("force_update_all_members");
      const skip_updating_members_with_role = interaction.options.getRole(
        "skip_updating_members_with_role"
      );

      let found = null;
      try {
        found = await Sync.findOne({ gid: interaction.guildId, _id: id });
      } catch (err) {}

      if (!found) {
        return await interaction.reply(
          `> *Sync ID \`${id}\` not found in database or is not set for this server.*`
        );
      }

      // check if bot is still on source server
      const sourceServer = interaction.client.guilds.cache.get(found.source);
      if (!sourceServer) {
        try {
          await Sync.deleteMany({ source: found.source });

          return await interaction.reply(`> *Bot is no longer on source server...*`);
        } catch (err) {
          console.error(`[bj5fs]`, err);
          return await interaction.reply(`Error while reloading Sync. Please try again later.`);
        }
      }

      //check if bot have permissions to give roles
      if (!interaction.member.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return await interaction.reply(`> *Bot doesn't have permissions to assign roles.*`);
      }

      //get all members on both servers with specific roles
      let membersWithSourceRole;
      let membersWithDestinationRole;

      await sourceServer.members.fetch({ force: true }).then((fetchedMembers) => {
        membersWithSourceRole = fetchedMembers.filter((member) =>
          member._roles.includes(found.role_source)
        );
      });

      const destinationServer = interaction.client.guilds.cache.get(found.gid);
      await destinationServer.members.fetch({ force: true }).then((fetchedMembers) => {
        membersWithDestinationRole = fetchedMembers.filter((member) =>
          member._roles.includes(found.role_gid)
        );
      });

      let rolesToAdd;
      if (force_update_all_members === true) {
        rolesToAdd = membersWithSourceRole;
      } else {
        rolesToAdd = membersWithSourceRole.filter(
          (m) => !membersWithDestinationRole.map((r) => r.id).includes(m.id)
        );
      }

      let rolesToRemove;

      rolesToRemove = membersWithDestinationRole.filter(
        (m) => !membersWithSourceRole.map((r) => r.id).includes(m.id)
      );

      let rolesAdded = [];
      let rolesRemoved = [];
      let rolesSkipped = [];
      let promises = [];

      const roleHandle = destinationServer.roles.cache.find((r) => r.id === found.role_gid);

      if (!roleHandle) {
        return interaction.reply(`> *Destination role not found \`${found.role_gid}\`...*`);
      }

      let fields = [];

      //for (const member of rolesToAdd) {
      await rolesToAdd.forEach((member) => {
        const memberX = destinationServer.members.cache.find((m) => m.id === member.id);

        if (memberX) {
          if (
            !skip_updating_members_with_role ||
            !memberX.roles.cache.find((r) => r.id === skip_updating_members_with_role.id)
          ) {
            if (!memberX.roles.cache.find((r) => r.id === roleHandle.id)) {
              promises.push(
                memberX.roles.add(roleHandle, "Synchronization").then().catch(console.error)
              );
            }

            if (found.update_nick === true) {
              if (found.prefix.length > 0) {
                let newNickname = found.prefix + member.displayName;
                if (newNickname.length > 32) {
                  newNickname = newNickname.substring(0, 31);
                }

                if (!memberX.displayName.includes(newNickname)) {
                  promises.push(memberX.setNickname(newNickname).catch(console.error));
                }
              } else {
                promises.push(memberX.setNickname(member.displayName).catch(console.error));
              }
            }

            rolesAdded.push(memberX.displayName);

            if (
              rolesAdded.join("\n").length +
                rolesRemoved.join("\n").length +
                rolesSkipped.join("\n").length >
              950
            ) {
              fields.push({
                name: `Roles updated:`,
                value: rolesAdded.sort().join("\n") + "\n-",
                inline: true,
              });
              fields.push({
                name: `Roles removed:`,
                value: rolesRemoved.sort().join("\n") + "\n-",
                inline: true,
              });
              fields.push({
                name: `Skipped:`,
                value: rolesSkipped.sort().join("\n") + "\n-",
                inline: true,
              });

              const embed = new EmbedBuilder()
                .setColor("#2222cc")
                .setTitle(`Synchronization results #${id}`)
                .setDescription(
                  `> Added roles: **${rolesAdded.length}**\n> Removed roles: **${rolesRemoved.length}**\n> Skipped: **${rolesSkipped.length}**`
                )
                .addFields(fields);

              //interaction.reply({ embeds: [embed], ephemeral: true });

              interaction.channel.send({ embeds: [embed] });

              fields = [];
              rolesAdded = [];
              rolesRemoved = [];
              rolesSkipped = [];
            }
          } else {
            rolesSkipped.push(member.displayName);
          }
        }
      });

      if (remove_existing_members === true) {
        //for (const member of rolesToRemove) {
        rolesToRemove.forEach((member) => {
          promises.push(
            member.roles.remove(roleHandle, "Synchronization").then().catch(console.error)
          );
          rolesRemoved.push(member.displayName);

          if (
            rolesAdded.join("\n").length +
              rolesRemoved.join("\n").length +
              rolesSkipped.join("\n").length >
            950
          ) {
            fields.push({
              name: `Roles updated:`,
              value: rolesAdded.sort().join("\n") + "\n-",
              inline: true,
            });
            fields.push({
              name: `Roles removed:`,
              value: rolesRemoved.sort().join("\n") + "\n-",
              inline: true,
            });
            fields.push({
              name: `Skipped:`,
              value: rolesSkipped.sort().join("\n") + "\n-",
              inline: true,
            });

            const embed = new EmbedBuilder()
              .setColor("#2222cc")
              .setTitle(`Synchronization results #${id}`)
              .setDescription(
                `> Added roles: **${rolesAdded.length}**\n> Removed roles: **${rolesRemoved.length}**\n> Skipped: **${rolesSkipped.length}**`
              )
              .addFields(fields);

            //interaction.reply({ embeds: [embed], ephemeral: true });

            interaction.channel.send({ embeds: [embed] });

            fields = [];
            rolesAdded = [];
            rolesRemoved = [];
            rolesSkipped = [];
          }
        });
      }

      await fields.push({
        name: `Roles updated:`,
        value: rolesAdded.sort().join("\n") + "\n-",
        inline: true,
      });
      await fields.push({
        name: `Roles removed:`,
        value: rolesRemoved.sort().join("\n") + "\n-",
        inline: true,
      });
      await fields.push({
        name: `Skipped:`,
        value: rolesSkipped.sort().join("\n") + "\n-",
        inline: true,
      });

      const embed = new EmbedBuilder()
        .setColor("#2222cc")
        .setTitle(`Synchronization results #${id}`)
        .setDescription(
          `> Added roles: **${rolesAdded.length}**\n> Removed roles: **${rolesRemoved.length}**\n> Skipped: **${rolesSkipped.length}**`
        )
        .addFields(fields);

      interaction.deferReply();
      interaction.deleteReply();
      interaction.channel.send({ embeds: [embed] });
      //await interaction.reply({ embeds: [embed], ephemeral: true });

      await Promise.all(promises);
      interaction.channel.send(
        `> Hey ${interaction.member}! Synchronization #${id} of ${promises.length} members finished! All roles and nicknames updated...`
      );
    }
  },
  async autoload(client) {
    // remove sync if bot is removed from source or destination server
    client.on("guildDelete", async (guild) => {
      try {
        await Sync.deleteMany({ $or: [{ gid: guild.id }, { source: guild.id }] });
        console.log(
          `>>> [BOT REMOVED FROM SERVER] Removed sync connected with server ID: #${guild.id}`
        );
      } catch (err) {
        console.error("[uf4f3] ", err);
      }
    });

    // member join the server
    client.on("guildMemberAdd", async (member) => {
      let results;
      try {
        results = await Sync.find({ gid: member.guild.id });
      } catch (err) {
        console.error(`[3ggfe] `, err);
      }

      if (!results || results.length < 1) {
        return;
      }

      try {
        results.forEach(async (result) => {
          const destinationServer = client.guilds.cache.get(result.gid);
          const sourceServer = client.guilds.cache.get(result.source);

          if (sourceServer) {
            const destinationMember = destinationServer.members.cache.get(member.user.id);
            const sourceMember = sourceServer.members.cache.get(member.user.id);

            if (sourceMember) {
              let assigned = false;
              let nicknameChanged = false;

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
                        await destinationMember.roles.add(destinationRole).catch(console.error);
                        assigned = true;
                      } catch (err) {
                        // this error can happen if bot can't assign role to player
                        console.error(err);
                      }
                    }

                    if (result.update_nick === true) {
                      try {
                        let newNickname = result.prefix + sourceMember.displayName;
                        if (newNickname.length > 32) {
                          newNickname = newNickname.substring(0, 31);
                        }

                        await destinationMember.setNickname(newNickname).catch(console.error);
                        nicknameChanged = true;
                      } catch (err) {
                        // this error can happen if bot can't change player nickname
                        console.error(err);
                      }
                    }

                    if (result.log_gid && (assigned === true || nicknameChanged === true)) {
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
                        } else if (assigned === true && nicknameChanged === false) {
                          log.send(
                            `**${destinationMember.toString()}** has joined and got role **${
                              destinationRole.name
                            }**`
                          );
                        } else if (assigned === false && nicknameChanged === true) {
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
                  const destinationRole = await destinationServer.roles.cache.find(
                    (r) => r.name === destinationRoles[x]
                  );

                  if (destinationRole) {
                    if (!destinationMember.roles.cache.has(destinationRole.id)) {
                      await destinationMember.roles.add(destinationRole);
                      assigned = true;
                    }

                    if (result.update_nick === true) {
                      try {
                        let newNickname = result.prefix + sourceMember.displayName;
                        if (newNickname.length > 32) {
                          newNickname = newNickname.substring(0, 31);
                        }

                        await destinationMember.setNickname(newNickname).catch(console.error);
                        nicknameChanged = true;
                      } catch (err) {
                        // this error can happen if bot can't change player nickname
                        console.error(err);
                      }
                    }

                    if (result.log_gid && (assigned === true || nicknameChanged === true)) {
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
                        } else if (assigned === true && nicknameChanged === false) {
                          log.send(
                            `**${destinationMember.toString()}** has joined and got automatically role **${
                              destinationRole.name
                            }**`
                          );
                        } else if (assigned === false && nicknameChanged === true) {
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
          } else {
            try {
              await Sync.deleteMany({ source: result.source });
              console.log(
                `>>> [BOT REMOVED FROM SERVER] Removed sync connected with server ID: #${result.source}`
              );
            } catch (err) {
              console.error("[uf4f3] ", err);
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
    });

    // member updated roles on the source server
    client.on("guildMemberUpdate", async (oldMember, newMember) => {
      const removedRoles = oldMember.roles.cache.filter(
        (role) => !newMember.roles.cache.has(role.id)
      );
      const addedRoles = newMember.roles.cache.filter(
        (role) => !oldMember.roles.cache.has(role.id)
      );

      let results;

      try {
        results = await Sync.find({ source: newMember.guild.id });
      } catch (err) {
        console.error(`[4t5gf] `, err);
      }

      if (!results || results.length < 1) {
        return;
      }

      try {
        let rolesToProceed;
        // check all removed roles
        removedRoles.forEach((role) => {
          // check if we should care of removed role
          rolesToProceed = results.filter((el) => el.role_source == role.id);
          if (rolesToProceed.length > 0) {
            rolesToProceed.forEach(async (result) => {
              // check if destination server still exists
              const destinationServer = client.guilds.cache.get(result.gid);
              if (destinationServer) {
                // check if member is on destination server
                const destinationMember = destinationServer.members.cache.get(newMember.user.id);
                if (destinationMember) {
                  // check if role still exists on destination server
                  const destinationRole = destinationServer.roles.cache.find(
                    (roles) => roles.id === result.role_gid
                  );

                  if (destinationRole) {
                    let removed = false;

                    if (destinationMember.roles.cache.has(result.role_gid)) {
                      try {
                        await destinationMember.roles.remove(destinationRole).catch(console.error);
                        removed = true;
                      } catch (err) {
                        // this error can happen if bot can't remove role from player
                        console.error(err);
                      }
                    }

                    if (result.log_gid && removed === true) {
                      const log = destinationServer.channels.cache.find(
                        (channel) => channel.id === result.log_gid
                      );

                      if (log) {
                        if (removed === true) {
                          log.send(
                            `**${destinationMember.toString()}** roles has been updated on **${
                              newMember.guild.name
                            }** server and his role **${destinationRole.name}** got removed`
                          );
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
        addedRoles.forEach((role) => {
          // check if we should care of removed role
          rolesToProceed = results.filter((el) => el.role_source == role.id);
          if (rolesToProceed.length > 0) {
            rolesToProceed.forEach(async (result) => {
              // check if destination server still exists
              const destinationServer = client.guilds.cache.get(result.gid);
              if (destinationServer) {
                // check if member is on destination server
                const destinationMember = destinationServer.members.cache.get(newMember.user.id);
                if (destinationMember) {
                  // check if role still exists on destination server
                  const destinationRole = destinationServer.roles.cache.find(
                    (roles) => roles.id === result.role_gid
                  );

                  if (destinationRole) {
                    let assigned = false;
                    let nicknameChanged = false;

                    if (!destinationMember.roles.cache.has(result.role_gid)) {
                      try {
                        await destinationMember.roles.add(destinationRole).catch(console.error);
                        assigned = true;
                      } catch (err) {
                        // this error can happen if bot can't remove role from player
                        console.error(err);
                      }
                    }

                    if (result.update_nick === true) {
                      try {
                        let newNickname = result.prefix + newMember.displayName;
                        if (newNickname.length > 32) {
                          newNickname = newNickname.substring(0, 31);
                        }

                        await destinationMember.setNickname(newNickname).catch(console.error);
                        nicknameChanged = true;
                      } catch (err) {
                        // this error can happen if bot can't change player nickname
                        console.error(err);
                      }
                    }

                    if (result.log_gid && assigned === true) {
                      const log = destinationServer.channels.cache.find(
                        (channel) => channel.id === result.log_gid
                      );

                      if (log) {
                        if (assigned === true && nicknameChanged === true) {
                          log.send(
                            `**${destinationMember.toString()}** roles has been updated on **${
                              newMember.guild.name
                            }** server and he got role **${
                              destinationRole.name
                            }** plus his nickname has been updated`
                          );
                        } else if (assigned === true && nicknameChanged === false) {
                          log.send(
                            `**${destinationMember.toString()}** roles has been updated on **${
                              newMember.guild.name
                            }** server and he got role **${destinationRole.name}**`
                          );
                        } else if (assigned === false && nicknameChanged === true) {
                          log.send(
                            `**${destinationMember.toString()}** roles has been updated on **${
                              newMember.guild.name
                            }** server and his nickname has been updated`
                          );
                        }
                      }
                    }
                  }
                }
              }
            });
          }
        });
      } catch (err) {
        console.error(`[b3g34] `, err);
      }
    });

    // member left the source server
    client.on("guildMemberRemove", async (member) => {
      let results;

      try {
        results = await Sync.find({ source: member.guild.id });
      } catch (err) {
        console.error(`[g34gf] `, err);
      }

      if (!results || results.length < 1) {
        return;
      }

      try {
        results.forEach(async (result) => {
          const destinationServer = client.guilds.cache.get(result.gid);

          if (destinationServer) {
            const destinationMember = destinationServer.members.cache.get(member.user.id);

            let removed = false;

            // check if member is on destination server
            if (destinationMember) {
              // check if role still exists on destination server
              const destinationRole = destinationServer.roles.cache.find(
                (roles) => roles.id === result.role_gid
              );

              if (destinationRole) {
                if (destinationMember.roles.cache.has(result.role_gid)) {
                  try {
                    await destinationMember.roles.remove(destinationRole).catch(console.error);
                    removed = true;
                  } catch (err) {
                    // this error can happen if bot can't remove role from player
                    console.error(err);
                  }
                }

                if (result.log_gid && removed === true) {
                  const log = destinationServer.channels.cache.find(
                    (channel) => channel.id === result.log_gid
                  );

                  if (log) {
                    if (removed === true) {
                      log.send(
                        `**${destinationMember.toString()}** has left **${
                          member.guild.name
                        }** server and his role **${destinationRole.name}** got removed`
                      );
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
    });
  },
};
