const Commando = require('discord.js-commando');
const User = require('../../models/user');
const constants = require('../../lib/constants');
const util = require('../../lib/util');

module.exports = class FPGetDiscord extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpgetdiscord',
			group: 'admin',
			memberName: 'fpgetdiscord',
			description: 'Attempts to look for discord users linked to the specified Facepunch ID.',
			examples: ['fpgetdiscord 513945'],
			guildOnly: true,
			args: [
				{
					key: 'facepunchId',
					label: 'Facepunch ID',
					prompt: 'What is the Facepunch ID you wish to look for?',
					type: 'integer',
					wait: 30
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		const facepunchId = args.facepunchId;
		const users = await User.find({ facepunchId });

		if (users.length === 0) return message.reply(`Nobody is known by that Facepunch ID (${facepunchId})`);

		let res = `Here are the discord account(s) linked to ${constants.FP_PROFILE_URL}${facepunchId} :`;
		for (const user of users) {
			res = res + `\n - <@${user.discordId}>`;
		}

		return message.reply(res);
	}
};
