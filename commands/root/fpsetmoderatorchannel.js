const Commando = require('discord.js-commando');

module.exports = class FPSetModeratorChannel extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetmoderatorchannel',
			group: 'root',
			memberName: 'fpsetmoderatorchannel',
			description: 'Defines the current channel as the moderator channel.',
			examples: ['fpsetmoderatorchannel'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return this.client.isOwner(message.author) || message.member.hasPermission('ADMINISTRATOR');
	}

	async run(message) {
		await message.guild.settings.set('moderatorChannel', message.channel.id);
		return message.reply(`The moderator channel was set to ${message.channel.name}.`);
	}
};
