const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

const clientId = process.env.clientId;
const guildId = process.env.guildId;
const token = process.env.token;

const app = require('express')();

app.get('/refresh', async (req, res) => {

  const commands = [];
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(token);

  (async () => {
    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );

      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {

      console.error(error);
    }
  })();
})

app.listen(3000, () => {})


const client = new Client({ intents: [GatewayIntentBits.Guilds] });


const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(token);