const Commando = require('discord.js-commando');
const Ban = require('../../models/ban');
const util = require('../../lib/util');
const constants = require('../../lib/constants');
const moment = require('moment-timezone');

module.exports = class FPBans extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpbans',
			group: 'admin',
			memberName: 'fpbans',
			description: 'List a user\'s bans.',
			examples: ['fpbans @Postal'],
			guildOnly: true,
			args: [
				{
					key: 'user',
					label: 'User',
					prompt: 'Which user\'s bans do you want to see?',
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
		const guild = message.guild;
		const user = args.user;
		const bans = await Ban.find({ user: user.id, guild: guild.id });
		if (bans.length === 0) return message.reply('This user does not have any bans.');

		let reply = `Here are **${user.username}**'s bans:`;
		for (const ban of bans) {
			const createdAt = moment(ban.createdAt).tz('UTC').format(constants.DATE_FORMAT);
			const duration = ban.duration === 0 ? 'permanent' : ban.duration / 60 + ' minutes';
			const moderator = await message.client.fetchUser(ban.moderator);
			reply = reply + `\n - [${createdAt}] ${duration} "${ban.reason}" — ${moderator.username}`;
		}

		return message.reply(reply);
	}
};
