const Commando = require('discord.js-commando');

module.exports = class FPSetLogChannel extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetlogchannel',
			group: 'root',
			memberName: 'fpsetlogchannel',
			description: 'Defines the current channel as the log channel.',
			examples: ['fpsetlogchannel'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return this.client.isOwner(message.author) || message.member.hasPermission('ADMINISTRATOR');
	}

	async run(message) {
		await message.guild.settings.set('logChannel', message.channel.id);
		return message.reply(`The log channel was set to **${message.channel.name}**.`);
	}
};
