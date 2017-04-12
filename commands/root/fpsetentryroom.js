const Commando = require('discord.js-commando');

module.exports = class FPSetEntryRoom extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetentryroom',
			group: 'root',
			memberName: 'fpsetentryroom',
			description: 'Defines the current channel as the entry room.',
			examples: ['fpsetentryroom'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return this.client.isOwner(message.author) || message.member.hasPermission('ADMINISTRATOR');
	}

	async run(message) {
		await message.guild.settings.set('entryRoom', message.channel.id);
		return message.reply(`The entry room was set to **${message.channel.name}**.`);
	}
};
