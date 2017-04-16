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
		return message.guild.settings.get('enabled', false);
	}

	async run(message) {
		const user = message.member.user;
		await message.guild.settings.set('enabled', false);
		await util.log(message.guild, `${user.username}#${user.discriminator} (<@${user.id}>) turned off the bot.`);
		return message.reply('The bot is has been disabled.');
	}
};
