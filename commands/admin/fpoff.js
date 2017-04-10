const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPOff extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpoff',
			group: 'admin',
			memberName: 'fpoff',
			description: 'Disables the bot.',
			examples: ['fpoff'],
			guildOnly: true
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	isUsable(message) {
		return message.guild.settings.get('enabled', true);
	}

	async run(message) {
		await message.guild.settings.set('enabled', false);
		return message.reply('The bot is has been disabled.');
	}
};
