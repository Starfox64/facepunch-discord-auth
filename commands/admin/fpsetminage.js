const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetMinAge extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetminage',
			group: 'admin',
			memberName: 'fpsetminage',
			description: 'Sets the minimum account age required to authenticate.',
			examples: ['fpsetminage 1m'],
			guildOnly: true,
			args: [
				{
					key: 'minAge',
					label: 'Minimum account age',
					prompt: 'What is the minimum account age?',
					type: 'duration'
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message) && message.guild.settings.get('master', false);
	}

	async run(message, args) {
		await message.client.provider.set('global', 'minAge', args.minAge);
		return message.reply(`The minimum age was set to **${args.minAge}** seconds.`);
	}
};
