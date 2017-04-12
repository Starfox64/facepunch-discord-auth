const Commando = require('discord.js-commando');
const User = require('../../models/user');
const util = require('../../lib/util');

module.exports = class FPAliases extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpaliases',
			group: 'admin',
			memberName: 'fpaliases',
			description: 'Attempts to look for known aliases for this user.',
			examples: ['fpaliases @Postal'],
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

		if (!userData || userData.aliases.length === 0) return message.reply(`This user does not have any known aliases (${user.id})`);
		let reply = `Here are <@${user.id}>'s aliases:`;
		for (let alias of userData.aliases) {
			reply = reply + `\n - *${alias}*`;
		}

		return message.reply(reply);
	}
};
