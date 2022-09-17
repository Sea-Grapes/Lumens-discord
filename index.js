const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const token = process.env['TOKEN'];
const guildId = process.env['GUILD_ID'];
const clientId = process.env['CLIENT_ID'];

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });



const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


client.commands = new Collection();

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}

const rest = new REST({ version: '9' }).setToken(token);

// console.log(commands);

client.on('ready', () => {
  console.log('Systems online');

  (async () => {
    try {
      console.log('Started refreshing application (/) commands.');
      if (!guildId) {
        await rest.put(
          Routes.applicationCommands(clientId), {
          body: commands
        },
        );
        console.log('Successfully reloaded application (/) commands globally.');
      } else {
        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId), {
          body: commands
        },
        );
        console.log('Successfully reloaded application (/) commands with development fallback.');
      }
    } catch (error) {
      if (error) console.error(error);
    }
  })();

});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (error) {
    if (error) console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});


client.login(token);