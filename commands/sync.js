const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const Sync = require("../dbmodels/sync.js");
const getDisplayName = require("../utils/getDisplayName.js");

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
            option.setName("name").setDescription("Sync name").setRequired(true)
          )
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
          .addBooleanOption((option) =>
            option
              .setName("space_after_prefix")
              .setDescription("Add space after prefix? (default: true)")
          )
      //.addBooleanOption(option => option.setName('same_role').setDescription('Should bot ignore role_gid, and try to find the same role name as it is on source server?'))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove server")
        .addStringOption((option) =>
          option
            .setName("sync_id")
            .setDescription("Name of the sync")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List synced connections with this current server")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reload")
        .setDescription("Reload synchronization for specific entry")
        .addStringOption((option) =>
          option
            .setName("sync_id")
            .setDescription("Name of the sync")
            .setRequired(true)
            .setAutocomplete(true)
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
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);

    let choices = [];
    if (focusedOption.name === "sync_id") {
      try {
        const syncDB = await Sync.find({
          gid: interaction.guildId,
        }).sort({ option: 1 });

        await syncDB.forEach((sync) => {
          choices.push({
            name: `${sync.name}`,
            value: sync._id.toString(),
          });
        });
      } catch (err) {
        console.error(err);
      }

      const filtered = choices.filter((choice) => choice.name.startsWith(focusedOption.value));

      await interaction.respond(
        filtered.map((choice) => ({ name: choice.name, value: choice.value }))
      );
    }
  },
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: `You don't have permission to execute this command!`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() === "new") {
      const name = interaction.options.getString("name");
      const source = interaction.options.getString("source");
      const role_source = interaction.options.getString("role_source");
      const role_gid = interaction.options.getRole("role_gid");
      const update_nick = interaction.options.getBoolean("update_nick");
      const log_gid = interaction.options.getChannel("log_gid");
      const prefix = interaction.options.getString("prefix");
      const space_after_prefix = interaction.options.getBoolean("space_after_prefix") ?? true;
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
          content: `Such entry already exist in database with name **${isSyncExist?.name}**...`,
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
        space_after_prefix: space_after_prefix,
        created_by: interaction.member.id,
        name: name,
      });

      try {
        await newDatabase.save();

        let message = "";
        message += `**ID:** *${newDatabase._id.toString()}*\n`;
        message += `**Name:** *${newDatabase.name}*\n`;
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
          message += `**Prefix:** *not set*\n`;
        } else {
          message += `**Prefix:** *${setPrefix}*\n`;
        }

        if (space_after_prefix === false) {
          message += `**Space after prefix:** *false*`;
        } else {
          message += `**Space after prefix:** *true*`;
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
      const id = interaction.options.getString("sync_id");

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

        await interaction.reply(`> *Removed sync with ID: **${id}***`);
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

      await interaction.deferReply();

      let fields = [];

      //await found.forEach(async (el) => {
      for await (const el of found) {
        const sourceServer = interaction.client.guilds.cache.get(el.source);
        const destinationServer = interaction.client.guilds.cache.get(el.gid);
        const sourceRole = sourceServer.roles.cache.find((r) => r.id === el.role_source);
        const destinationRole = destinationServer.roles.cache.find((r) => r.id === el.role_gid);
        const log_gid = destinationServer.channels.cache.find((c) => c.id === el.log_gid);
        const update_nick = el.update_nick;
        const prefix = el.prefix === "" ? "*not set*" : el.prefix;
        const space_after_prefix = el.space_after_prefix;
        const logChannel = log_gid ? log_gid.toString() + " - #" + log_gid.id : "*not set*";
        const name = el?.name === undefined ? "-" : el.name;

        fields.push({
          name: `Connection ID: ${el._id.toString()}`,
          value: `Name: **${name}**
                Source server: **${sourceServer.name}** - *#${sourceServer.id}*
                Source role: **${sourceRole.name}** - *@${sourceRole.id}*
                Destination server: **${destinationServer.name}** - *#${destinationServer.id}*
                Destination role: **${destinationRole?.name}** - *@${destinationRole?.id}*
                Update nick: **${update_nick}**
                Log channel: ${logChannel}
                Prefix: **${prefix}**
                Space after prefix: **${space_after_prefix}**`,
        });

        if (fields.length >= 5) {
          const embed = new EmbedBuilder()
            .setColor("#2222cc")
            .setTitle("Server connection list")
            .setDescription(`We've found ${found.length} connection(s)`)
            .addFields(fields);

          fields = [];

          await interaction.followUp({ embeds: [embed] });
        }
      }

      if (fields.length > 0) {
        const embed = new EmbedBuilder()
          .setColor("#2222cc")
          .setTitle("Server connection list")
          .setDescription(`We've found ${found.length} connection(s)`)
          .addFields(fields);

        await interaction.followUp({ embeds: [embed] });
      }
    } else if (interaction.options.getSubcommand() === "reload") {
      const id = interaction.options.getString("sync_id");
      const remove_existing_members = interaction.options.getBoolean("remove_existing_members");
      const force_update_all_members = interaction.options.getBoolean("force_update_all_members");
      const skip_updating_members_with_role = interaction.options.getRole(
        "skip_updating_members_with_role"
      );

      let found = null;
      try {
        found = await Sync.findOne({ gid: interaction.guildId, _id: id });
      } catch (err) {
        return await interaction.reply(
          `> *There was a problem with connecting to Database, try again later.*`
        );
      }

      if (!found) {
        return await interaction.reply(
          `> *Sync ID \`${id}\` not found in database or is not set for this server.*`
        );
      }

      // check if bot is still on source server
      const sourceServer = await interaction.client.guilds.cache.get(found.source);
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

      const destinationServer = await interaction.client.guilds.cache.get(found.gid);
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
      let rolesNoPerms = [];
      let promises = [];

      const roleHandle = await destinationServer.roles.cache.find((r) => r.id === found.role_gid);

      if (!roleHandle) {
        return await interaction.reply(`> *Destination role not found \`${found.role_gid}\`...*`);
      }

      let fields = [];

      await interaction.deferReply();

      //for (const member of rolesToAdd) {
      //await rolesToAdd.forEach((member) => {
      for await (const [userId, member] of rolesToAdd.entries()) {
        const memberX = await destinationServer.members.cache.find((m) => m.id === member.id);

        if (memberX) {
          if (
            !skip_updating_members_with_role ||
            !memberX.roles.cache.find((r) => r.id === skip_updating_members_with_role.id)
          ) {
            const hasRole = await memberX.roles.cache.find((r) => r.id === roleHandle.id);
            if (!hasRole) {
              //await memberX.roles.add(roleHandle, "Synchronization").then().catch(console.error);
              try {
                promises.push(
                  memberX.roles.add(roleHandle, "Synchronization").then().catch(console.error)
                );
              } catch (err) {
                rolesNoPerms.push(getDisplayName(memberX));
              }
            }

            if (found.update_nick === true) {
              if (found.prefix.length > 0) {
                let space_after_prefix = found?.space_after_prefix ? " " : "";

                let newNickname = "";

                if (getDisplayName(member).startsWith(found.prefix + space_after_prefix)) {
                  newNickname = getDisplayName(member);
                } else {
                  newNickname = found.prefix + space_after_prefix + getDisplayName(member);
                }

                if (newNickname.length > 32) {
                  newNickname = newNickname.substring(0, 31);
                }

                if (!getDisplayName(memberX).includes(newNickname)) {
                  promises.push(
                    memberX
                      .setNickname(newNickname)
                      .then()
                      .catch((err) => {
                        console.error(
                          `[hf89d] Couldn't change player nickname to "${newNickname}". Reason: ${err.message}`
                        );
                      })
                  );
                  //await memberX.setNickname(newNickname);
                }
              } else {
                promises.push(
                  memberX
                    .setNickname(getDisplayName(member))
                    .then()
                    .catch((err) => {
                      console.error(
                        `[h452r2] Couldn't change player nickname to "${getDisplayName(
                          member
                        )}". Reason: ${err.message}`
                      );
                    })
                );
                //await memberX.setNickname(getDisplayName(member));
              }
            }

            rolesAdded.push(getDisplayName(memberX));

            if (
              rolesAdded.join("\n").length +
                rolesRemoved.join("\n").length +
                rolesSkipped.join("\n").length +
                rolesNoPerms.join("\n").length >
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

              if (rolesNoPerms.length > 0) {
                fields.push({
                  name: `No permissions:`,
                  value: rolesNoPerms.sort().join("\n") + "\n-",
                  inline: true,
                });
              }

              const embed = new EmbedBuilder()
                .setColor("#2222cc")
                .setTitle(`Synchronization results ${found.name}`)
                .setDescription(
                  `> Added roles: **${rolesAdded.length}**\n> Removed roles: **${rolesRemoved.length}**\n> Skipped: **${rolesSkipped.length}**`
                )
                .addFields(fields);

              //interaction.reply({ embeds: [embed], ephemeral: true });

              await interaction.followUp({ embeds: [embed] });

              fields = [];
              rolesAdded = [];
              rolesRemoved = [];
              rolesSkipped = [];
              rolesNoPerms = [];
            }
          } else {
            rolesSkipped.push(getDisplayName(member));
          }
        }
      }

      if (remove_existing_members === true) {
        //for (const member of rolesToRemove) {
        //rolesToRemove.forEach((member) => {
        for await (const [userId, member] of rolesToRemove.entries()) {
          //          await member.roles.remove(roleHandle, "Synchronization").then().catch(console.error);

          try {
            promises.push(
              member.roles.remove(roleHandle, "Synchronization").then().catch(console.error)
            );
            rolesRemoved.push(getDisplayName(member));
          } catch (err) {
            rolesNoPerms.push(getDisplayName(member));
          }

          if (
            rolesAdded.join("\n").length +
              rolesRemoved.join("\n").length +
              rolesSkipped.join("\n").length +
              rolesNoPerms.join("\n").length >
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

            if (rolesNoPerms.length > 0) {
              fields.push({
                name: `No permissions:`,
                value: rolesNoPerms.sort().join("\n") + "\n-",
                inline: true,
              });
            }

            const embed = new EmbedBuilder()
              .setColor("#2222cc")
              .setTitle(`Synchronization results ${found.name}`)
              .setDescription(
                `> Added roles: **${rolesAdded.length}**\n> Removed roles: **${rolesRemoved.length}**\n> Skipped: **${rolesSkipped.length}**`
              )
              .addFields(fields);

            //interaction.reply({ embeds: [embed], ephemeral: true });

            await interaction.followUp({ embeds: [embed] });

            fields = [];
            rolesAdded = [];
            rolesRemoved = [];
            rolesSkipped = [];
            rolesNoPerms = [];
          }
        }
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

      if (rolesNoPerms.length > 0) {
        await fields.push({
          name: `No permissions:`,
          value: rolesNoPerms.sort().join("\n") + "\n-",
          inline: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor("#2222cc")
        .setTitle(`Synchronization results ${found.name}`)
        .setDescription(
          `> Added roles: **${rolesAdded.length}**\n> Removed roles: **${rolesRemoved.length}**\n> Skipped: **${rolesSkipped.length}**`
        )
        .addFields(fields);

      await interaction.followUp({ embeds: [embed] });
      //await interaction.reply({ embeds: [embed], ephemeral: true });

      await Promise.all(promises);
      await interaction.followUp(
        `> Hey ${interaction.member}! Synchronization \`${found.name}\` of **${promises.length}** member(s) finished! All roles and nicknames updated...`
      );
    }
  },
  async autoload(client) {
    // remove sync if bot is removed from source or destination server
    client.on("guildDelete", async (guild) => {
      try {
        const result = await Sync.deleteMany({ $or: [{ gid: guild.id }, { source: guild.id }] });

        if (result.deletedCount > 0) {
          console.log(
            `>>> [SYNC] Bot removed from server - removed sync connected with server ID: #${guild.id}`
          );
        }
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
        //results.forEach(async (result) => {
        for await (const result of results) {
          const destinationServer = await client.guilds.cache.get(result.gid);
          const sourceServer = await client.guilds.cache.get(result.source);

          if (sourceServer) {
            const destinationMember = await destinationServer.members.cache.get(member.user.id);
            const sourceMember = await sourceServer.members.cache.get(member.user.id);

            if (sourceMember) {
              let assigned = false;
              let nicknameChanged = false;

              if (result.same_role == 0) {
                const sourceRole = await sourceMember.roles.cache.find(
                  (roles) => roles.id === result.role_source
                );

                if (sourceRole) {
                  // check if role still exists on destination server
                  const destinationRole = await destinationServer.roles.cache.find(
                    (roles) => roles.id === result.role_gid
                  );

                  if (destinationRole) {
                    const hasRole = await destinationMember.roles.cache.has(result.role_gid);
                    if (!hasRole) {
                      try {
                        await destinationMember.roles.add(destinationRole).catch(console.error);
                        assigned = true;
                      } catch (err) {
                        // this error can happen if bot can't assign role to player
                        console.error(err);
                      }
                    }

                    if (result.update_nick === true) {
                      let newNickname = "";
                      try {
                        let space_after_prefix = result?.space_after_prefix ? " " : "";

                        if (
                          getDisplayName(sourceMember).startsWith(
                            result.prefix + space_after_prefix
                          )
                        ) {
                          newNickname = getDisplayName(sourceMember);
                        } else {
                          newNickname =
                            result.prefix + space_after_prefix + getDisplayName(sourceMember);
                        }

                        if (newNickname.length > 32) {
                          newNickname = newNickname.substring(0, 31);
                        }

                        await destinationMember.setNickname(newNickname);
                        nicknameChanged = true;
                      } catch (err) {
                        // this error can happen if bot can't change player nickname
                        console.error(
                          `[nu9f34] Couldn't change player nickname to ${newNickname}. Reason: ${err.message}`
                        );
                        //console.error(err);
                      }
                    }

                    if (result.log_gid && (assigned === true || nicknameChanged === true)) {
                      const log = await destinationServer.channels.cache.find(
                        (channel) => channel.id === result.log_gid
                      );

                      if (log) {
                        if (assigned === true && nicknameChanged === true) {
                          await log.send(
                            `**${destinationMember.toString()}** has joined and got role **${
                              destinationRole.name
                            }** plus his **nickname has been updated**`
                          );
                        } else if (assigned === true && nicknameChanged === false) {
                          await log.send(
                            `**${destinationMember.toString()}** has joined and got role **${
                              destinationRole.name
                            }**`
                          );
                        } else if (assigned === false && nicknameChanged === true) {
                          await log.send(
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
                      let space_after_prefix = result?.space_after_prefix ? " " : "";
                      let newNickname = "";

                      if (
                        getDisplayName(sourceMember).startsWith(result.prefix + space_after_prefix)
                      ) {
                        newNickname = getDisplayName(sourceMember);
                      } else {
                        newNickname =
                          result.prefix + space_after_prefix + getDisplayName(sourceMember);
                      }

                      if (newNickname.length > 32) {
                        newNickname = newNickname.substring(0, 31);
                      }

                      try {
                        await destinationMember.setNickname(newNickname);
                        nicknameChanged = true;
                      } catch (err) {
                        // this error can happen if bot can't change player nickname
                        //console.error(err);
                        console.error(
                          `[fnjiug] Couldn't change player nickname to "${newNickname}". Reason: ${err.message}`
                        );
                      }
                    }

                    if (result.log_gid && (assigned === true || nicknameChanged === true)) {
                      const log = destinationServer.channels.cache.find(
                        (channel) => channel.id === result.log_gid
                      );

                      if (log) {
                        if (assigned === true && nicknameChanged === true) {
                          await log.send(
                            `**${destinationMember.toString()}** has joined and got automatically role **${
                              destinationRole.name
                            }** plus his **nickname has been updated**`
                          );
                        } else if (assigned === true && nicknameChanged === false) {
                          await log.send(
                            `**${destinationMember.toString()}** has joined and got automatically role **${
                              destinationRole.name
                            }**`
                          );
                        } else if (assigned === false && nicknameChanged === true) {
                          await log.send(
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
        }
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
        //removedRoles.forEach((role) => {
        for await (const [roleId, role] of removedRoles.entries()) {
          // check if we should care of removed role
          rolesToProceed = results.filter((el) => el.role_source == role.id);
          if (rolesToProceed.length > 0) {
            //rolesToProceed.forEach(async (result) => {
            for await (const result of rolesToProceed) {
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
            }
          }
        }

        // check all added roles
        //addedRoles.forEach((role) => {
        for await (const [roleId, role] of addedRoles.entries()) {
          // check if we should care of removed role
          rolesToProceed = results.filter((el) => el.role_source == role.id);
          if (rolesToProceed.length > 0) {
            //rolesToProceed.forEach(async (result) => {
            for await (const result of rolesToProceed) {
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
                      let space_after_prefix = result?.space_after_prefix ? " " : "";
                      let newNickname = "";

                      if (
                        getDisplayName(newMember).startsWith(result.prefix + space_after_prefix)
                      ) {
                        newNickname = getDisplayName(newMember);
                      } else {
                        newNickname =
                          result.prefix + space_after_prefix + getDisplayName(newMember);
                      }
                      if (newNickname.length > 32) {
                        newNickname = newNickname.substring(0, 31);
                      }

                      try {
                        await destinationMember.setNickname(newNickname);
                        nicknameChanged = true;
                      } catch (err) {
                        console.error(
                          `[j65jnf] Couldn't change player nickname to "${newNickname}". Reason: ${err.message}`
                        );
                        // this error can happen if bot can't change player nickname
                        //console.error(err);
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
            }
          }
        }
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

      //
      try {
        for await (const result of results) {
          let removed = false;

          // check if member had synced role on the source server
          if (!member.roles.cache.has(result.role_source)) continue;

          const destinationServer = await client.guilds.cache.get(result.gid);

          // check if bot is still on destination server
          if (!destinationServer) continue;

          const destinationMember = await destinationServer.members.cache.get(member.user.id);

          // check if member is on destination server
          if (!destinationMember) continue;

          const destinationRole = await destinationServer.roles.cache.find(
            (roles) => roles.id === result.role_gid
          );

          // check if destination role still exist
          if (!destinationRole) continue;

          // check if member has synced role on destination server
          if (!destinationMember.roles.cache.has(result.role_gid)) continue;

          try {
            await destinationMember.roles.remove(destinationRole).catch(console.error);
            removed = true;
          } catch (err) {
            // this error can happen if bot can't remove role from player
            console.error(err);
          }

          if (result.log_gid && removed === true) {
            const log = await destinationServer.channels.cache.find(
              (channel) => channel.id === result.log_gid
            );

            if (log) {
              if (removed === true) {
                await log.send(
                  `**${destinationMember.toString()}** has left **${
                    member.guild.name
                  }** server and his role **${destinationRole.name}** got removed`
                );
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      }

      /*
      try {
        //results.forEach(async (result) => {
        for await (const result of results) {
          const destinationServer = await client.guilds.cache.get(result.gid);

          if (destinationServer) {
            const destinationMember = await destinationServer.members.cache.get(member.user.id);

            let removed = false;

            // check if member is on destination server
            if (destinationMember) {
              // check if role still exists on destination server
              const destinationRole = await destinationServer.roles.cache.find(
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
                  const log = await destinationServer.channels.cache.find(
                    (channel) => channel.id === result.log_gid
                  );

                  if (log) {
                    if (removed === true) {
                      await log.send(
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
        }
      } catch (err) {
        console.error(err);
      }
      */
    });

    // remove sync if role was removed
    client.on("roleDelete", async (role) => {
      try {
        const result = await Sync.deleteMany({
          $or: [{ role_gid: role.id }, { role_source: role.id }],
        });

        if (result.deletedCount > 0) {
          console.log(
            `>>> [SYNC] Removed sync connected with role ID: #${role.id} - ${role.name} on server #${role.guild.id} - ${role.guild.name}`
          );
        }
      } catch (err) {
        console.error("[bhu34f] ", err);
      }
    });
  },
};
