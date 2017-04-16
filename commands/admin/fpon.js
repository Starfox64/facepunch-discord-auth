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
		return !message.guild.settings.get('enabled', false) && util.isInModeratorChannel(message);
	}

	async run(message) {
		const user = message.member.user;
		await message.guild.settings.set('enabled', true);
		await util.log(message.guild, `**ON**: ${user.username}#${user.discriminator} (<@${user.id}>) turned the bot back on.`);
		return message.reply('The bot is back online.');
	}
};
