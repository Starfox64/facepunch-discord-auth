const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetMaxIdleTime extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetmaxidletime',
			group: 'admin',
			memberName: 'fpsetmaxidletime',
			description: 'Sets the maximum amount of time an unauthenticated user can stay in the entry room.',
			examples: ['fpsetmaxidletime 600'],
			guildOnly: true,
			args: [
				{
					key: 'maxIdleTime',
					label: 'seconds',
					prompt: 'What should the maximum idle time be?',
					type: 'integer',
					min: 0,
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		await message.guild.settings.set('maxIdleTime', args.maxIdleTime);
		return message.reply(`The maximum idle time was set to ${args.maxIdleTime} seconds.`);
	}
};
