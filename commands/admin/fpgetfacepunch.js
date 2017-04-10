const Commando = require('discord.js-commando');
const User = require('../../models/user');
const constants = require('../../lib/constants');
const util = require('../../lib/util');

module.exports = class FPGetFacepunch extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpgetfacepunch',
			group: 'admin',
			memberName: 'fpgetfacepunch',
			description: 'Attempts to look for a facepunch profile linked to the specified user.',
			examples: ['fpgetfacepunch @Postal'],
			guildOnly: true,
			args: [
				{
					key: 'user',
					label: 'User',
					prompt: 'Which user do you want to query?',
					type: 'user',
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		const user = args.user;
		let userData = await User.findOne({ discordId: user.id });

		if (!userData || !userData.facepunchId) return message.reply(`Nobody is known by that Discord ID (${user.id})`);

		return message.reply(`Here is <@${user.id}>'s facepunch profile ${constants.FP_PROFILE_URL}${userData.facepunchId}`);
	}
};
