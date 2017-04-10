const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPOn extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpon',
			group: 'admin',
			memberName: 'fpon',
			description: 'Enables the bot.',
			examples: ['fpon'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	isUsable(message) {
		return !message.guild.settings.get('enabled', true);
	}

	async run(message) {
		await message.guild.settings.set('enabled', true);
		return message.reply('The bot is back online.');
	}
};
