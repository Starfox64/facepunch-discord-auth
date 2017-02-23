'use strict';

const Discord = require('discord.js');

let discordClient = new Discord.Client();

discordClient.on('ready', () => {
	let guild = discordClient.guilds.get(process.env.FPAUTH_GUILD);

	console.log(`Roles for ${guild.name}:`);

	for (let role of guild.roles.values()) {
		console.log(`'${role.id}' => ${role.name}`);
	}

	discordClient.destroy();
});

discordClient.login(process.env.FPAUTH_DISCORD_TOKEN);
