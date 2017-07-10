const Commando = require('discord.js-commando');

module.exports = class FPSetEditLogChannel extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpseteditlogchannel',
			group: 'root',
			memberName: 'fpseteditlogchannel',
			description: 'Defines the current channel as the edits log channel.',
			examples: ['fpseteditlogchannel'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return this.client.isOwner(message.author) || message.member.hasPermission('ADMINISTRATOR');
	}

	async run(message) {
		await message.guild.settings.set('editLogChannel', message.channel.id);
		return message.reply(`The edits log channel was set to **${message.channel.name}**.`);
	}
};
