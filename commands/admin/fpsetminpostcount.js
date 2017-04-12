const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPSetMinPostCount extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetminpostcount',
			group: 'admin',
			memberName: 'fpsetminpostcount',
			description: 'Sets the minimum amount of posts required to authenticate.',
			examples: ['fpsetminpostcount 25'],
			guildOnly: true,
			args: [
				{
					key: 'minPostCount',
					label: 'Minimum posts',
					prompt: 'Do you want to update nicknames?',
					type: 'integer',
					min: -1,
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message) && message.guild.settings.get('registrar', false);
	}

	async run(message, args) {
		await message.guild.settings.set('minPostCount', args.minPostCount);
		return message.reply(`The minimum post count was set to **${args.minPostCount}**.`);
	}
};
