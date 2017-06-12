const Commando = require('discord.js-commando');
const util = require('../../lib/util');

module.exports = class FPEnableWelcome extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpenablewelcome',
			group: 'admin',
			memberName: 'fpenablewelcome',
			description: 'Enables or disables the bot\'s welcome message.',
			examples: ['fpenablewelcome false'],
			guildOnly: true,
			args: [
				{
					key: 'enabled',
					label: 'enabled',
					prompt: 'Should the welcome message be sent to new members?',
					type: 'boolean',
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		await message.guild.settings.set('welcome', args.enabled);
		return message.reply(`The welcome message was set to **${args.enabled}**.`);
	}
};
