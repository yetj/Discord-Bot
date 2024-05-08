module.exports = {
  name: "guildDelete",
  async execute(client, guild) {
    console.log(`> Bot has left the server: ${guild.name} (#${guild.id})`);

    /*
        client.db.query(`DELETE FROM sync WHERE gid = '${guild.id}' OR source = '${guild.id}'`, (err, result) => {
            if (err) {
                console.error(err)
            }
            console.log(`>>> Removed sync servers connected with this server`)
        })

        client.db.query("SELECT * FROM sync", (err, result, fields) => {
            if (err) {
                console.error(err)
            }
            client.sync = JSON.parse(JSON.stringify(result));
        })
        */
  },
};
