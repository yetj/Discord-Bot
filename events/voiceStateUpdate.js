module.exports = {
    name: 'voiceStateUpdate',
	async execute(client, oldMember, newMember) {
        try {
			const voiceServers = ['952530586210271262', '1090198324277162044', '1090200705408708648', '1090200751508312134', '1090200792683773962', '952532936438214706', '1090203020844867654', '1090204368063705219', '1090204397847453696', '1090204567192481833'];

			if (voiceServers.indexOf(newMember.guild.id) > -1) {
				const server = await client.guilds.cache.get('1064500526261211136') //pmpl server
				let chn = await server.channels.cache.find(c => c.name === '🔊-logs')
				let chn2 = await newMember.guild.channels.cache.find(c => c.name === '🔊-logs')

				if (chn && chn2) {
					if (newMember.channel == null) {
						if (oldMember.channel !== null) {
							chn.send(`⛔ **<@${newMember.member.id}>** **disconnected** from channel <#${oldMember.channel.id}>`);
							chn2.send(`⛔ **<@${newMember.member.id}>** **disconnected** from channel <#${oldMember.channel.id}>`);
						}
						else {
							chn.send(`⛔ **<@${newMember.member.id}>** **disconnected** from *unknown* channel`);
							chn2.send(`⛔ **<@${newMember.member.id}>** **disconnected** from *unknown* channel`);
						}
					}
					else {
						if (oldMember.selfMute == false && newMember.selfMute == true) {
							chn.send(`🔇 **<@${newMember.member.id}>** __selfmuted__ on channel ${newMember.channel}`);
							chn2.send(`🔇 **<@${newMember.member.id}>** __selfmuted__ on channel ${newMember.channel}`);
						}
						if (oldMember.selfMute == true && newMember.selfMute == false) {
							chn.send(`🔊 **<@${newMember.member.id}>** *unmuted* on channel ${newMember.channel}`);
							chn2.send(`🔊 **<@${newMember.member.id}>** *unmuted* on channel ${newMember.channel}`);
						}
						if (oldMember.channel == null) {
							chn.send(`:white_check_mark: **<@${newMember.member.id}>** connected to channel <#${newMember.channel.id}>`);
							chn2.send(`:white_check_mark: **<@${newMember.member.id}>** connected to channel <#${newMember.channel.id}>`);
						}
					}
				}
			}
        }
        catch (err) {
            console.error(err)
        }
    },
};