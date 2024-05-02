const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, Routes, Partials } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { createPool } = require("mysql");
const { config, mysql, mongodb_link } = require("./config.json");
const mongoose = require("mongoose");

//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

/*
const express = require('express');
const app = express();
*/

//Perms int: 2193080970448
//https://discord.com/api/oauth2/authorize?client_id=817396326605127711&permissions=2193080970448&scope=bot%20applications.commands

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
    Partials.ThreadMember,
  ],
  allowedMentions: { parse: ["everyone", "users", "roles"] },
});

client.inviteLink = `https://discord.com/api/oauth2/authorize?client_id=817396326605127711&permissions=2193080970448&scope=bot%20applications.commands`;

// START MySQL
client.db = createPool(mysql);
// END MySQL

// START MONGODB
(async () => {
  try {
    await mongoose.connect(mongodb_link);
  } catch (error) {
    console.log(error);
  }
})();
// END MONGODB

// START Commands section
client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
  if (command.autoload) {
    command.autoload(client);
  }
}

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log(`Started refreshing ${client.commands.size} application (/) commands.`);

    const data = await rest.put(Routes.applicationCommands(config.clientId), {
      body: commands,
    });

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

// END Commands section

// START Events section
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}
// END Events section

// Set up a global error handler
/*
process.on("unhandledRejection", (error) => {
    console.error("Unhandled Promise Rejection:", error);
});
*/

// Login to Discord with your client's token
client.login(config.token);

/*
app.get('/discord', (req, res) => {
	const channel = client.channels.cache.get('1022810212165496842');
	//channel.send('Hello from the API!');
	res.send(client.channels.cache);
});

app.listen(3000, () => {
  console.log('API server started on port 3000');
});
*/
