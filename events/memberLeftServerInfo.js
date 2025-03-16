module.exports = {
  name: "guildMemberRemove",
  async execute(client, member) {
    const chn = member.guild.systemChannel;

    if (chn) {
      try {
        await chn.send(`***${member.displayName}** has just left server... Bye Bye...*`);
      } catch (err) {
        console.error("[2dde18] ", err);
        //return await interaction.reply({ content: `>  Error . Please try again later.`, ephemeral: true });
      }
    } else {
      console.log(`[${member.guild.name}] Can't find correct channel.`);
    }
  },
};
