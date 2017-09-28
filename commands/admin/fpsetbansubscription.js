const Commando = require('discord.js-commando');
const constants = require('../../lib/constants');
const util = require('../../lib/util');

module.exports = class FPSetBanSubscription extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpsetbansubscription',
			group: 'admin',
			memberName: 'fpsetbansubscription',
			description: 'Sets the ban subscription mode (NONE, GLOBAL, ALL).',
			examples: ['fpsetbansubscription GLOBAL'],
			guildOnly: true,
			args: [
				{
					key: 'subscriptionMode',
					label: 'Subscription Mode',
					prompt: 'What should the subscription mode be?',
					type: 'bansubscription'
				}
			]
		});
	}

	hasPermission(message) {
		//return util.isInModeratorChannel(message) && !message.guild.settings.get('master', false);
		return false;
	}

	async run(message, args) {
		await message.guild.settings.set('banSubscriptionMode', constants.BAN_SUBSCRIPTION_TYPES.indexOf(args.subscriptionMode));
		return message.reply(`The ban subscription mode was set to **${args.subscriptionMode}**.`);
	}
};
