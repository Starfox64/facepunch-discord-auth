const Commando = require('discord.js-commando');
const Ban = require('../../models/ban');
const User = require('../../models/user');
const constants = require('../../lib/constants');
const util = require('../../lib/util');

module.exports = class FPBan extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'fpban',
			group: 'admin',
			memberName: 'fpban',
			description: 'Bans a user and all of his alt discord accounts.',
			examples: ['fpban @Postal 1440 "loss"'],
			guildOnly: true,
			args: [
				{
					key: 'user',
					label: 'User',
					prompt: 'Which user do you want to ban?',
					type: 'member',
					wait: 30
				},
				{
					key: 'minutes',
					label: 'Minutes (0=perm)',
					prompt: 'For how many minutes (0 is perm)?',
					type: 'integer',
					min: 0,
					default: 0,
					wait: 30
				},
				{
					key: 'reason',
					label: 'Reason',
					prompt: 'Why?',
					type: 'string',
					default: 'N/A',
					wait: 60
				}
			]
		});
	}

	hasPermission(message) {
		return util.isInModeratorChannel(message);
	}

	async run(message, args) {
		const user = args.user;
		const minutes = args.minutes;
		const reason = args.reason;
		const userData = User.findOne({ discordId: user.id });
		const toBan = [user.id];

		//TODO: Can ban

		if (userData && userData.facepunchId) {
			const alts = User.find({ facepunchId: userData.facepunchId, discordId: { $not: user.id } });

			for (const alt of alts) {
				toBan.push(alt.discordId);
			}
		}

		for (const id of toBan) {
			await Ban.create({
				user: id,
				moderator: message.author.id,
				guild: message.guild.id,
				reason,
				duration: minutes * 60
			});

			let member;
			try {
				member = await message.guild.fetchMember(await message.client.fetchUser(id));
			} catch (e) {
				continue;
			}

			member.kick();
		}
	}
};
