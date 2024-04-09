module.exports = {
  name: "guildMemberRemove",
  async execute(client, member) {
    const chn = member.guild.systemChannel;

    if (chn) {
      chn.send(`***${member.displayName}** has just left server... Bye Bye...*`);
    } else {
      console.log(`[${member.guild.name}] Can't find correct channel.`);
    }
  },
};
