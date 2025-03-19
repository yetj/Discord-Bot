const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "guildMemberRemove",
  async execute(client, member) {
    const chn = member.guild.systemChannel;

    if (!chn) return console.log(`[${member.guild.name}] (LeaveInfo) System channel is not set.`);

    const canSee = chn.permissionsFor(client.user).has(PermissionsBitField.Flags.ViewChannel);
    const canWrite = chn.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages);

    if (!canSee)
      return console.log(
        `[${member.guild.name}] (LeaveInfo) No permissions to see System Channel.`
      );

    if (!canWrite)
      return console.log(
        `[${member.guild.name}] (LeaveInfo) No permissions to write on System Channel.`
      );

    chn.send(`***${member.displayName}** has just left the server... Bye Bye...*`);
  },
};
